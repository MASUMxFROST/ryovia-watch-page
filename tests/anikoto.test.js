import test from "node:test";
import assert from "node:assert/strict";

let moduleId = 0;
const anime = { id: 301, malId: 401, title: "Hoshi no Tabi", titleEnglish: "Star Journey" };

async function provider(t, overrides = {}) {
  for (const name of ["ANIKOTO_API_BASE_URL", "ANIKOTO_SITE_URL", "ANIKOTO_EMBED_HOSTS"]) {
    const original = process.env[name];
    if (overrides[name] === undefined) delete process.env[name];
    else process.env[name] = overrides[name];
    t.after(() => {
      if (original === undefined) delete process.env[name];
      else process.env[name] = original;
    });
  }
  return import(`../src/lib/server/anikoto.js?test=${++moduleId}`);
}

function card(id, title = "Star Journey", japanese = "Hoshi no Tabi") {
  return `<div class="item"><div class="ani poster tip" data-tip="${id}"></div><a class="name d-title" href="https://anikoto.cz/watch/star-journey-${id}/ep-1" data-jp="${japanese}">${title}</a></div>`;
}

function series(id = 500, overrides = {}, episodes) {
  return { ok: true, data: { anime: { id, title: "Star Journey", slug: `star-journey-${id}`, ani_id: "301", mal_id: "401", is_sub: 2, is_dub: 1, ...overrides }, episodes: episodes || [
    { id: 700, number: 1, title: "The Journey&#39;s &amp; Beginning", embed_url: { sub: "https://megaplay.buzz/stream/s-2/700/sub", dub: "https://megaplay.buzz/stream/s-2/700/dub" } },
    { id: 701, number: 2, title: "A New Star", embed_url: { sub: "https://megaplay.buzz/stream/s-2/701/sub", dub: "https://megaplay.buzz/stream/s-2/701/dub" } },
  ] } };
}

function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...headers } });
}

test("search ranks the exact title ahead of seasons and verifies both IDs", async (t) => {
  const { getAnikotoSeries } = await provider(t);
  const urls = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    urls.push(url);
    assert.equal(options.redirect, "error");
    assert.ok(options.signal instanceof AbortSignal);
    if (new URL(url).pathname === "/filter") {
      assert.equal(new URL(url).searchParams.get("keyword"), "Star Journey");
      return new Response(card(999, "Star Journey Season 2", "Hoshi no Tabi 2") + card(500));
    }
    assert.equal(url, "https://anikotoapi.site/series/500");
    return json(series());
  });
  const result = await getAnikotoSeries(anime);
  assert.equal(result.id, 500);
  assert.equal(result.url, "https://anikoto.cz/watch/star-journey-500");
  assert.equal(result.episodes[0].title, "The Journey's & Beginning");
  assert.deepEqual(result.episodes[0].sources.map((source) => source.language), ["sub", "dub"]);
  assert.deepEqual(result.episodes[1].sources.map((source) => source.language), ["sub"]);
  assert.equal(result.episodes[0].sources[0].type, "iframe");
  assert.equal(urls.length, 2);
});

test("matching one ID cannot override a contradictory ID or an unmapped title", async (t) => {
  const { getAnikotoSeries } = await provider(t);
  const fetched = [];
  t.mock.method(globalThis, "fetch", async (url) => {
    fetched.push(url);
    if (new URL(url).pathname === "/filter") return new Response(card(500) + card(501) + card(502) + card(503));
    const id = Number(new URL(url).pathname.split("/").at(-1));
    const ids = id === 500 ? { ani_id: "999", mal_id: "401" } : id === 501 ? { ani_id: "301", mal_id: "999" } : { ani_id: "", mal_id: "" };
    return json(series(id, ids));
  });
  assert.equal(await getAnikotoSeries(anime), null);
  assert.equal(fetched.length, 4);
  assert.ok(fetched.every((url) => !url.endsWith("/503")));
});

test("a missing secondary ID is allowed when the available ID matches", async (t) => {
  const { getAnikotoSeries } = await provider(t);
  t.mock.method(globalThis, "fetch", async (url) => new URL(url).pathname === "/filter" ? new Response(card(500)) : json(series(500, { ani_id: "" })));
  assert.equal((await getAnikotoSeries(anime)).id, 500);
});

test("untrusted iframe URLs and unsupported languages never reach the player", async (t) => {
  const { getAnikotoSeries } = await provider(t);
  const unsafe = ["javascript:alert(1)", "http://megaplay.buzz/stream", "https://megaplay.buzz.evil.test/stream", "https://user:pass@megaplay.buzz/stream", "https://megaplay.buzz:444/stream", "https://127.0.0.1/stream"];
  t.mock.method(globalThis, "fetch", async (url) => {
    if (new URL(url).pathname === "/filter") return new Response(card(500));
    return json(series(500, { is_sub: 99, is_dub: 99 }, unsafe.map((url, index) => ({ id: index + 1, number: index + 1, title: "Episode", embed_url: { sub: url, french: "https://megaplay.buzz/safe" } }))));
  });
  const result = await getAnikotoSeries(anime);
  assert.equal(result.episodes.length, unsafe.length);
  assert.ok(result.episodes.every((episode) => episode.sources.length === 0));
});

test("HTML links cannot change upstream origins and configured embed hosts match exactly", async (t) => {
  const { getAnikotoSeries } = await provider(t, { ANIKOTO_EMBED_HOSTS: "player.example.test" });
  t.mock.method(globalThis, "fetch", async (url) => {
    if (new URL(url).pathname === "/filter") return new Response(card(999).replace("https://anikoto.cz/", "https://evil.test/") + card(500));
    assert.equal(url, "https://anikotoapi.site/series/500");
    return json(series(500, {}, [{ id: 1, number: 1, title: "Pilot", embed_url: { sub: "https://player.example.test/embed/1", dub: "https://megaplay.buzz/embed/1" } }]));
  });
  assert.deepEqual((await getAnikotoSeries(anime)).episodes[0].sources.map((source) => source.language), ["sub"]);
});

test("concurrent mappings deduplicate and completed results use the cache", async (t) => {
  const { getAnikotoSeries } = await provider(t);
  const fetch = t.mock.method(globalThis, "fetch", async (url) => new URL(url).pathname === "/filter" ? new Response(card(500)) : json(series()));
  const [first, second] = await Promise.all([getAnikotoSeries(anime), getAnikotoSeries(anime)]);
  assert.deepEqual(first, second);
  assert.equal((await getAnikotoSeries(anime)).id, 500);
  assert.equal(fetch.mock.callCount(), 2);
});

test("timeouts and upstream failures are sanitized and can be retried", async (t) => {
  const { getAnikotoSeries, AnikotoError } = await provider(t);
  const fetch = t.mock.method(globalThis, "fetch", async () => { throw new DOMException("private upstream request", "TimeoutError"); });
  await assert.rejects(getAnikotoSeries(anime), (error) => error instanceof AnikotoError && error.code === "ANIKOTO_TIMEOUT" && error.status === 504 && !error.message.includes("private"));
  fetch.mock.mockImplementation(async () => json({ error: "private details" }, 503));
  await assert.rejects(getAnikotoSeries(anime), { code: "ANIKOTO_UNAVAILABLE", status: 502 });
  fetch.mock.mockImplementation(async (url) => new URL(url).pathname === "/filter" ? new Response(card(500)) : json(series()));
  assert.equal((await getAnikotoSeries(anime)).id, 500);
});

test("429 pauses requests until Retry-After, then allows retry", async (t) => {
  const { getAnikotoSeries } = await provider(t);
  let now = 1000000;
  t.mock.method(Date, "now", () => now);
  const fetch = t.mock.method(globalThis, "fetch", async () => json({}, 429, { "Retry-After": "10" }));
  await assert.rejects(getAnikotoSeries(anime), { code: "ANIKOTO_RATE_LIMITED", status: 429 });
  await assert.rejects(getAnikotoSeries(anime), { code: "ANIKOTO_RATE_LIMITED" });
  assert.equal(fetch.mock.callCount(), 1);
  now += 10001;
  fetch.mock.mockImplementation(async (url) => new URL(url).pathname === "/filter" ? new Response(card(500)) : json(series()));
  assert.equal((await getAnikotoSeries(anime)).id, 500);
});

test("a rolling process budget prevents more than 60 upstream calls per 120 seconds", async (t) => {
  const { getAnikotoSeries } = await provider(t);
  let now = 1000000;
  t.mock.method(Date, "now", () => now);
  const fetch = t.mock.method(globalThis, "fetch", async () => new Response("<div>No results</div>"));
  for (let id = 1; id <= 60; id++) assert.equal(await getAnikotoSeries({ id, title: `Anime ${id}` }), null);
  await assert.rejects(getAnikotoSeries({ id: 61, title: "Anime 61" }), { code: "ANIKOTO_RATE_LIMITED" });
  assert.equal(fetch.mock.callCount(), 60);
  now += 120001;
  assert.equal(await getAnikotoSeries({ id: 61, title: "Anime 61" }), null);
  assert.equal(fetch.mock.callCount(), 61);
});

test("malformed metadata is rejected and invalid configuration never requests it", async (t) => {
  const { getAnikotoSeries } = await provider(t);
  const fetch = t.mock.method(globalThis, "fetch", async (url) => new URL(url).pathname === "/filter" ? new Response(card(500)) : json(series(999)));
  await assert.rejects(getAnikotoSeries(anime), { code: "ANIKOTO_INVALID_RESPONSE" });
  const invalid = await provider(t, { ANIKOTO_API_BASE_URL: "https://secret@evil.test" });
  await assert.rejects(invalid.getAnikotoSeries(anime), { code: "ANIKOTO_CONFIGURATION" });
  assert.equal(fetch.mock.callCount(), 2);
  await assert.rejects(getAnikotoSeries({ id: "https://evil.test", title: "Bad" }), { code: "ANIKOTO_INVALID_INPUT" });
});

test("malformed series are not cached, and successful mappings expire after five minutes", async (t) => {
  const { getAnikotoSeries } = await provider(t);
  let now = 1000000;
  t.mock.method(Date, "now", () => now);
  const invalid = series();
  invalid.data.episodes = null;
  const fetch = t.mock.method(globalThis, "fetch", async (url) => new URL(url).pathname === "/filter" ? new Response(card(500)) : json(invalid));
  await assert.rejects(getAnikotoSeries(anime), { code: "ANIKOTO_INVALID_RESPONSE" });
  fetch.mock.mockImplementation(async (url) => new URL(url).pathname === "/filter" ? new Response(card(500)) : json(series()));
  assert.equal((await getAnikotoSeries(anime)).id, 500);
  assert.equal(fetch.mock.callCount(), 4);
  now += 300001;
  assert.equal((await getAnikotoSeries(anime)).id, 500);
  assert.equal(fetch.mock.callCount(), 6);
});
