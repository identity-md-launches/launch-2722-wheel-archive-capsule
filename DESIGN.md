# Wheel Archive design system

## Overview

Wheel Archive is a small settlement collection for browsing, saving, and signing personal keepsakes. Its visual system uses warm paper surfaces, dark green ink, architectural wheel studies, and a chartreuse primary action. The artwork carries the circular archive idea; the interface remains quiet and practical.

Canonical tokens and component styles live in `src/styles.css`. `src/WheelArt.tsx` owns artwork colors and geometry. The final production export was inspected in Chromium at desktop and phone widths. The content is an explicitly labeled exhibition collection, not a live data dashboard.

## Colors

Components use semantic roles mapped to a small primitive palette. The palette is deliberately light only.

| Semantic token | Value | Purpose |
| --- | --- | --- |
| `--color-bg` | `#f7f7f2` | Paper background, dialogs |
| `--color-sidebar` | `#efefe7` | Navigation rail |
| `--color-surface` | `#ffffff` | Available plain surface token |
| `--color-text` | `#283329` | Body, headings, icons, dark notices |
| `--color-muted` | `#656b5d` | Secondary copy and metadata |
| `--color-border` | `#dddfd3` | Dividers and structural outlines |
| `--color-hover` | `#e9eedf` | Neutral action hover/pressed surface |
| `--color-accent` | `#d5ec92` | Primary action fill |
| `--color-accent-hover` | `#c7e575` | Primary hover and pressed fill |
| `--color-accent-ink` | `#283329` | Text on primary fill |
| `--color-success` | `#4e6337` | Saved/stamped icons and success text |
| `--color-error` | `#a13c30` | Recoverable inline errors |
| `--color-focus` | `#405b23` | Two-pixel keyboard focus outline |

`--neutral-400: #92978b` is the unconnected dot. The paired text communicates its state; the dot is not a status announcement by itself.

Measured contrast: body/page 12.25:1; muted/page 5.12:1; primary text/fill 10.18:1; error/page 6.10:1. Focus/page is 7.14:1 and focus/accent is 5.93:1. These values describe the identified opaque pairs, not a claim about every possible rendered state. The final probe checked visible UI text against its resolved background.

The artwork palette, confined to `WheelArt`, pairs sage `#e4ead5/#4d613b`, peach `#efe0d0/#956748`, lavender `#e7e3ed/#78628e`, sand `#ece8da/#8b7c4f`, blue `#dfe8e9/#527779`, and rose `#eadfdb/#92685f`. These identify exhibition forms, not action or settlement status. Artwork has an accessible descriptive SVG name.

## Typography

DM Sans Variable is the interface family, with sans-serif fallbacks. DM Mono, with monospace fallback, is reserved for settlement identifiers, dates, counters, and wallet addresses. Both are local Fontsource assets with `font-display: swap`; intended fonts were confirmed loaded in Chromium.

The interface uses weights 400 and 600. DM Sans supplies a normal variable weight face; DM Mono supplies normal 400. There is no synthetic italic or bold dependency.

| Token | Default | Role |
| --- | --- | --- |
| `--text-caption` | 12px | Metadata, captions, compact utilities |
| `--text-small` | 14px | Body UI, descriptions, buttons |
| `--text-body` | 16px | Phone search input, instructional subheads |
| `--text-section` | 20px | Section and capsule-card titles |
| `--text-title` | 28px | Featured and detailed capsule titles |
| `--text-display` | 48px; 36px at ≤720px | Page heading |

Sizes are authored in rem. Body line height is 1.5, detail stories 1.65, headings 1.2, and the page heading 1.1. Display tracking is −0.055em; smaller titles use −0.025em to −0.04em; data counters explicitly reset tracking to zero. Headings balance; descriptions use pretty wrapping. Long addresses wrap anywhere and are never ellipsized in details. Changing numbers use tabular numerals. Reading copy is capped around 48–62ch.

## Layout

Spacing tokens are 4, 8, 12, 16, 20, 24, 32, 40, and 48px. The desktop shell has a 224px sidebar, an 86px header, and a content region with 48px inline gutters and a 1360px maximum width. The primary featured capsule uses a roughly equal split between artwork and its record. The collection uses three equal columns and 24px gaps.

| Breakpoint | Implemented adaptation |
| --- | --- |
| ≥1600px | Sidebar expands to 248px; 48px top content spacing |
| ≤1190px | Sidebar narrows to 194px, gutters to 32px, grid gaps to 16px; toolbar can wrap |
| 721–960px | Sidebar becomes an 80px icon rail; navigation keeps explicit accessible names |
| ≤720px | Navigation becomes a top row; 20px page gutters; display heading 36px; two collection columns; search input is 16px; wallet dialog becomes a bottom sheet |
| ≤510px | Featured art stacks above the record with a 195px art area; one collection column; primary action expands across the record |
| ≤350px | Page gutters reduce to 16px and low-priority decorative icons are removed |

At 390 × 844, the main action occupies approximately y=638–682 and is fully visible. At 320, 390, 600, 800, 1024, and 1440px, automated reflow checks found no horizontal page overflow. Full-page desktop and first-screen mobile screenshots were inspected. Native browser zoom, RTL, and translated layouts were not manually verified.

## Elevation & depth

The system is flat: structural one-pixel borders, tonal surfaces, and no drop shadows. Cards do not contain nested cards. Native dialogs use the browser top layer, an ink backdrop at 48% opacity, and 3px backdrop blur. Notifications use solid inverse colors and remain dismissible rather than disappearing on a timer.

## Shapes

Controls use `--radius-control: 6px`; capsule surfaces use `--radius-surface: 10px`. Desktop dialogs use 12px; phone wallet sheets use 16px at their upper corners. Circular utility buttons sit over artwork. Wheel linework, fine grids, and registration marks are artwork rather than repeated decorative interface layers. Artwork corners follow their capsule container without clipping textual content. The featured SVG inherits its container’s corner radii at each breakpoint.

## Components

- **`WheelMark` / `Icon`**, `src/Icons.tsx`: shared circular brand mark and a single currentColor outline icon set. Decorative icons are hidden from assistive technology. Icon-only controls receive names from their buttons.
- **`WheelArt`**, `src/WheelArt.tsx`: accepts `theme`, `shape`, and `large`; creates locally rendered SVG wheel studies, background grids, and descriptive accessible names. Geometry is deterministic and has no animation.
- **`CapsuleCard`**, `src/App.tsx`: consistent artwork, settlement/date row, linked title, short note, bookmark, and open control. Bookmark buttons expose `aria-pressed`. A stamped state includes a check and text, not color alone.
- **Featured capsule**, `src/App.tsx`: one chartreuse `Explore capsule` action plus a neutral bookmark. Settlement metadata and exhibition disclosure sit beside the record.
- **Buttons**, `src/styles.css`: `.button.primary` for the current surface’s primary task, `.button.secondary` for outlined utility actions, `.text-button` for text utilities, `.icon-button` for compact named controls. Main buttons are at least 44px high; card bookmarks and header utilities are 36–40px. Hover is gated by pointer capability. Disabled actions are dimmed while a wallet request is pending.
- **Search/filter toolbar**, `src/App.tsx`: labeled native search input and selects. Search supports title, number, and note; empty results explain how to recover. Counts are announced through a stable polite status region.
- **`Modal`**, `src/Modal.tsx`: native `dialog.showModal()` with a named title, close button, backdrop dismissal, Escape, explicit Tab/Shift+Tab wrapping, and trigger focus restoration. The browser makes background content inert. Height is bounded with internal scrolling and overscroll containment.
- **`WalletSheet`**, `src/WalletSheet.tsx`: discovered extension names/icons, generic-browser fallback, Coinbase, and mobile app links. Shows per-row pending state and recoverable inline errors; connected state exposes the full address, network switch, and disconnect.
- **`StampPanel`**, `src/StampPanel.tsx`: disconnected, wrong-chain, pending, rejected, verification-error, and success states. Signatures are verified before success. Success includes the full address and a receipt download.
- **Collection/notification states**, `src/App.tsx`, `src/storage.ts`: saved and address-specific stamp collections; useful empty states; corrupt storage recovery; explicit warning when storage is unavailable. Local-only persistence is stated in the interface.

Interaction transitions are 150ms with `cubic-bezier(.2, 0, 0, 1)`. Press feedback uses scale 0.96. They exist only inside `prefers-reduced-motion: no-preference`; reduced motion has no transforms or transitions. There is no autoplay, entrance sequence, or endless motion. Focus outlines use two pixels with four-pixel offset and preserve system Highlight in forced-colors mode.

## Do’s and don’ts

Use the existing shell, type tokens, and shared card pattern for another collection view. Use native controls and descriptive names; preserve full addresses and clear exhibition/local-storage disclosures. Keep a single colored primary action on each active surface and use secondary styles for its peers.

Keep artwork colors within the artwork component. Do not use them as new semantic statuses. Do not add shadows to outlined cards, introduce additional font sizes, or claim a local collection is a shared or onchain registry. New settlement content should extend `src/data.ts`; a future real feed needs an explicit, documented data integration.

## Guidance attribution

Design guidance is adapted from Jakub Krehel’s Better Interface, MIT, commit `267330e1adfc66a718fb65fa6918c1f06d0a689e`. Documentation method is adapted from Paul Bakaus’s Impeccable, Apache-2.0, commit `9d715cc4f5564a990ca8345abfdd5df6dc9b41c8`. This document records the implemented Wheel Archive design, modified for this assignment. Both retained licenses are in `DESIGN-LICENSES.txt`.
