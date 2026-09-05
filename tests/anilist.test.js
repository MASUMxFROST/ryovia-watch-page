import test from "node:test";
import assert from "node:assert/strict";
import { ApiError, positiveInteger, apiSuccess, apiFailure } from "../src/lib/server/api.js";

let moduleId = 0;
const freshProvider = () => import(`../src/lib/server/anilist.js?test=${++moduleId}`);
const anime = (id = 154587, overrides = {}) => ({ id, idMal: 52991, title: { english: "Frieren: Beyond Journey's End" }, ...overrides });
const json = (data, status = 200, headers = {}) => new Response(JSON.stringify(data), {
  status, headers: { "Content-Type": "application/json", ...headers },
});

test("catalog search is sent as GraphQL variables and returns normalized live results", async (t) => {
  const { getAnimeCatalog } = await freshProvider();
  const search = '\")} mutation { deleteEverything } #';
  const fetch = t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, "https://graphql.anilist.co");
    assert.equal(options.method, "POST");
    assert.equal(options.redirect, "error");
    assert.equal(options.headers["Content-Type"], "application/json");
    assert.ok(options.signal instanceof AbortSignal);
    const body = JSON.parse(options.body);
    assert.ok(body.query.includes("$search"));
    assert.ok(!body.query.includes(search));
    assert.deepEqual(body.variables, { page: 2, perPage: 18, search, genre: "Adventure", sort: ["SEARCH_MATCH"] });
    return json({ data: { Page: { pageInfo: { currentPage: 2, hasNextPage: true }, media: [anime(), null, { id: -1 }, { id: 2, title: {} }] } } });
  });
  const result = await getAnimeCatalog({ search: `  ${search} `, genre: " Adventure ", page: "2", perPage: "18" });
  assert.equal(result.source, "anilist");
  assert.deepEqual(result.data.map((item) => item.id), [154587]);
  assert.deepEqual(result.pageInfo, { currentPage: 2, hasNextPage: true });
  assert.equal(fetch.mock.callCount(), 1);
});

test("catalog bounds, search lengths, and sorting reject invalid requests before fetching", async (t) => {
  const { getAnimeCatalog } = await freshProvider();
  const fetch = t.mock.method(globalThis, "fetch", async () => { throw new Error("Unexpected network request"); });
  for (const options of [
    { page: 0 }, { page: 501 }, { page: "1.5" }, { page: "01" },
    { perPage: 0 }, { perPage: 25 }, { perPage: "1e1" },
    { search: "x".repeat(101) }, { genre: "x".repeat(41) },
    { sort: "UNKNOWN" }, { sort: "SEARCH_MATCH" }, { search: "  ", sort: "SEARCH_MATCH" },
  ]) {
    await assert.rejects(getAnimeCatalog(options), { name: "ApiError", code: "INVALID_REQUEST", status: 400 });
  }
  assert.equal(fetch.mock.callCount(), 0);
});

test("catalog defaults and maximum accepted pagination work without explicit search", async (t) => {
  const requests = [];
  t.mock.method(globalThis, "fetch", async (_url, options) => {
    requests.push(JSON.parse(options.body).variables);
    return json({ data: { Page: { media: [], pageInfo: { hasNextPage: false } } } });
  });
  const defaults = await freshProvider();
  await defaults.getAnimeCatalog();
  const bounds = await freshProvider();
  await bounds.getAnimeCatalog({ page: "500", perPage: "24", sort: "SCORE_DESC" });
  assert.deepEqual(requests, [
    { page: 1, perPage: 12, sort: ["TRENDING_DESC"] },
    { page: 500, perPage: 24, sort: ["SCORE_DESC"] },
  ]);
});

test("equivalent catalog requests share an in-flight query and reuse cached data", async (t) => {
  const { getAnimeCatalog } = await freshProvider();
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  const fetch = t.mock.method(globalThis, "fetch", async () => {
    await gate;
    return json({ data: { Page: { media: [anime()], pageInfo: { hasNextPage: false } } } });
  });
  const first = getAnimeCatalog({ search: "Frieren" });
  const second = getAnimeCatalog({ search: " Frieren ", page: "1", perPage: "12" });
  release();
  assert.deepEqual(await first, await second);
  assert.deepEqual(await getAnimeCatalog({ search: "Frieren" }), await first);
  assert.equal(fetch.mock.callCount(), 1);
});

test("upstream 429 sets a cooldown and exposes Retry-After without retrying the provider", async (t) => {
  const { getAnime, getAnimeCatalog } = await freshProvider();
  t.mock.method(Date, "now", () => 100000);
  const fetch = t.mock.method(globalThis, "fetch", async () => json({ errors: [{ message: "Upstream private detail" }] }, 429, { "Retry-After": "17" }));
  await assert.rejects(getAnime(154587), (error) => {
    assert.ok(error instanceof ApiError);
    assert.equal(error.code, "ANILIST_RATE_LIMITED");
    assert.equal(error.status, 503);
    assert.equal(error.retryAfter, 17);
    const response = apiFailure(error);
    assert.equal(response.headers.get("Retry-After"), "17");
    assert.equal(response.headers.get("Cache-Control"), "no-store");
    assert.doesNotMatch(error.message, /Upstream private detail/);
    return true;
  });
  await assert.rejects(getAnimeCatalog(), { code: "ANILIST_RATE_LIMITED", retryAfter: 17 });
  assert.equal(fetch.mock.callCount(), 1);
});

test("HTTP, GraphQL, and null-record not-found results consistently return 404", async (t) => {
  for (const [name, makeResponse] of [
    ["HTTP", () => json({ message: "Missing" }, 404)],
    ["GraphQL", () => json({ errors: [{ status: 404, message: "Not found" }] })],
    ["null record", () => json({ data: { Media: null } })],
  ]) {
    await t.test(name, async (subtest) => {
      const { getAnime } = await freshProvider();
      subtest.mock.method(globalThis, "fetch", async () => makeResponse());
      await assert.rejects(getAnime(154587), { code: "ANIME_NOT_FOUND", status: 404 });
    });
  }
});

test("provider failures and malformed catalogs return typed errors instead of fake results", async (t) => {
  for (const [name, makeResponse, expected] of [
    ["service unavailable", () => json({ secret: "private details" }, 500), { code: "ANILIST_UNAVAILABLE", status: 503 }],
    ["GraphQL failure", () => json({ errors: [{ message: "private details" }] }), { code: "ANILIST_INVALID_RESPONSE", status: 502 }],
    ["missing data", () => json({}), { code: "ANILIST_INVALID_RESPONSE", status: 502 }],
    ["wrong media container", () => json({ data: { Page: { media: {} } } }), { code: "ANILIST_INVALID_RESPONSE", status: 502 }],
    ["bad JSON", () => new Response("not json"), { code: "ANILIST_UNAVAILABLE", status: 503 }],
  ]) {
    await t.test(name, async (subtest) => {
      const { getAnimeCatalog } = await freshProvider();
      subtest.mock.method(globalThis, "fetch", async () => makeResponse());
      await assert.rejects(getAnimeCatalog(), (error) => {
        assert.ok(error instanceof ApiError);
        assert.equal(error.code, expected.code);
        assert.equal(error.status, expected.status);
        assert.doesNotMatch(error.message, /private details/);
        return true;
      });
    });
  }
});

test("a failed query does not poison the cache or retain its pending slot", async (t) => {
  const { getAnime } = await freshProvider();
  let now = 100000;
  t.mock.method(Date, "now", () => now);
  let calls = 0;
  const fetch = t.mock.method(globalThis, "fetch", async () => {
    calls += 1;
    if (calls === 1) throw new TypeError("Failed fetch with private data");
    return json({ data: { Media: anime() } });
  });
  await assert.rejects(getAnime(154587), { code: "ANILIST_UNAVAILABLE" });
  now += 3000;
  assert.equal((await getAnime(154587)).id, 154587);
  assert.equal((await getAnime("154587")).id, 154587);
  assert.equal(fetch.mock.callCount(), 2);
});

test("invalid catalog and wrong-ID detail responses are retried after upstream recovery", async (t) => {
  for (const kind of ["catalog", "detail"]) {
    await t.test(kind, async (subtest) => {
      const provider = await freshProvider();
      let now = 100000;
      subtest.mock.method(Date, "now", () => now);
      let calls = 0;
      const fetch = subtest.mock.method(globalThis, "fetch", async () => {
        calls += 1;
        const data = kind === "catalog"
          ? { Page: { media: calls === 1 ? {} : [anime()] } }
          : { Media: anime(calls === 1 ? 21 : 154587) };
        return json({ data });
      });
      const request = () => kind === "catalog" ? provider.getAnimeCatalog() : provider.getAnime(154587);
      await assert.rejects(request(), { code: "ANILIST_INVALID_RESPONSE", status: 502 });
      now += 3000;
      const recovered = await request();
      assert.equal(kind === "catalog" ? recovered.data[0].id : recovered.id, 154587);
      assert.deepEqual(await request(), recovered);
      assert.equal(fetch.mock.callCount(), 2);
    });
  }
});

test("normalization strips executable HTML and unsafe URLs while preserving unknown metadata", async () => {
  const { normalizeAnime } = await freshProvider();
  const result = normalizeAnime(anime(154587, {
    title: { english: "<b>Frieren &amp; friends</b>" },
    description: '<p>An <em>adventure</em> &amp; a journey.<br>Next line.</p><script>alert("bad")</script><style>body{display:none}</style>',
    coverImage: { extraLarge: "javascript:alert(1)" },
    bannerImage: "https://username:password@example.com/banner.jpg",
    siteUrl: "https://malicious.example/anime/999",
    averageScore: 0, episodes: 0, duration: -1, popularity: 0, seasonYear: null,
    status: null, genres: ["Adventure", null, 123],
  }));
  assert.equal(result.title, "Frieren & friends");
  assert.equal(result.description, "An adventure & a journey.\nNext line.");
  assert.equal(result.poster, null);
  assert.equal(result.banner, null);
  assert.equal(result.siteUrl, "https://anilist.co/anime/154587");
  assert.equal(result.score, null);
  assert.equal(result.episodes, null);
  assert.equal(result.durationMinutes, null);
  assert.equal(result.year, null);
  assert.equal(result.popularity, 0);
  assert.equal(result.status, "Unknown");
  assert.deepEqual(result.genres, ["Adventure"]);
  assert.equal(normalizeAnime(anime(1, { format: {} })).format, "Anime");
  assert.equal(normalizeAnime(anime(1, { averageScore: 101 })).score, null);
  assert.equal(normalizeAnime(anime(1, { title: { romaji: "Sousou no Frieren" }, coverImage: { large: "http://example.com/poster.jpg" } })).poster, "https://example.com/poster.jpg");
});

test("detail retrieval rejects an upstream record whose ID differs from the requested anime", async (t) => {
  const { getAnime } = await freshProvider();
  t.mock.method(globalThis, "fetch", async () => json({ data: { Media: anime(21) } }));
  await assert.rejects(getAnime(154587), { code: "ANILIST_INVALID_RESPONSE", status: 502 });
});

test("details filter malformed recommendations, duplicates, self matches, and unsafe streaming links", async (t) => {
  const { getAnime } = await freshProvider();
  t.mock.method(globalThis, "fetch", async () => json({ data: { Media: anime(154587, {
    recommendations: { nodes: [
      null, {}, { mediaRecommendation: null }, { mediaRecommendation: anime() },
      { mediaRecommendation: anime(21) }, { mediaRecommendation: anime(21) },
      { mediaRecommendation: anime(2, { isAdult: true }) },
      { mediaRecommendation: { id: 3, title: {} } },
      { mediaRecommendation: anime(4) },
    ] },
    externalLinks: [null, {},
      { type: "STREAMING", site: "<b>Example</b>", url: "https://example.com/watch" },
      { type: "STREAMING", site: "Unsafe", url: "data:text/html,unsafe" },
      { type: "INFO", site: "Info", url: "https://example.com/info" },
    ],
    streamingEpisodes: [null, {},
      { title: "<b>Episode 1</b>", site: "Example", url: "https://example.com/episode-1" },
      { title: "Unsafe", site: "Unsafe", url: "javascript:alert(1)" },
    ],
  }) } }));
  const result = await getAnime(154587);
  assert.deepEqual(result.recommendations.map((item) => item.id), [21, 4]);
  assert.deepEqual(result.streamingLinks, [{ site: "Example", url: "https://example.com/watch" }]);
  assert.deepEqual(result.streamingEpisodes, [{ title: "Episode 1", site: "Example", url: "https://example.com/episode-1" }]);
});

test("malformed optional detail containers do not prevent valid anime details from loading", async (t) => {
  const { getAnime } = await freshProvider();
  t.mock.method(globalThis, "fetch", async () => json({ data: { Media: anime(154587, {
    recommendations: { nodes: {} }, externalLinks: {}, streamingEpisodes: "invalid",
  }) } }));
  const result = await getAnime(154587);
  assert.equal(result.id, 154587);
  assert.deepEqual(result.recommendations, []);
  assert.deepEqual(result.streamingLinks, []);
  assert.deepEqual(result.streamingEpisodes, []);
});

test("API helpers validate IDs and keep failure responses private and non-cacheable", async () => {
  assert.equal(positiveInteger("154587"), 154587);
  assert.equal(positiveInteger(undefined, "page", 1, 500), 1);
  for (const id of [0, "01", 1.5, "1/../../admin", "1e3", "2147483648", null]) {
    assert.throws(() => positiveInteger(id), { code: "INVALID_REQUEST", status: 400 });
  }
  const error = new Error("Secret token should never reach the browser");
  const failure = apiFailure(error);
  assert.equal(failure.status, 503);
  assert.equal(failure.headers.get("Cache-Control"), "no-store");
  assert.equal(failure.headers.get("X-Content-Type-Options"), "nosniff");
  const body = await failure.json();
  assert.equal(body.error.code, "SERVICE_UNAVAILABLE");
  assert.doesNotMatch(JSON.stringify(body), /Secret token|stack/);
  const success = apiSuccess({ data: [{ id: 1 }] }, 120);
  assert.equal(success.status, 200);
  assert.match(success.headers.get("Cache-Control"), /s-maxage=120/);
  assert.deepEqual(await success.json(), { data: [{ id: 1 }] });
});
