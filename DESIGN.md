---
name: Ryovia Watch
description: A compact anime watch interface with a dominant player, useful side panels, and immediate discovery content.
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

This is a UI preview backed by local anime fixtures. Episode selection, previous/next controls, server and language selection, description expansion, ranking sorts, genre expansion, navigation, and local collection search work in the browser. The player remains a visual preview; no streaming service, playback, remote catalog, or account behavior is implied.

## Layout and density

The page uses a centered 1600px maximum width. A fixed 64px navigation bar becomes 56px on mobile. Breadcrumbs and a compact title row introduce the player without a separate hero or decorative spacer.

On desktop, the player and its server/language controls occupy the main column. A 320px right column contains the episode grid and a compact poster, metadata, and synopsis panel; it widens to 350px at 1450px. The sidebar is 280px from 860–1099px. Below 860px it moves beneath the player, initially in two columns, then stacks at 700px. The player stays 16:9 on mobile.

Episodes use seven columns, 5–6px gaps, tabular numbers, and a clear green selected state. Panel padding is 12–18px. Keep metadata close to its related controls and avoid unnecessary full-width bands.

Recommendations follow the watch area directly, separated by a subtle rule and 24px spacing. Their main and sidebar columns align with the player layout on desktop. Eight local posters form two rows of four with 14px column gaps and 20px row gaps. Cards use three columns at 700px and two at 480px. At 1099px and below, rankings and genres move beneath the card grid; those support panels stack on mobile.

## Visual language

Charcoal surfaces, restrained borders, and poster artwork establish hierarchy. Green marks selection, focus, scores, and small emphasis; section headings remain near-white. Keep ordinary containers compact with 4–7px corner radii and avoid decorative shadows or oversized empty cards.

Typography uses Trebuchet MS throughout. The current title is 22–30px, section headings 16–20px, descriptions and card titles 12–14px, and controls and metadata 10–12px. Secondary copy uses muted gray with sufficient contrast against dark surfaces.

The player uses darkened, lightly blurred poster art, a green circular play marker, and a compact control strip. Poster cards keep a consistent 3:4 frame, readable episode and score badges, complete titles truncated only by CSS, and a small metadata row. Hover descriptions remain contained within the card instead of covering adjacent content.

## Interaction details

- Use visible keyboard focus outlines and expose selected controls with `aria-pressed`.
- Keep server/language selections as compact outlined green states; selected episodes use a solid green fill.
- Search filters the local collection and links to the corresponding watch or poster anchor. Mobile search opens below the navigation.
- Rankings use Featured, Popular, and Rating labels that describe their local sort behavior. Do not label the eight entries as a top ten or imply time-based ranking data.
- Genre chips start compact and expand in place. Recommendation content renders immediately without entrance animations that leave blank regions.
- Search and ranking jumps highlight the target card and account for the fixed navigation with scroll margins.
- Retain a compact footer and the exact Ryovia mark; omit the standalone share band from the watch flow.
