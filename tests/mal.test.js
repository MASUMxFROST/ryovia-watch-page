import test from "node:test";
import assert from "node:assert/strict";

let moduleId = 0;

async function provider(t, clientId) {
  const original = process.env.MAL_CLIENT_ID;
  if (clientId === undefined) delete process.env.MAL_CLIENT_ID;
  else process.env.MAL_CLIENT_ID = clientId;
  t.after(() => {
    if (original === undefined) delete process.env.MAL_CLIENT_ID;
    else process.env.MAL_CLIENT_ID = original;
  });
  return import(`../src/lib/server/mal.js?test=${++moduleId}`);
}

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", ...headers } });
}

test("official MAL metadata uses a private client header and normalizes unknown fields", async (t) => {
  const { getMalAnime, isMalConfigured } = await provider(t, "test-client-id");
  const fetch = t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(new URL(url).origin, "https://api.myanimelist.net");
    assert.equal(new URL(url).pathname, "/v2/anime/21");
    assert.match(new URL(url).searchParams.get("fields"), /num_list_users/);
    assert.equal(options.headers["X-MAL-CLIENT-ID"], "test-client-id");
    assert.equal(options.redirect, "error");
    assert.ok(options.signal instanceof AbortSignal);
    return json({ id: 21, title: "One Piece", mean: 8.73, rank: 45, popularity: 12, num_list_users: 1000, num_episodes: 0, status: "currently_airing", genres: [{ id: 1, name: "Action" }], main_picture: { large: "https://cdn.myanimelist.net/images/anime/one-piece.jpg" } });
  });
  assert.equal(isMalConfigured(), true);
  const result = await getMalAnime("21");
  assert.equal(result.source, "myanimelist");
  assert.equal(result.score, 8.73);
  assert.equal(result.members, 1000);
  assert.equal(result.episodes, null);
  assert.equal(result.status, "Currently Airing");
  assert.equal(result.synopsis, null);
  assert.deepEqual(result.genres, ["Action"]);
  assert.equal(result.url, "https://myanimelist.net/anime/21");
  assert.equal(fetch.mock.callCount(), 1);
  assert.doesNotMatch(JSON.stringify(result), /test-client-id/);
});

test("without a key Jikan returns public MAL data and supports the titles schema", async (t) => {
  const { getMalAnime, isMalConfigured } = await provider(t);
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, "https://api.jikan.moe/v4/anime/1");
    assert.equal(options.headers["X-MAL-CLIENT-ID"], undefined);
    return json({ data: { mal_id: 1, titles: [{ type: "Default", title: "Cowboy Bebop" }], score: 0, members: 0, episodes: 26, status: "Finished Airing", url: "javascript:alert(1)", images: { jpg: { image_url: "javascript:alert(1)" } } } });
  });
  assert.equal(isMalConfigured(), false);
  const result = await getMalAnime(1);
  assert.equal(result.title, "Cowboy Bebop");
  assert.equal(result.source, "jikan");
  assert.equal(result.score, null);
  assert.equal(result.members, 0);
  assert.equal(result.poster, null);
  assert.equal(result.url, "https://myanimelist.net/anime/1");
  assert.deepEqual(result.genres, []);
});

test("official provider failure falls back without leaking the client credential", async (t) => {
  const { getMalAnime } = await provider(t, "private-mal-id");
  const urls = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    urls.push(url);
    if (new URL(url).hostname === "api.myanimelist.net") return json({ error: "invalid_client" }, 401);
    assert.equal(options.headers["X-MAL-CLIENT-ID"], undefined);
    assert.doesNotMatch(url, /private-mal-id/);
    return json({ data: { mal_id: 21, title: "One Piece", score: 8.7 } });
  });
  assert.equal((await getMalAnime(21)).source, "jikan");
  assert.equal(urls.length, 2);
});

test("concurrent lookups share an upstream request and later lookups use the cache", async (t) => {
  const { getMalAnime } = await provider(t);
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  const fetch = t.mock.method(globalThis, "fetch", async () => {
    await gate;
    return json({ data: { mal_id: 1, title: "Cowboy Bebop" } });
  });
  const first = getMalAnime(1);
  const second = getMalAnime("1");
  release();
  assert.deepEqual(await first, await second);
  assert.equal((await getMalAnime(1)).id, 1);
  assert.equal(fetch.mock.callCount(), 1);
});

test("invalid IDs are rejected before making any request", async (t) => {
  const { getMalAnime } = await provider(t);
  const fetch = t.mock.method(globalThis, "fetch", () => { throw new Error("Unexpected network request"); });
  for (const id of [0, -1, 1.5, "", "001", "1/../2", "https://example.com", true, null, {}, Number.MAX_SAFE_INTEGER + 1]) {
    await assert.rejects(getMalAnime(id), RangeError);
  }
  assert.equal(fetch.mock.callCount(), 0);
});

test("not-found responses return null and are cached without fallback", async (t) => {
  const { getMalAnime } = await provider(t, "configured-client");
  const fetch = t.mock.method(globalThis, "fetch", async () => json({ error: "not_found" }, 404));
  assert.equal(await getMalAnime(9999999), null);
  assert.equal(await getMalAnime(9999999), null);
  assert.equal(fetch.mock.callCount(), 1);
});

test("a rate-limited public provider returns a typed error and honors its retry window", async (t) => {
  const { getMalAnime, MalProviderError } = await provider(t);
  const fetch = t.mock.method(globalThis, "fetch", async () => json({ message: "private upstream details" }, 429, { "Retry-After": "60" }));
  await assert.rejects(getMalAnime(21), (error) => {
    assert.ok(error instanceof MalProviderError);
    assert.equal(error.code, "MAL_RATE_LIMITED");
    assert.equal(error.status, 429);
    assert.doesNotMatch(error.message, /private upstream details/);
    return true;
  });
  await assert.rejects(getMalAnime(1), { code: "MAL_RATE_LIMITED" });
  assert.equal(fetch.mock.callCount(), 1);
});

test("queued Jikan lookups honor a cooldown received while they were waiting", async (t) => {
  const { getMalAnime } = await provider(t);
  let now = 100000;
  t.mock.method(Date, "now", () => now);
  const scheduled = [];
  t.mock.method(globalThis, "setTimeout", (callback) => { scheduled.push(callback); return 1; });
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  let calls = 0;
  const fetch = t.mock.method(globalThis, "fetch", async () => {
    calls += 1;
    if (calls === 1) {
      await gate;
      return json({}, 429, { "Retry-After": "60" });
    }
    return json({ data: { mal_id: 2, title: "Second anime" } });
  });
  const first = getMalAnime(1);
  const queued = getMalAnime(2);
  const firstFailure = assert.rejects(first, { code: "MAL_RATE_LIMITED" });
  const queuedFailure = assert.rejects(queued, { code: "MAL_RATE_LIMITED" });
  release();
  await firstFailure;
  assert.equal(scheduled.length, 1);
  now += 1100;
  scheduled.shift()();
  await queuedFailure;
  assert.equal(fetch.mock.callCount(), 1);
  now = 161100;
  assert.equal((await getMalAnime(2)).id, 2);
  assert.equal(fetch.mock.callCount(), 2);
});

test("wrong-record responses and timeouts never masquerade as anime data", async (t) => {
  const invalidProvider = await provider(t);
  const fetch = t.mock.method(globalThis, "fetch", async () => json({ data: { mal_id: 2, title: "Wrong anime" } }));
  await assert.rejects(invalidProvider.getMalAnime(1), { code: "MAL_INVALID_RESPONSE" });
  const timedOutProvider = await provider(t);
  fetch.mock.mockImplementation(async () => { throw new DOMException("Upstream took too long", "TimeoutError"); });
  await assert.rejects(timedOutProvider.getMalAnime(1), { code: "MAL_TIMEOUT", status: 504 });
});
