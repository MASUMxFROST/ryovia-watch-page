import test from "node:test";
import assert from "node:assert/strict";

let moduleId = 0;
const source = { id: "anikoto-sub", language: "sub", provider: "Anikoto", type: "iframe", url: "https://megaplay.buzz/stream/s-2/123/sub" };

async function provider(t) {
  for (const name of ["ANIKOTO_API_BASE_URL", "ANIKOTO_SITE_URL", "ANIKOTO_EMBED_HOSTS"]) {
    const original = process.env[name];
    delete process.env[name];
    t.after(() => {
      if (original === undefined) delete process.env[name];
      else process.env[name] = original;
    });
  }
  return import(`../src/lib/server/playback.js?test=${++moduleId}`);
}

function html(content = "<html><title>MegaPlay</title><body><div id='player'>Player</div></body></html>", status = 200) {
  return new Response(content, { status, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

test("healthy supplied iframe HTML returns the original source without fetching media", async (t) => {
  const { checkEmbedAvailability } = await provider(t);
  const fetch = t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, source.url);
    assert.equal(options.redirect, "error");
    assert.equal(options.headers.Referer, undefined);
    assert.ok(options.signal instanceof AbortSignal);
    return html("<html><title>MegaPlay</title><video src='https://cdn.example.test/movie.mp4'></video></html>");
  });
  assert.deepEqual(await checkEmbedAvailability(source), { status: "ready", source });
  assert.equal(fetch.mock.callCount(), 1);
});

test("MegaPlay's HTTP200 missing-file screen and HTTP404/410 return no source", async (t) => {
  const { checkEmbedAvailability } = await provider(t);
  const bodies = [html("<title>Error - MegaPlay</title><h1>We're Sorry!</h1><p>We can't find the file you are looking for.</p><div>Error Code: <span>410</span></div>"), html("Gone", 404), html("Gone", 410)];
  t.mock.method(globalThis, "fetch", async () => bodies.shift());
  for (let i = 0; i < 3; i++) {
    const result = await checkEmbedAvailability({ ...source, url: `${source.url}?case=${i}` });
    assert.equal(result.status, "unavailable");
    assert.equal(result.source, null);
    assert.match(result.message, /unavailable/i);
  }
});

test("unsafe URLs are rejected without requests", async (t) => {
  const { checkEmbedAvailability } = await provider(t);
  const fetch = t.mock.method(globalThis, "fetch", () => { throw new Error("Unexpected request"); });
  for (const url of ["http://megaplay.buzz/", "https://megaplay.buzz.evil.test/", "https://user:pass@megaplay.buzz/", "https://127.0.0.1/", "https://megaplay.buzz:444/", "javascript:alert(1)"]) {
    await assert.rejects(checkEmbedAvailability({ ...source, url }), { code: "PLAYBACK_INVALID_SOURCE" });
  }
  await assert.rejects(checkEmbedAvailability({ ...source, type: "hls" }), { code: "PLAYBACK_INVALID_SOURCE" });
  assert.equal(fetch.mock.callCount(), 0);
});

test("HTTP403, challenge HTML and timeouts return sanitized errors and do not cache failures", async (t) => {
  const { checkEmbedAvailability, PlaybackError } = await provider(t);
  const fetch = t.mock.method(globalThis, "fetch", async () => html("private denial", 403));
  await assert.rejects(checkEmbedAvailability(source), (error) => error instanceof PlaybackError && error.code === "PLAYBACK_UNAVAILABLE" && !error.message.includes("private"));
  fetch.mock.mockImplementation(async () => html("<title>Just a moment...</title><p>Checking your browser</p>"));
  await assert.rejects(checkEmbedAvailability(source), { code: "PLAYBACK_UNAVAILABLE" });
  fetch.mock.mockImplementation(async () => { throw new DOMException("private network location", "TimeoutError"); });
  await assert.rejects(checkEmbedAvailability(source), { code: "PLAYBACK_TIMEOUT", status: 504 });
  fetch.mock.mockImplementation(async () => html());
  assert.equal((await checkEmbedAvailability(source)).status, "ready");
  assert.equal(fetch.mock.callCount(), 4);
});

test("video response bodies and oversized HTML are canceled before further reading", async (t) => {
  const { checkEmbedAvailability } = await provider(t);
  let canceled = 0;
  const fetch = t.mock.method(globalThis, "fetch", async () => new Response(new ReadableStream({ cancel() { canceled++; } }), { headers: { "Content-Type": "video/mp4" } }));
  await assert.rejects(checkEmbedAvailability(source), { code: "PLAYBACK_INVALID_RESPONSE" });
  assert.equal(canceled, 1);
  fetch.mock.mockImplementation(async () => html("x".repeat(256 * 1024 + 1)));
  await assert.rejects(checkEmbedAvailability(source), { code: "PLAYBACK_INVALID_RESPONSE" });
});

test("concurrent probes share a request and the result expires after 60 seconds", async (t) => {
  const { checkEmbedAvailability } = await provider(t);
  let now = 100000;
  t.mock.method(Date, "now", () => now);
  const fetch = t.mock.method(globalThis, "fetch", async () => html());
  const results = await Promise.all([checkEmbedAvailability(source), checkEmbedAvailability(source)]);
  assert.deepEqual(results[0], results[1]);
  await checkEmbedAvailability(source);
  assert.equal(fetch.mock.callCount(), 1);
  now += 60001;
  await checkEmbedAvailability(source);
  assert.equal(fetch.mock.callCount(), 2);
});

test("getPlayback validates inputs and resolves exact fractional episode and language", async (t) => {
  const { getPlayback } = await provider(t);
  const anime = { id: 90101, malId: 90201, title: "Test Journey" };
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url) => {
    calls.push(url);
    if (new URL(url).pathname === "/filter") return html('<div class="item"><div class="poster" data-tip="90301"></div><a class="name d-title" href="https://anikoto.cz/watch/test-journey/ep-1">Test Journey</a></div>');
    if (new URL(url).pathname === "/series/90301") return new Response(JSON.stringify({ ok: true, data: { anime: { id: 90301, ani_id: "90101", mal_id: "90201", title: "Test Journey", slug: "test-journey" }, episodes: [{ id: 90401, number: 12.5, title: "Special", embed_url: { sub: source.url } }] } }), { headers: { "Content-Type": "application/json" } });
    assert.equal(url, source.url);
    return html();
  });
  for (const episode of [null, true, -1, 0, "", 100001, Infinity, "https://evil.test"]) {
    await assert.rejects(getPlayback(anime, episode, "sub"), { code: "PLAYBACK_INVALID_INPUT", status: 400 });
  }
  await assert.rejects(getPlayback(anime, 1, "french"), { code: "PLAYBACK_INVALID_INPUT" });
  assert.equal(calls.length, 0);
  const missingDub = await getPlayback(anime, "12.5", "dub");
  assert.equal(missingDub.source, null);
  assert.equal(missingDub.status, "unavailable");
  assert.equal(calls.length, 2);
  const missingEpisode = await getPlayback(anime, 1, "sub");
  assert.equal(missingEpisode.source, null);
  const ready = await getPlayback(anime, 12.5, "sub");
  assert.equal(ready.status, "ready");
  assert.equal(ready.source.url, source.url);
  assert.equal(ready.providerUrl, "https://anikoto.cz/watch/test-journey");
  assert.equal(calls.length, 3);
});
