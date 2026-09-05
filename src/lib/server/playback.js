import { load } from "cheerio";
import { getAnikotoSeries } from "./anikoto.js";

const CACHE_TTL_MS = 60000;
const MAX_CACHE_ENTRIES = 128;
const MAX_PENDING_REQUESTS = 32;
const MAX_HTML_BYTES = 256 * 1024;
const cache = new Map();
const pending = new Map();

export class PlaybackError extends Error {
  constructor(message, code = "PLAYBACK_UNAVAILABLE", status = 502) {
    super(message);
    this.name = "PlaybackError";
    this.code = code;
    this.status = status;
  }
}

function sourceUrl(source) {
  try {
    if (source?.type !== "iframe" || !["sub", "dub"].includes(source.language)) throw new Error();
    const url = new URL(source.url);
    const allowed = (process.env.ANIKOTO_EMBED_HOSTS || "megaplay.buzz").split(",").map((host) => host.trim().toLowerCase()).filter(Boolean);
    if (url.protocol !== "https:" || url.username || url.password || url.port || !allowed.includes(url.hostname)) throw new Error();
    return url.href;
  } catch {
    throw new PlaybackError("The player returned an unsupported source.", "PLAYBACK_INVALID_SOURCE");
  }
}

function unavailable(message = "This episode is unavailable on the selected player. Try another language or viewing option.") {
  return { status: "unavailable", message };
}

async function htmlBody(response) {
  const contentType = response.headers.get("content-type") || "";
  if (!/^(?:text\/html|application\/xhtml\+xml)(?:\s*;|$)/i.test(contentType) || Number(response.headers.get("content-length")) > MAX_HTML_BYTES) {
    await response.body?.cancel();
    throw new PlaybackError("The player returned an unsupported response.", "PLAYBACK_INVALID_RESPONSE");
  }
  if (!response.body) throw new PlaybackError("The player returned an empty response.", "PLAYBACK_INVALID_RESPONSE");
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let size = 0;
  let html = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) return html + decoder.decode();
      size += value.byteLength;
      if (size > MAX_HTML_BYTES) {
        await reader.cancel();
        throw new PlaybackError("The player returned an unsupported response.", "PLAYBACK_INVALID_RESPONSE");
      }
      html += decoder.decode(value, { stream: true });
    }
  } finally {
    reader.releaseLock();
  }
}

async function probe(url) {
  try {
    // Only inspect the supplied iframe HTML. Never fetch video files, change
    // referrers, follow redirects, or work around a provider access restriction.
    const response = await fetch(url, {
      headers: { Accept: "text/html, application/xhtml+xml" },
      redirect: "error",
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (response.status === 404 || response.status === 410) {
      await response.body?.cancel();
      return unavailable();
    }
    if (!response.ok) {
      await response.body?.cancel();
      throw new PlaybackError("The player could not be reached. Try again shortly.", response.status === 429 ? "PLAYBACK_RATE_LIMITED" : "PLAYBACK_UNAVAILABLE", response.status === 429 ? 429 : 502);
    }
    const html = await htmlBody(response);
    if (!html.trim()) throw new PlaybackError("The player returned an empty response.", "PLAYBACK_INVALID_RESPONSE");
    const $ = load(html);
    $("script, style").remove();
    const text = $.root().text().replace(/\s+/g, " ").trim();
    const isMissing = /error\s*code\s*:\s*(?:404|410)\b/i.test(text)
      || /(?:can(?:not|'t|’t) find the file|file (?:has been |was |is )?(?:deleted|removed|not found)|video (?:has been |was |is )?(?:deleted|removed|not found))/i.test(text);
    if (isMissing) return unavailable();
    // Recognize normal access-denied/challenge pages without attempting to
    // satisfy or bypass them, including providers that return HTTP 200.
    if (/^(?:access denied|just a moment|attention required|forbidden|error)(?:\b|\s*-)/i.test($("title").text().trim())) {
      throw new PlaybackError("The player is temporarily unavailable. Try another viewing option.");
    }
    return { status: "ready" };
  } catch (error) {
    if (error instanceof PlaybackError) throw error;
    if (error?.name === "TimeoutError" || error?.name === "AbortError") throw new PlaybackError("The player request timed out. Try again shortly.", "PLAYBACK_TIMEOUT", 504);
    throw new PlaybackError("The player could not be reached. Try again shortly.");
  }
}

/** Bounded iframe-HTML availability check; this does not verify video playback. */
export async function checkEmbedAvailability(source) {
  const url = sourceUrl(source);
  const existing = cache.get(url);
  if (existing && existing.expiresAt > Date.now()) {
    cache.delete(url);
    cache.set(url, existing);
    return { ...existing.result, source: existing.result.status === "ready" ? source : null };
  }
  if (existing) cache.delete(url);
  let request = pending.get(url);
  if (!request) {
    if (pending.size >= MAX_PENDING_REQUESTS) throw new PlaybackError("The player service is temporarily busy.", "PLAYBACK_RATE_LIMITED", 429);
    request = probe(url).then((result) => {
      if (cache.size >= MAX_CACHE_ENTRIES) cache.delete(cache.keys().next().value);
      cache.set(url, { result, expiresAt: Date.now() + CACHE_TTL_MS });
      return result;
    }).finally(() => pending.delete(url));
    pending.set(url, request);
  }
  const result = await request;
  return { ...result, source: result.status === "ready" ? source : null };
}

/** Resolve an anime's exact episode/language before checking its known source. */
export async function getPlayback(anime, episodeNumber, language) {
  const episode = Number(episodeNumber);
  if (!["number", "string"].includes(typeof episodeNumber) || !/^\d+(?:\.\d+)?$/.test(String(episodeNumber)) || !Number.isFinite(episode) || episode <= 0 || episode > 100000 || !["sub", "dub"].includes(language)) {
    throw new PlaybackError("Choose a valid episode and sub or dub language.", "PLAYBACK_INVALID_INPUT", 400);
  }
  const series = await getAnikotoSeries(anime);
  const selectedEpisode = series?.episodes.find((item) => item.number === episode);
  const source = selectedEpisode?.sources.find((item) => item.language === language);
  if (!source) return { ...unavailable(selectedEpisode ? "This episode is not available in the selected language." : "This episode is not available from Anikoto."), source: null, providerUrl: series?.url || null };
  return { ...await checkEmbedAvailability(source), providerUrl: series.url };
}
