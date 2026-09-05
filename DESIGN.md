---
name: Ryovia Watch
description: A compact anime discovery and watch interface with live catalog data, episode selection, provider checks, and useful side panels.
colors:
  signal-green: "rgb(83, 255, 134)"
  canvas-charcoal: "#15171a"
  surface-slate: "#292d32"
  panel-charcoal: "#1d2125"
  border-slate: "#30363b"
  text-primary: "#ffffff"
  text-secondary: "#aeb6bd"
  active-ink: "#101412"
typography:
  family: "Trebuchet MS, sans-serif"
  headline: "22–30px / 700 / 1.2"
  section: "16–20px / 600–700"
  body: "12–14px"
  control: "11–12px"
geometry:
  content-max-width: "1600px"
  navigation-height: "64px desktop; 56px at 700px and below"
  page-inset: "24px desktop; 20px tablet; 14px mobile"
  control-radius: "4px"
  panel-radius: "6px"
  poster-radius: "7px"
  player-ratio: "16:9 at every viewport"
---

# Ryovia Watch

## Identity and scope

Use the exact supplied Ryovia artwork in `src/media/ryovia-logo.png` for navigation, the menu, and the footer. Preserve its skull emblem, letterforms, and colors; the compact CSS display window trims the supplied image's surrounding space. All product naming is Ryovia.

The app uses server API routes for AniList catalog data, recommendations, MAL ratings, and Anikoto episode sources. `/` is the discovery page; `/watch/[id]` uses an AniList ID, and `/watch` opens Frieren. Account login, synchronized watch lists, and a persistent application database are outside the current implementation.

Separate metadata availability from playback availability. An episode can appear in the provider catalog while its video is unavailable. The interface must show loading, empty, unavailable, and retry states without substituting fixture content or invented scores.

## Layout and density

The page uses a centered 1600px maximum width. A fixed 64px navigation bar becomes 56px on mobile. Breadcrumbs and a compact title row introduce the player without a separate hero or decorative spacer.

On desktop, the player and its provider/language controls occupy the main column. A 320px right column contains the episode grid and a compact poster, metadata, and synopsis panel; it widens to 350px at 1450px. The sidebar is 280px from 860–1099px. Below 860px it moves beneath the player, initially in two columns, then stacks at 700px. The player stays 16:9 on mobile.

Episodes use seven columns, 5–6px gaps, tabular numbers, and a clear green selected state. Long lists use ranges of 49 episodes. Panel padding is 12–18px. Show the selected episode title near the grid, and keep metadata close to its related controls without unnecessary full-width bands.

Recommendations follow the watch area directly, separated by a subtle rule and 24px spacing. Their main and sidebar columns align with the player layout on desktop. Up to eight AniList recommendations form a four-column grid with 14px column gaps and 20px row gaps. Cards use three columns at 700px and two at 480px. At 1099px and below, recommendation sorting and genres move beneath the card grid; those support panels stack on mobile. An empty recommendation set shows a compact link back to discovery.

Discovery places search, genre selection, and Trending now / Most popular / Top rated controls above 18 results per page. Its poster grid uses six columns on wide screens, five below 1151px, four below 901px, three below 701px, and two below 481px. Loading skeletons preserve the card layout. No-results and service-error states give a clear next action; pagination preserves the current filters.

## Visual language

Charcoal surfaces, restrained borders, and poster artwork establish hierarchy. Green marks selection, focus, scores, and small emphasis; section headings remain near-white. Keep ordinary containers compact with 4–7px corner radii and avoid decorative shadows or oversized empty cards.

Typography uses Trebuchet MS throughout. The current title is 22–30px, section headings 16–20px, descriptions and card titles 12–14px, and controls and metadata 10–12px. Secondary copy uses muted gray with sufficient contrast against dark surfaces.

Before playback, the player uses darkened, lightly blurred AniList banner or poster art, a green circular Play button, and a compact control strip. After a successful HTML availability check it displays the supplied iframe inside the same 16:9 frame. Poster cards keep a consistent 3:4 frame, readable episode and score badges, complete titles truncated only by CSS, and a small metadata row. Hover and keyboard-focus descriptions remain contained within the card instead of covering adjacent content.

## Interaction details

- Use visible keyboard focus outlines and expose selected controls with `aria-pressed`.
- Keep language selections as compact outlined green states; selected episodes use a solid green fill. Disable languages absent from the selected episode's supplied sources. The current provider is Anikoto; do not invent additional server choices.
- Selecting an episode updates the URL's `episode` query and closes the current player. Previous/next controls respect list boundaries. Changing language closes the player so a fresh Play action checks the selected source.
- Play calls `/api/anime/[id]/playback?episode=1&language=sub`. Show checking, unavailable, and retry states in the player region. An unavailable response has no source to embed. A ready response permits opening the provider iframe; it does not establish successful video playback.
- Navigation search queries AniList after a short debounce, shows up to five suggestions, and links to each anime's watch route. Submitting or choosing View all results opens discovery with the search query. Mobile search opens below navigation and supports Escape and outside-click dismissal.
- Discovery search, genre, sorting, and pagination are reflected in the URL and use live catalog requests. Cancel stale requests and preserve browser Back/Forward behavior.
- Recommendation sorting uses Featured, Popular, and Rating labels. These reorder only the currently returned recommendations; they are not global or time-based rankings.
- Genre chips start compact and expand in place; selecting one opens the filtered discovery catalog. Recommendation content renders without entrance animations that leave blank regions.
- AniList and MAL scores link to their source records. Missing scores show a dash, and a failed MAL request does not block episode loading or erase AniList metadata.
- Keep provider attribution and external viewing options next to the player. Open external links separately and prevent them from controlling the Ryovia page.
- Retain a compact footer and the exact Ryovia mark; omit the standalone share band from the watch flow.

## Provider availability

The player iframe permits the functionality needed for playback while restricting popup and top-level navigation behavior. The backend checks only a bounded amount of HTML from allowed HTTPS hosts; it does not inspect or download video data. Cross-origin player failures may occur after the HTML check, so avoid labels that promise a working stream.

On 2026-09-05, the supplied Frieren episode 1 and 28 sub embeds showed MegaPlay's removed-file / error 410 page under HTTP 200. The preflight detects this known error and returns an unavailable state. Treat this as a concrete provider limitation for the tested sources, not evidence that every title is unavailable. See `README.md` for provider setup and API contracts.
