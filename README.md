# Ryovia

A Next.js anime discovery and watch app backed by AniList, MyAnimeList, and Anikoto. Catalog search, anime details, recommendations, ratings, and episode sources load through server API routes.

## Run locally

```bash
npm install
npm run dev
```

Open [localhost:3000](http://localhost:3000) for discovery. `/watch` opens Frieren (AniList ID `154587`), and `/watch/154587` opens that anime directly. Watch URLs use **AniList IDs**, not MAL or Anikoto IDs.

The default provider setup requires no credentials; individual titles and players may still be unavailable upstream. To configure providers, copy `.env.example` to `.env.local`, edit the values, and restart the server. Keep credentials in `.env.local`; never give them a `NEXT_PUBLIC_` prefix or commit that file.

```bash
npm test
npm run build
npm start
```

Tests mock upstream responses and cover provider failures, ID validation, matching, normalization, caching, source validation, and player availability checks. They do not stream real video. `npm start` serves the production build. See `DESIGN.md` for the layout and responsive behavior.

## Providers

| Provider | Purpose | Configuration |
| --- | --- | --- |
| [AniList](https://docs.anilist.co/) | Live catalog, search, genres, sorting, details, recommendations, and AniList/MAL ID mapping | Public GraphQL API; no key required |
| [MyAnimeList](https://myanimelist.net/apiconfig/references/api/v2) | MAL scores, rankings, popularity, and metadata | Optional `MAL_CLIENT_ID` enables the official API; [Jikan](https://docs.api.jikan.moe/) supplies public MAL data when no key is configured or the official API fails |
| [Anikoto](https://anikotoapi.site) | Episode metadata and supplied sub/dub player embeds | Default API `https://anikotoapi.site`, paired with `https://anikoto.cz` |

Anikoto resolution searches the configured site's public `/filter` page and checks at most three candidates through `/series/{id}`. It accepts a series only when its AniList or MAL ID matches, and rejects contradictory IDs. Similar titles alone never select a series.

`ANIKOTO_API_BASE_URL` and `ANIKOTO_SITE_URL` must be HTTPS origins with no path or query. Change them together when using another compatible deployment. `ANIKOTO_EMBED_HOSTS` is a comma-separated list of exact hostnames accepted for player URLs; its default is `megaplay.buzz`. The app displays provider-supplied embeds rather than downloading or proxying video. Episode and player availability depends on the external provider and can vary by title or language.

## API

All endpoints below use `GET`; `[id]` is a positive AniList ID.

| Route | Result |
| --- | --- |
| `/api/anime?search=&genre=&sort=TRENDING_DESC&page=1&perPage=18` | Catalog `data`, `pageInfo`, and `source` |
| `/api/anime/[id]` | Anime details and recommendations |
| `/api/anime/[id]/ratings` | Normalized MAL metadata; `data: null` if no MAL record is available |
| `/api/anime/[id]/episodes` | Matched Anikoto series, episodes, and allowed player URLs; status is `ready` or `unavailable` |
| `/api/anime/[id]/playback?episode=1&language=sub` | Checks the exact episode and language; returns `status`, `source`, and `providerUrl`, plus `message` when unavailable |
| `/api/health` | App response and configured provider modes; this does **not** probe upstream availability |

Catalog sorts are `TRENDING_DESC`, `POPULARITY_DESC`, `SCORE_DESC`, and `SEARCH_MATCH` (requires `search`). Page size defaults to 12 and is capped at 24; page numbers are limited to 1–500. Search text is limited to 100 characters and genre to 40. Provider errors return a non-success HTTP status and a structured error message.

The playback endpoint accepts a positive episode number up to 100000 and `language=sub` or `language=dub`. It resolves the anime through the same verified ID mapping; callers cannot supply an arbitrary player URL. A ready response contains the provider's source object:

```json
{
  "status": "ready",
  "source": {
    "id": "anikoto-sub",
    "provider": "Anikoto",
    "language": "sub",
    "type": "iframe",
    "url": "https://megaplay.buzz/stream/..."
  },
  "providerUrl": "https://anikoto.cz/watch/series-slug"
}
```

These URLs illustrate the response shape. For a missing episode, missing language, or recognized unavailable player page, `status` is `unavailable`, `source` is `null`, and `message` explains the result. `providerUrl` links to the matched Anikoto series or is `null` when there is no match. Network failures, access denials, timeouts, and invalid responses return structured errors with non-success HTTP statuses.

## Playback checks and current limitation

Pressing Play checks the supplied iframe's HTML before opening it. The check accepts only configured HTTPS embed hosts, reads at most 256 KB of HTML, times out after eight seconds, and refuses redirects. It does not fetch media, proxy video, or bypass provider access restrictions. Known HTTP 404/410 responses and MegaPlay's HTTP 200 missing-file error page produce an unavailable result instead of opening a known broken player.

**A ready HTML check is not proof that the video will play.** Playback can still fail inside the third-party iframe because of a removed file, regional restriction, provider error, or browser policy. The watch page provides an Anikoto link and additional viewing links supplied by AniList when available.

On **2026-09-05**, the Anikoto metadata API matched Frieren (AniList `154587`, MAL `52991`) to series `6351` and returned 28 episodes. Its supplied sub embeds for episodes 1 and 28 returned MegaPlay's file-not-found page with error code **410**, despite HTTP 200. The playback check correctly marks the tested episode unavailable. This observation does not establish that every Anikoto title or language is unavailable; successful full-video playback has not been established for those tested Frieren sources.

Upstream requests use timeouts, bounded in-memory caches, duplicate-request sharing, and rate controls. AniList catalog/details cache for 5/10 minutes, Anikoto series and mappings for 5 minutes, MAL for one hour, and player HTML checks for 60 seconds. Provider failures are not cached as successful checks. These controls are per server process and reset on restart; multiple instances need shared caching and rate limiting at deployment scale.

This version integrates public, read-only anime data. Account login, AniList/MAL list synchronization, and a persistent application database are not implemented.
