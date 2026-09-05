// Imported only by server pages and route handlers. No user tokens are needed.
import { load } from "cheerio";
import { ApiError, positiveInteger } from "./api.js";

const ENDPOINT = "https://graphql.anilist.co";
const cache = new Map();
const pending = new Map();
const MAX_CACHE = 200;
const MAX_PENDING = 5;
let nextRequestAt = 0;
let cooldownUntil = 0;

const CARD_FIELDS = `
  id idMal title { english romaji native } description(asHtml: false)
  coverImage { extraLarge large } bannerImage episodes duration format status
  averageScore popularity genres seasonYear siteUrl isAdult
`;
const CATALOG_QUERY = `query Catalog($search: String, $genre: String, $page: Int, $perPage: Int, $sort: [MediaSort]) {
  Page(page: $page, perPage: $perPage) {
    pageInfo { currentPage hasNextPage }
    media(type: ANIME, isAdult: false, search: $search, genre: $genre, sort: $sort) { ${CARD_FIELDS} }
  }
}`;
const DETAIL_QUERY = `query Anime($id: Int!) {
  Media(id: $id, type: ANIME) {
    ${CARD_FIELDS}
    nextAiringEpisode { episode airingAt }
    externalLinks { site url type }
    streamingEpisodes { title url site }
    recommendations(sort: RATING_DESC, perPage: 12) {
      nodes { mediaRecommendation { ${CARD_FIELDS} } }
    }
  }
}`;

function plainText(value) {
  if (typeof value !== "string") return "";
  const $ = load(value.replace(/<br\s*\/?\s*>/gi, "\n"));
  $("script, style").remove();
  return $.root().text().replace(/\r/g, "").replace(/[ \t]+/g, " ").trim();
}

function safeUrl(value) {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) return null;
    url.protocol = "https:";
    return url.href;
  } catch { return null; }
}

function number(value, min = 0) {
  return typeof value === "number" && Number.isFinite(value) && value >= min ? value : null;
}

export function normalizeAnime(media) {
  if (!media || !Number.isInteger(media.id) || media.id < 1) return null;
  const title = plainText(media.title?.english || media.title?.romaji || media.title?.native);
  if (!title) return null;
  const score = number(media.averageScore, 1);
  return {
    id: media.id,
    malId: number(media.idMal, 1),
    title,
    titleEnglish: media.title?.english ? plainText(media.title.english) : null,
    titleRomaji: media.title?.romaji ? plainText(media.title.romaji) : null,
    titleNative: media.title?.native ? plainText(media.title.native) : null,
    description: plainText(media.description),
    poster: safeUrl(media.coverImage?.extraLarge || media.coverImage?.large),
    banner: safeUrl(media.bannerImage),
    episodes: number(media.episodes, 1),
    durationMinutes: number(media.duration, 1),
    format: typeof media.format === "string" ? media.format.replaceAll("_", " ") || "Anime" : "Anime",
    status: ({ FINISHED: "Finished Airing", RELEASING: "Currently Airing", NOT_YET_RELEASED: "Not Yet Aired", CANCELLED: "Cancelled", HIATUS: "On Hiatus" })[media.status] || "Unknown",
    score: score !== null && score <= 100 ? score / 10 : null,
    popularity: number(media.popularity),
    genres: Array.isArray(media.genres) ? media.genres.filter((genre) => typeof genre === "string") : [],
    year: number(media.seasonYear, 1),
    siteUrl: `https://anilist.co/anime/${media.id}`,
  };
}

function remember(key, value, ttl) {
  if (cache.size >= MAX_CACHE) cache.delete(cache.keys().next().value);
  cache.set(key, { value, expires: Date.now() + ttl });
  return value;
}

async function query(queryText, variables, ttl, validateData) {
  const key = JSON.stringify([queryText, variables]);
  const existing = cache.get(key);
  if (existing?.expires > Date.now()) return existing.value;
  if (pending.has(key)) return pending.get(key);
  if (Date.now() < cooldownUntil) {
    throw new ApiError("AniList is busy. Please try again shortly.", "ANILIST_RATE_LIMITED", 503, Math.ceil((cooldownUntil - Date.now()) / 1000));
  }
  if (pending.size >= MAX_PENDING) throw new ApiError("The catalog is busy. Please try again shortly.", "ANILIST_BUSY", 503, 5);

  const request = (async () => {
    // AniList currently documents a reduced 30 requests/minute limit.
    const requestAt = Math.max(Date.now(), nextRequestAt);
    nextRequestAt = requestAt + 2100;
    if (requestAt > Date.now()) await new Promise((resolve) => setTimeout(resolve, requestAt - Date.now()));
    if (Date.now() < cooldownUntil) throw new ApiError("AniList is busy. Please try again shortly.", "ANILIST_RATE_LIMITED", 503, 60);
    try {
      const response = await fetch(ENDPOINT, {
        method: "POST", redirect: "error", cache: "no-store",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ query: queryText, variables }),
        signal: AbortSignal.timeout(10000),
      });
      if (response.status === 429) {
        const retry = Math.max(1, Math.min(120, Number(response.headers.get("Retry-After")) || 60));
        cooldownUntil = Date.now() + retry * 1000;
        throw new ApiError("AniList is busy. Please try again shortly.", "ANILIST_RATE_LIMITED", 503, retry);
      }
      if (response.status === 404) throw new ApiError("This anime could not be found.", "ANIME_NOT_FOUND", 404);
      if (!response.ok) throw new ApiError("AniList is temporarily unavailable.", "ANILIST_UNAVAILABLE", 503);
      const body = await response.json();
      if (body.errors?.length || !body.data) {
        if (body.errors?.some((error) => error.status === 404)) throw new ApiError("This anime could not be found.", "ANIME_NOT_FOUND", 404);
        throw new ApiError("AniList could not load this request.", "ANILIST_INVALID_RESPONSE", 502);
      }
      // Only cache a payload after the caller's shape and identity checks pass.
      validateData(body.data);
      return remember(key, body.data, ttl);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError("AniList could not be reached. Please try again.", "ANILIST_UNAVAILABLE", 503);
    }
  })();
  pending.set(key, request);
  try { return await request; } finally { pending.delete(key); }
}

export async function getAnimeCatalog(options = {}) {
  const page = positiveInteger(options.page, "page", 1, 500);
  const perPage = positiveInteger(options.perPage, "perPage", 12, 24);
  const search = typeof options.search === "string" ? options.search.trim() : "";
  const genre = typeof options.genre === "string" ? options.genre.trim() : "";
  if (search.length > 100 || genre.length > 40) throw new ApiError("Search or genre is too long.", "INVALID_REQUEST", 400);
  const sort = options.sort || (search ? "SEARCH_MATCH" : "TRENDING_DESC");
  if (!["SEARCH_MATCH", "TRENDING_DESC", "POPULARITY_DESC", "SCORE_DESC"].includes(sort)) throw new ApiError("Choose a supported catalog sort.", "INVALID_REQUEST", 400);
  if (sort === "SEARCH_MATCH" && !search) throw new ApiError("A search term is required for search sorting.", "INVALID_REQUEST", 400);
  const variables = { page, perPage, sort: [sort], ...(search ? { search } : {}), ...(genre ? { genre } : {}) };
  const result = await query(CATALOG_QUERY, variables, 5 * 60 * 1000, (data) => {
    if (!Array.isArray(data.Page?.media)) throw new ApiError("AniList returned an invalid catalog.", "ANILIST_INVALID_RESPONSE", 502);
  });
  return {
    data: result.Page.media.map(normalizeAnime).filter(Boolean),
    pageInfo: { currentPage: page, hasNextPage: Boolean(result.Page.pageInfo?.hasNextPage) },
    source: "anilist",
  };
}

export async function getAnime(value) {
  const id = positiveInteger(value);
  const result = await query(DETAIL_QUERY, { id }, 10 * 60 * 1000, (data) => {
    if (data.Media && data.Media.id !== id) throw new ApiError("AniList returned the wrong anime record.", "ANILIST_INVALID_RESPONSE", 502);
    if (!normalizeAnime(data.Media)) throw new ApiError("This anime could not be found.", "ANIME_NOT_FOUND", 404);
  });
  const media = result.Media;
  const anime = normalizeAnime(media);
  const recommendationNodes = Array.isArray(media.recommendations?.nodes) ? media.recommendations.nodes : [];
  const recommendations = recommendationNodes.map((node) => node?.mediaRecommendation)
    .filter((item) => item && !item.isAdult && item.id !== id).map(normalizeAnime).filter(Boolean);
  return {
    ...anime,
    recommendations: [...new Map(recommendations.map((item) => [item.id, item])).values()].slice(0, 8),
    nextAiringEpisode: media.nextAiringEpisode || null,
    streamingLinks: (Array.isArray(media.externalLinks) ? media.externalLinks : []).filter((link) => link?.type === "STREAMING" && safeUrl(link.url))
      .map((link) => ({ site: plainText(link.site), url: safeUrl(link.url) })),
    streamingEpisodes: (Array.isArray(media.streamingEpisodes) ? media.streamingEpisodes : []).filter((episode) => episode && safeUrl(episode.url))
      .map((episode) => ({ title: plainText(episode.title), site: plainText(episode.site), url: safeUrl(episode.url) })),
  };
}
