// Server-side public anime metadata only. MAL_CLIENT_ID must never use NEXT_PUBLIC_.
const MAL_ORIGIN = "https://api.myanimelist.net/v2";
const JIKAN_ORIGIN = "https://api.jikan.moe/v4";
const CACHE_TTL_MS = 60 * 60 * 1000;
const MAX_CACHE_ENTRIES = 250;
const MAX_PENDING_REQUESTS = 32;
const REQUEST_TIMEOUT_MS = 8000;
const JIKAN_INTERVAL_MS = 1100;
const MAX_JIKAN_WAIT_MS = 5500;
const MAL_FIELDS = "id,title,main_picture,synopsis,mean,rank,popularity,num_list_users,num_episodes,status,genres";

const cache = new Map();
const pending = new Map();
let nextJikanRequestAt = 0;
let jikanCooldownUntil = 0;

export class MalProviderError extends Error {
  constructor(message, code = "MAL_UNAVAILABLE", status = 502) {
    super(message);
    this.name = "MalProviderError";
    this.code = code;
    this.status = status;
  }
}

export function isMalConfigured() {
  return Boolean(process.env.MAL_CLIENT_ID?.trim());
}

function parseId(value) {
  if ((typeof value !== "number" && typeof value !== "string") || !/^[1-9]\d*$/.test(String(value))) {
    throw new RangeError("MyAnimeList ID must be a positive integer.");
  }
  const id = Number(value);
  if (!Number.isSafeInteger(id)) throw new RangeError("MyAnimeList ID must be a positive integer.");
  return id;
}

function numberOrNull(value, minimum = 0) {
  return typeof value === "number" && Number.isFinite(value) && value >= minimum ? value : null;
}

function textOrNull(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function imageOrNull(value) {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password ? url.href : null;
  } catch {
    return null;
  }
}

function normalize(data, source, id) {
  const official = source === "myanimelist";
  if (!data || (official ? data.id : data.mal_id) !== id) {
    throw new MalProviderError("MyAnimeList returned an invalid anime record.", "MAL_INVALID_RESPONSE");
  }
  const titles = Array.isArray(data.titles) ? data.titles : [];
  const title = textOrNull(data.title) || textOrNull(titles.find((item) => item?.type === "Default")?.title);
  if (!title) throw new MalProviderError("MyAnimeList returned an invalid anime record.", "MAL_INVALID_RESPONSE");
  const rawStatus = textOrNull(data.status)?.toLowerCase().replaceAll("_", " ");
  const status = ({ "finished airing": "Finished Airing", "currently airing": "Currently Airing", "not yet aired": "Not Yet Aired" })[rawStatus] || null;
  const score = numberOrNull(official ? data.mean : data.score, Number.EPSILON);
  return Object.freeze({
    id,
    title,
    score: score !== null && score <= 10 ? score : null,
    rank: numberOrNull(data.rank, 1),
    popularity: numberOrNull(data.popularity, 1),
    members: numberOrNull(official ? data.num_list_users : data.members),
    url: `https://myanimelist.net/anime/${id}`,
    synopsis: textOrNull(data.synopsis),
    episodes: numberOrNull(official ? data.num_episodes : data.episodes, 1),
    status,
    genres: Object.freeze(Array.isArray(data.genres) ? data.genres.map((genre) => textOrNull(genre?.name)).filter(Boolean) : []),
    poster: imageOrNull(official ? data.main_picture?.large || data.main_picture?.medium : data.images?.webp?.large_image_url || data.images?.jpg?.large_image_url || data.images?.jpg?.image_url),
    source,
  });
}

async function requestJson(url, headers, source) {
  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json", ...headers },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      // The bounded cache below also works in native Node tests and long-lived servers.
      cache: "no-store",
      redirect: "error",
    });
    if (response.status === 404) return null;
    if (response.status === 429) {
      if (source === "jikan") {
        const retrySeconds = Number(response.headers.get("retry-after"));
        const retryMs = Number.isFinite(retrySeconds) && retrySeconds > 0 ? Math.min(retrySeconds * 1000, 60000) : 60000;
        jikanCooldownUntil = Math.max(jikanCooldownUntil, Date.now() + retryMs);
        nextJikanRequestAt = Math.max(nextJikanRequestAt, jikanCooldownUntil);
      }
      throw new MalProviderError("MyAnimeList metadata is temporarily rate limited.", "MAL_RATE_LIMITED", 429);
    }
    if (!response.ok) throw new MalProviderError("MyAnimeList metadata is temporarily unavailable.", "MAL_UNAVAILABLE", response.status);
    return await response.json();
  } catch (error) {
    if (error instanceof MalProviderError) throw error;
    if (error?.name === "TimeoutError" || error?.name === "AbortError") {
      throw new MalProviderError("MyAnimeList metadata request timed out.", "MAL_TIMEOUT", 504);
    }
    throw new MalProviderError("MyAnimeList metadata is temporarily unavailable.");
  }
}

async function fromJikan(id) {
  // Pace distinct requests below Jikan's 3/second and 60/minute limits per process.
  const now = Date.now();
  const startAt = Math.max(now, nextJikanRequestAt);
  const waitMs = startAt - now;
  if (waitMs > MAX_JIKAN_WAIT_MS) {
    throw new MalProviderError("MyAnimeList metadata is temporarily rate limited.", "MAL_RATE_LIMITED", 429);
  }
  nextJikanRequestAt = startAt + JIKAN_INTERVAL_MS;
  if (waitMs > 0) await new Promise((resolve) => setTimeout(resolve, waitMs));
  // A request ahead of this queued lookup may have received a 429 while we waited.
  if (Date.now() < jikanCooldownUntil) {
    throw new MalProviderError("MyAnimeList metadata is temporarily rate limited.", "MAL_RATE_LIMITED", 429);
  }
  const response = await requestJson(`${JIKAN_ORIGIN}/anime/${id}`, {}, "jikan");
  return response === null ? null : normalize(response.data, "jikan", id);
}

async function loadAnime(id, clientId) {
  if (clientId) {
    try {
      const url = new URL(`${MAL_ORIGIN}/anime/${id}`);
      url.searchParams.set("fields", MAL_FIELDS);
      const data = await requestJson(url.href, { "X-MAL-CLIENT-ID": clientId }, "myanimelist");
      return data === null ? null : normalize(data, "myanimelist", id);
    } catch {
      // Public enrichment remains available when the configured official API is down.
      // Never forward the official API client ID to Jikan.
    }
  }
  return fromJikan(id);
}

/** Public anime metadata; null means not found. Provider failures throw MalProviderError. */
export async function getMalAnime(value) {
  const id = parseId(value);
  const clientId = process.env.MAL_CLIENT_ID?.trim() || "";
  const key = `${clientId ? "official" : "public"}:${id}`;
  const existing = cache.get(key);
  if (existing && existing.expiresAt > Date.now()) return existing.value;
  if (existing) cache.delete(key);
  if (pending.has(key)) return pending.get(key);
  if (pending.size >= MAX_PENDING_REQUESTS) {
    throw new MalProviderError("MyAnimeList metadata is temporarily busy.", "MAL_RATE_LIMITED", 429);
  }
  const request = loadAnime(id, clientId).then((result) => {
    if (cache.size >= MAX_CACHE_ENTRIES) cache.delete(cache.keys().next().value);
    cache.set(key, { value: result, expiresAt: Date.now() + CACHE_TTL_MS });
    return result;
  }).finally(() => pending.delete(key));
  pending.set(key, request);
  return request;
}
