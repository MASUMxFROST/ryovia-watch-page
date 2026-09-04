---
name: Ryovia Watch
description: A player-first anime viewing surface with charcoal layers, vivid green state signals, and key-art atmosphere.
colors:
  signal-green: "rgb(83, 255, 134)"
  canvas-charcoal: "#242428"
  surface-slate: "#343a40"
  text-primary: "#ffffff"
  text-secondary: "rgb(224, 224, 224)"
  active-ink: "#101412"
  atmosphere-overlay: "rgba(31, 31, 35, 0.82)"
  player-overlay: "rgba(4, 5, 7, 0.83)"
  progress-track: "rgba(255, 255, 255, 0.3)"
typography:
  headline:
    fontFamily: "Trebuchet MS, sans-serif"
    fontSize: "32px"
    fontWeight: 700
    lineHeight: 1.2
  body:
    fontFamily: "Trebuchet MS, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "normal"
  control:
    fontFamily: "Trebuchet MS, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: "normal"
  label:
    fontFamily: "Trebuchet MS, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: "normal"
  micro:
    fontFamily: "Trebuchet MS, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: "normal"
rounded:
  compact: "4px"
  soft: "5px"
  pill: "20px"
  full: "50%"
spacing:
  xxs: "5px"
  xs: "8px"
  sm: "10px"
  md: "16px"
  lg: "20px"
  xl: "24px"
  2xl: "40px"
components:
  episode-tile:
    backgroundColor: "{colors.surface-slate}"
    textColor: "{colors.text-primary}"
    typography: "{typography.control}"
    rounded: "{rounded.compact}"
    padding: "5px"
  episode-tile-selected:
    backgroundColor: "{colors.signal-green}"
    textColor: "{colors.active-ink}"
    typography: "{typography.control}"
    rounded: "{rounded.compact}"
    padding: "5px"
  server-chip:
    backgroundColor: "{colors.surface-slate}"
    textColor: "{colors.text-primary}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "6px 15px"
  server-chip-selected:
    backgroundColor: "{colors.signal-green}"
    textColor: "{colors.active-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "6px 15px"
  player-play-medallion:
    backgroundColor: "{colors.signal-green}"
    textColor: "{colors.active-ink}"
    rounded: "{rounded.full}"
    size: "72px"
  search-field:
    backgroundColor: "{colors.surface-slate}"
    textColor: "{colors.signal-green}"
    typography: "{typography.control}"
    rounded: "50px"
    padding: "0 56px 0 20px"
    height: "40px"
  anime-card:
    backgroundColor: "{colors.surface-slate}"
    textColor: "{colors.text-primary}"
    typography: "{typography.body}"
    padding: "0 10px 10px"
---

# Design System: Ryovia Watch

## Overview

**Creative North Star: "The Neon Screening Room"**

Ryovia Watch feels like a compact digital screening room: the frame is nearly black, the anime key art spills into the surrounding atmosphere as a deep blur, and a single saturated green behaves like a status lamp. The interface stays useful and dense instead of cinematic for its own sake; the current player region, episode grid, controls, and metadata remain immediately scannable.

The player leads the responsive experience. Supporting controls are terse, close to the content they affect, and built from familiar compact geometry. The player itself is an inert visual shell: its play glyph, progress track, timecode, server labels, and language labels communicate composition and state styling only, never playback availability, provider behavior, or a network contract.

**Key Characteristics:**

- Charcoal digital surfaces with minimal separation lines.
- Saturated green reserved for active state, focus, and high-value emphasis.
- Blurred key art used as atmosphere behind the primary viewing region.
- Dense episode and utility controls with tabular numerals.
- Player-first reflow from desktop rail layout to stacked mobile flow.
- Compact Trebuchet typography that favors utility over editorial display.

## Colors

The palette is a near-black charcoal stack energized by one electric green signal, with imagery supplying all incidental color.

### Primary

- **Signal Green:** The sole interface accent for selected episodes, selected server and language states, progress, interactive emphasis, section headings, and accent hover states.

### Neutral

- **Canvas Charcoal:** The page canvas and strongest structural surface.
- **Surface Slate:** Episode tiles, utility controls, cards, and secondary containers.
- **Primary White:** Main copy, icons, and default control labels on dark surfaces.
- **Soft Silver:** Descriptive copy that should recede beneath titles and controls.
- **Active Ink:** Near-black text and icons placed on Signal Green.
- **Atmosphere Overlay:** The translucent charcoal wash over blurred key art around the watch region.
- **Player Overlay:** The darker translucent wash inside the player preview.
- **Progress Track:** A restrained translucent white track beneath green progress.

**The One Signal Rule.** Signal Green is the only system-wide status accent; do not introduce competing action colors.

**The Image Supplies Color Rule.** Poster art may create atmosphere, but UI chrome remains charcoal, white, and Signal Green.

## Typography

**Display Font:** Trebuchet MS (with sans-serif fallback)  
**Body Font:** Trebuchet MS (with sans-serif fallback)  
**Label Font:** Trebuchet MS (with sans-serif fallback)

**Character:** The single-family system is compact, direct, and slightly technical. Weight and size establish hierarchy without introducing a separate display voice.

### Hierarchy

- **Headline:** Bold and compact; reserved for the current anime title.
- **Body:** Small, readable descriptive copy and card titles.
- **Control:** The default size for episode numbers and ordinary interface controls; use tabular numerals where values form a grid or timecode.
- **Label:** Compact server, language, and chip text.
- **Micro:** Timecodes, counts, scores, and tertiary utility information.

**The Utility First Rule.** Keep controls and metadata compact; large typography belongs only to the current title and section hierarchy.

## Layout

The watch surface begins beneath the fixed navigation and uses a three-part desktop composition: a dense episode rail, a dominant player column, and an anime-detail rail. At wide sizes the media center occupies three quarters of the row, splitting internally into a one-quarter episode rail and three-quarter player. The detail rail uses the remaining quarter.

Below the wide breakpoint (1400px), details move beneath the media center. At 1100px, the media center stacks in reverse order so the player appears before the episode grid; both settle at 80% width before reaching full width at 1000px. On compact screens (580px), the player becomes a taller 4:3 frame, the episode grid uses six columns, the navigation offset contracts, and the play medallion reduces from 72px to 58px.

Spacing is tight and modular: 5px gaps make episode grids dense, 8–10px separates utility groups, 16–24px separates meaningful control and content clusters, and 20px is the common container inset. Recommendation cards expand from six columns toward four, three, and two as available width falls.

**The Player First Rule.** When horizontal space collapses, preserve the player before episode selection and supporting metadata.

**The Dense Rail Rule.** Episode numbers should remain compact, evenly packed, and vertically scrollable before becoming oversized controls.

## Elevation & Depth

Depth comes primarily from tonal layering and optical atmosphere rather than stacked card shadows. A blurred poster fills the watch region behind a translucent charcoal wash, while the player adds a second, darker blur layer. The circular play medallion receives the strongest shadow to read as the visual focal point; the fixed navigation gains a compact black shadow only in its scrolled state.

### Shadow Vocabulary

- **Play Medallion:** A broad downward shadow gives the green circle focus against the dark player.
- **Scrolled Navigation:** A short black shadow separates fixed navigation from moving content.

**The Atmospheric Depth Rule.** Use image blur and tonal overlays for environmental depth; reserve explicit shadows for focal or fixed elements.

## Shapes

The form language pairs compact rectangles with occasional full pills and circles. Episode tiles use gently softened corners, server and language choices use pill silhouettes, poster thumbnails use small radii, and the primary play marker is circular. Segmented selectors round only their outer ends so adjacent choices read as one control. Avoid large soft cards: the overall frame should remain dense and digital.

## Components

### Episode Tiles

- **Shape:** Compact rectangles with gently softened corners.
- **Default:** White tabular numerals on Surface Slate with equal internal padding.
- **Selected:** Signal Green with Active Ink; selection must remain obvious without adding another accent.
- **Focus:** A two-pixel white outline offset three pixels from the tile.
- **Density:** Four columns in the wide episode rail, ten columns in the intermediate stacked rail, and six columns on compact screens.

### Server and Language Chips

- **Shape:** Full utility pills with horizontal padding.
- **Default:** White label on Surface Slate.
- **Selected:** Signal Green with Active Ink.
- **Meaning:** These controls demonstrate local visual selection only; their labels do not promise a provider, stream, or language service.

### Player Preview

- **Frame:** A 16:9 cover-art preview on larger screens and 4:3 on compact screens, clipped cleanly at the edges.
- **Atmosphere:** Poster art remains visible only through a dark translucent blur.
- **Focal Marker:** A Signal Green circular play medallion centered over the preview.
- **Controls:** A thin white track, short green progress segment, compact timecode, and evenly spaced white utility glyphs sit along the lower edge.
- **Behavior:** Treat the entire composition as inert presentation unless real playback behavior is explicitly introduced in a separate product scope.

### Description Toggle

- **Style:** Inline, borderless Signal Green text appended to the description.
- **Focus:** The same white offset outline used by selection controls.

### Search Field

- **Shape:** A low horizontal capsule aligned to the fixed navigation.
- **Default:** Surface Slate with Signal Green content in the scrolled navigation; the unscrolled state may invert to a white field with dark content.
- **Compact Treatment:** Move to a full-width floating row below the navigation when the primary nav cannot contain it.

### Anime Cards and Rankings

- **Cards:** Poster-led, square-edged Surface Slate containers with a dark bottom gradient and compact title/meta block.
- **Hover:** A translucent slate blur may cover the poster and reveal a large white play symbol on pointer-capable wide layouts.
- **Rankings:** Use dense rows, small poster thumbnails, muted ranks, and a Signal Green underline for the top three.

### Navigation

- **Structure:** Fixed, 65px high on larger screens and 50px high on compact screens.
- **Default:** Transparent over the opening surface; it resolves to an opaque dark bar when compact and to the incumbent scrolled treatment on larger screens.
- **Utilities:** Keep labels micro-sized and green icons visually dominant; collapse social and utility clusters progressively rather than wrapping them.

## Do's and Don'ts

### Do:

- **Do** use Signal Green only for selected, focused, progress, and high-value emphasis states.
- **Do** let key art tint the atmosphere while protecting legibility with charcoal blur overlays.
- **Do** preserve dense, tabular episode numbering and compact utility labels.
- **Do** reorder to a player-first stacked flow on narrow screens.
- **Do** describe player and server UI as a visual shell unless behavior is implemented in a separately defined scope.

### Don't:

- **Don't** imply streaming, provider, subtitle, dub, or playback behavior from this visual system alone.
- **Don't** add gradients, accent colors, or decorative glow to interface chrome beyond imagery-derived atmosphere.
- **Don't** inflate controls into spacious cards or replace the dense grid with oversized tiles.
- **Don't** use heavy shadows across ordinary surfaces; keep depth tonal and image-led.
- **Don't** introduce ornate display typography that competes with the compact utility hierarchy.
