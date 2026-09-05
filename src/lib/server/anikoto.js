import { load } from "cheerio";

const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_CACHE_ENTRIES = 128;
const MAX_PENDING_REQUESTS = 32;
const REQUEST_TIMEOUT_MS = 8000;
const RATE_WINDOW_MS = 120000;
const RATE_REQUESTS = 60;
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;
const cache = new Map();
const pending = new Map();
let requestTimes = [];
let cooldownUntil = 0;

export class AnikotoError extends Error {
  constructor(message, code = "ANIKOTO_UNAVAILABLE", status = 502) {
    super(message);
    this.name = "AnikotoError";
    this.code = code;
    this.status = status;
  }
}

function positiveId(value) {
  if (typeof value !== "number" && typeof value !== "string") return null;
  if (!/^[1-9]\d*$/.test(String(value ?? ""))) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
}

function plainText(value) {
  return typeof value === "string" ? load(value, {}, false).text().replace(/\s+/g, " ").trim() : "";
}

function titleKey(value) {
  return plainText(value).normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
}

function configuration() {
  try {
    const api = new URL(process.env.ANIKOTO_API_BASE_URL || "https://anikotoapi.site");
    const site = new URL(process.env.ANIKOTO_SITE_URL || "https://anikoto.cz");
    for (const url of [api, site]) {
      if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash || url.pathname !== "/") throw new Error();
    }
    const embedHosts = (process.env.ANIKOTO_EMBED_HOSTS || "megaplay.buzz").split(",").map((host) => host.trim().toLowerCase()).filter(Boolean);
    if (!embedHosts.length || embedHosts.some((host) => !/^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/.test(host))) throw new Error();
    return { api: api.origin, site: site.origin, embedHosts, key: `${api.origin}|${site.origin}|${embedHosts.join(",")}` };
  } catch {
    throw new AnikotoError("The Anikoto provider configuration is invalid.", "ANIKOTO_CONFIGURATION", 503);
  }
}

async function cached(key, loader) {
  const existing = cache.get(key);
  if (existing && existing.expiresAt > Date.now()) {
    cache.delete(key);
    cache.set(key, existing);
    return existing.value;
  }
  if (existing) cache.delete(key);
  if (pending.has(key)) return pending.get(key);
  if (pending.size >= MAX_PENDING_REQUESTS) throw new AnikotoError("Anikoto is temporarily busy.", "ANIKOTO_RATE_LIMITED", 429);
  const request = loader().then((value) => {
    if (cache.size >= MAX_CACHE_ENTRIES) cache.delete(cache.keys().next().value);
    cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
    return value;
  }).finally(() => pending.delete(key));
  pending.set(key, request);
  return request;
}

function reserveRequest() {
  const now = Date.now();
  requestTimes = requestTimes.filter((time) => time > now - RATE_WINDOW_MS);
  // A rolling budget includes search requests, so this process also stays below
  // the documented metadata API limit when several visitors resolve titles.
  if (now < cooldownUntil || requestTimes.length >= RATE_REQUESTS) {
    throw new AnikotoError("Anikoto is temporarily rate limited. Try again shortly.", "ANIKOTO_RATE_LIMITED", 429);
  }
  requestTimes.push(now);
}

function rateCooldown(headers) {
  const now = Date.now();
  const retry = headers.get("retry-after");
  const seconds = Number(retry);
  const retryAt = retry && Number.isFinite(seconds) && seconds > 0 ? now + seconds * 1000 : Date.parse(retry || "");
  const resetAt = Number(headers.get("x-ratelimit-reset")) * 1000;
  cooldownUntil = Math.max(cooldownUntil, Number.isFinite(retryAt) && retryAt > now ? retryAt : resetAt > now ? resetAt : now + RATE_WINDOW_MS);
}

async function readBody(response) {
  if (Number(response.headers.get("content-length")) > MAX_RESPONSE_BYTES) throw new Error("Response too large");
  if (!response.body) return "";
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let size = 0;
  let body = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) return body + decoder.decode();
      size += value.byteLength;
      if (size > MAX_RESPONSE_BYTES) {
        await reader.cancel();
        throw new Error("Response too large");
      }
      body += decoder.decode(value, { stream: true });
    }
  } finally {
    reader.releaseLock();
  }
}

async function request(url, json = false) {
  reserveRequest();
  try {
    const response = await fetch(url, {
      headers: { Accept: json ? "application/json" : "text/html" },
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (response.status === 429) {
      rateCooldown(response.headers);
      throw new AnikotoError("Anikoto is temporarily rate limited. Try again shortly.", "ANIKOTO_RATE_LIMITED", 429);
    }
    if (response.status === 404) return null;
    if (!response.ok) throw new AnikotoError("Anikoto is temporarily unavailable.");
    const body = await readBody(response);
    if (!json) return body;
    try {
      return JSON.parse(body);
    } catch {
      throw new AnikotoError("Anikoto returned an invalid response.", "ANIKOTO_INVALID_RESPONSE");
    }
  } catch (error) {
    if (error instanceof AnikotoError) throw error;
    if (error?.name === "TimeoutError" || error?.name === "AbortError") {
      throw new AnikotoError("The Anikoto request timed out.", "ANIKOTO_TIMEOUT", 504);
    }
    throw new AnikotoError("Anikoto is temporarily unavailable.");
  }
}

function searchCandidates(html, titles, site) {
  const $ = load(html);
  const exactTitles = titles.map(titleKey);
  const candidates = new Map();
  $(".item").each((_, element) => {
    const item = $(element);
    const id = positiveId(item.find(".poster[data-tip]").first().attr("data-tip"));
    const link = item.find("a.name.d-title").first();
    if (!id || !link.length) return;
    try {
      const href = new URL(link.attr("href"), site);
      if (href.origin !== site || href.username || href.password || !/^\/watch\/[a-z0-9-]+(?:\/ep-[\d.]+)?\/?$/.test(href.pathname)) return;
    } catch {
      return;
    }
    const names = [titleKey(link.text()), titleKey(link.attr("data-jp"))].filter(Boolean);
    const score = names.some((name) => exactTitles.includes(name)) ? 100 : names.some((name) => exactTitles.some((title) => name.includes(title) || title.includes(name))) ? 10 : 0;
    if (!candidates.has(id)) candidates.set(id, { id, score });
  });
  return [...candidates.values()].sort((a, b) => b.score - a.score).slice(0, 3);
}

function safeEmbed(value, hosts) {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password && !url.port && hosts.includes(url.hostname) ? url.href : null;
  } catch {
    return null;
  }
}

function hasMatchingIds(record, anime) {
  const aniId = positiveId(record.ani_id);
  const malId = positiveId(record.mal_id);
  // A contradiction in either known ID rejects the whole record, even if the
  // other ID or the title matches. Titles alone never authorize a mapping.
  if (anime.id && record.ani_id && aniId !== anime.id) return false;
  if (anime.malId && record.mal_id && malId !== anime.malId) return false;
  return Boolean((anime.id && aniId === anime.id) || (anime.malId && malId === anime.malId));
}

function normalizeSeries(data, config) {
  const record = data.anime;
  const slug = typeof record.slug === "string" && /^[a-z0-9][a-z0-9-]{0,159}$/.test(record.slug) ? record.slug : null;
  const title = plainText(record.title);
  if (!slug || !title || !Array.isArray(data.episodes)) throw new AnikotoError("Anikoto returned an invalid series.", "ANIKOTO_INVALID_RESPONSE");
  const seen = new Set();
  const episodes = data.episodes.flatMap((episode) => {
    const id = positiveId(episode?.id);
    const number = Number(episode?.number);
    if (!id || !Number.isFinite(number) || number <= 0 || number > 100000 || seen.has(number)) return [];
    seen.add(number);
    const sources = ["sub", "dub"].flatMap((language) => {
      const availability = record[`is_${language}`];
      if (availability !== undefined && availability !== null && availability !== "" && Number.isFinite(Number(availability)) && number > Number(availability)) return [];
      const url = safeEmbed(episode.embed_url?.[language], config.embedHosts);
      return url ? [{ id: `anikoto-${language}`, provider: "Anikoto", language, type: "iframe", url }] : [];
    });
    return [{ id, number, title: plainText(episode.title) || `Episode ${number}`, sources }];
  }).sort((a, b) => a.number - b.number);
  return { id: positiveId(record.id), slug, url: `${config.site}/watch/${slug}`, title, episodes, source: "anikoto" };
}

async function resolveSeries(anime, titles, config) {
  const searchUrl = new URL("/filter", config.site);
  searchUrl.searchParams.set("keyword", titles[0]);
  const html = await request(searchUrl.href);
  if (html === null) return null;
  for (const candidate of searchCandidates(html, titles, config.site)) {
    const data = await cached(`${config.key}:series:${candidate.id}`, async () => {
      const result = await request(`${config.api}/series/${candidate.id}`, true);
      if (result === null) return null;
      if (result.ok !== true || !result.data?.anime || positiveId(result.data.anime.id) !== candidate.id) {
        throw new AnikotoError("Anikoto returned an invalid series.", "ANIKOTO_INVALID_RESPONSE");
      }
      return { anime: result.data.anime, normalized: normalizeSeries(result.data, config) };
    });
    if (data && hasMatchingIds(data.anime, anime)) return data.normalized;
  }
  return null;
}

/** Resolve AniList/MAL IDs through Anikoto's public search and metadata API. */
export async function getAnikotoSeries(value) {
  const anime = { id: positiveId(value?.id), malId: positiveId(value?.malId) };
  const titles = [...new Set([value?.titleEnglish, value?.title, value?.titleRomaji, value?.titleNative].map(plainText).filter((title) => title && title.length <= 300))];
  if ((!anime.id && !anime.malId) || !titles.length) throw new AnikotoError("An anime ID and title are required.", "ANIKOTO_INVALID_INPUT", 400);
  const config = configuration();
  return cached(`${config.key}:mapping:${anime.id || ""}:${anime.malId || ""}`, () => resolveSeries(anime, titles, config));
}
