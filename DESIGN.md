# Wheel Archive design system

## Overview

Wheel Archive is a reading room for Squeekchain settlements. A wheel seal carries the visual identity; the sidebar, featured record and repeated capsule layout retain the v1 composition. The follow-up requests a dark palette, implemented here over the supplied light v1. DM Sans, DM Mono, the chartreuse action and circular brand mark remain.

Source values in `src/styles.css` are canonical for the archive. `public/overlay.css` implements the same roles for a dependency-free OBS page. The revised production export was inspected in Chromium at mobile and desktop sizes with live API data, isolated fixtures and a simulated outage retaining live records. No fixture is included in the runtime. The revision preserves the existing visual tokens, typography, components and responsive behavior.

## Colors

The interface is deliberately dark only. Hex primitives map to semantic roles; component styles use the semantic tokens.

| Semantic token | Value | Role |
| --- | --- | --- |
| `--color-bg` | `#111714` | Page, dialog |
| `--color-sidebar`, `--color-surface` | `#171f1b` | Rail and artwork surface |
| `--color-hover` | `#202a24` | Hover and selected range |
| `--color-border` | `#35433a` | Structural dividers, outlines |
| `--color-text` | `#edf0e7` | Primary text |
| `--color-muted` | `#a6afa5` | Supporting copy and metadata |
| `--color-accent` | `#d5ec92` | Primary action and brand detail |
| `--color-accent-hover` | `#c7e575` | Primary hover |
| `--color-accent-ink` | `#202a24` | Primary button label |
| `--color-success` | `#79c8bb` | Running state, success, forming ring |
| `--color-error` | `#f5b29d` | Unavailable feed and recoverable errors |
| `--color-focus` | `#d5ec92` | Keyboard outline |

The final populated-state probe measured a minimum resolved UI text contrast of 7.45:1 across its mobile and desktop text samples; its ordinary and large-text checks passed. This describes the sampled rendered opaque pairs, not arbitrary video behind the transparent overlay. The optional overlay panel uses `#111714f2`; the document and body always stay transparent.

Seal hue is data-driven `hsl(24 + byte[2] % 26, 79%, 68%)`; the counter-arc is `#79c8bb`, construction marks `#858c87`. This artwork palette represents the transaction fingerprint rather than interactive controls. Every seal has an accessible name naming its round. Running, asleep and unknown have text cues as well as a dot/color.

## Typography

`--font-body` is `'DM Sans Variable', 'DM Sans', sans-serif`; `--font-data` is `'DM Mono', monospace`. Weights are 400 and 600; mono uses its supplied 400 face. Main fonts are bundled through the existing Fontsource dependencies. The overlay uses a local copy at `public/fonts/dm-sans-latin.woff2`. Font notices remain in `public/licenses/`.

| Token | Size | Use |
| --- | --- | --- |
| `--text-caption` | 12px | Supporting metadata, labels, range buttons |
| `--text-small` | 14px | Interface prose, buttons, primary data |
| `--text-body` | 16px | Detail voice, stamp explanation, phone form input |
| `--text-section` | 20px | Section and card headings |
| `--text-title` | 28px | Featured desktop round, empty feature |
| `--text-display` | 48px; 36px at ≤720px | Main heading |

Each viewport uses at most six authored scale steps. Body line-height is 1.5; headings 1.2; the display heading 1.1. Display tracking is −.055em; section/card headings −.025em; featured desktop heading −.04em. Prose uses the sans face and pretty wrapping; headings balance. Identifiers, changing values and facts use tabular numbers. Long addresses and transaction hashes wrap anywhere, with no ellipsis or hidden text. Root smoothing is applied once. Chromium confirmed the intended web font loaded.

## Layout

The spacing tokens retain 4, 8, 12, 16, 20, 24, 32, 40 and 48px steps. A 224px desktop sidebar accompanies a content region with 48px gutters and 1360px maximum width. The header is at least 78px high. The live forming row precedes the featured capsule; the collection follows with its range controls immediately above its summary and records. The featured desktop split is 1 : 1.15; the collection has three columns with 24px gaps.

| Width | Behavior |
| --- | --- |
| ≤1190px | 194px rail, 32px content gutters, two collection columns and 16px gaps |
| 721–960px | Rail collapses to 80px icon navigation; explicit accessible names remain |
| ≤720px | Rail becomes a compact top row; 20px content gutters; heading 36px; forming ring 76px; Stamp dialog is a bottom sheet |
| ≤510px | Featured art stacks above facts and actions, with a 160px art area; collection is one column; primary feature action expands |
| ≤350px | 16px page gutters; forming ring 64px; range buttons become narrower |

At 390 × 844, Open capsule and Stamp occupy y≈751–795 in the inspected populated state. The pitch, ring, seal and record are visible above them. Reflow checks passed at 320, 390, 600, 800, 1024 and 1440px. Text enlargement through native zoom, translation and RTL rendering were not verified; direction-dependent layout uses logical properties.

The OBS widget defaults to 440px wide and content height. Query parameters can set outer width/height; width never exceeds its viewport, and a constrained height scrolls rather than clipping the record. Its capsule uses a 116px seal beside the text, reducing to 80px at ≤350px. `capsule=0` removes that section and its request.

## Elevation & depth

The interface is flat, using tonal surfaces and one-pixel structural borders without box shadows. Capsule art surfaces contain SVG linework rather than nested cards. Native dialogs occupy the top layer with a dark `#050b08cc` backdrop and 3px backdrop blur. Their maximum height is bounded by the viewport and internal overflow is scrollable. No decorative gradients or glows compete with the seals.

## Shapes

Controls use `--radius-control: 6px`, art and featured surfaces `--radius-surface: 10px`; native dialogs 12px. Phone stamp sheets use 16px upper corners. Circular geometry is reserved for the brand, seal and progress ring. Artwork borders do not clip any text. Controls have a minimum 44px primary action height; range and inline transaction utilities are smaller but exceed the tested 24px spacing/target baseline.

## Components

| Component / source | Reuse and behavior |
| --- | --- |
| `WheelMark`, `Icon` / `src/Icons.tsx` | Existing circular logo and consistent currentColor outline icons; decorative icons are hidden from assistive technology |
| `WheelArt` / `src/WheelArt.tsx` | Receives a validated capsule and inserts only the shared deterministic SVG; no IDs or per-render variation |
| `sealSVG`, `capsuleLine` / `public/archive-core.js` | Shared transaction fingerprint and factual register selection; used unchanged by the overlay |
| `ProgressRing` / `src/ProgressRing.tsx` | Receives `status` and `stale`; changes fill from measured progress and text from coreStatus; shared `forming()` maps RUNNING to Running and IDLE / asleep to Asleep, case-insensitively; unknown labels never masquerade as zero |
| Featured record / `src/App.tsx` | Seal, voice, facts, primary Open capsule, secondary Stamp, settlement link |
| `CapsuleCard`, `CapsuleFacts` / `src/App.tsx` | Same field order in feature, collection and detail: round, work, completed blocks; block and transaction remain available |
| Range switch / `src/App.tsx` | Three native buttons with `aria-pressed`; refetch and display the response summary; retain and name the last range on failure |
| `Modal` / `src/Modal.tsx` | Native dialog, explicit accessible heading, Escape and backdrop dismissal, Tab / Shift+Tab containment, trigger focus restoration |
| `StampPanel`, `WalletSheet` | Loaded only after Stamp; explanation precedes wallet prompt, EIP-6963 names and icons, phone links and Coinbase option; disconnected, switching, pending, rejected and submitted states |
| Feed / `src/feed.ts` | Last-good snapshots only in memory, independently unavailable endpoints, bounded requests and canceled stale selections |
| `public/overlay.html`, `.js`, `.css` | Independent native-module page, no wallet runtime, shared seal/progress arithmetic, transparent document and optional dark panel |

Buttons use `.button.primary` for one leading action per surface, `.button.secondary` for its peer, `.text-button` for utilities and `.icon-button` for named compact actions. Filled chartreuse is reserved for the main action. Hover is limited to hover-capable pointers. Disabled controls retain their labels. Keyboard indicators are 2px solid with 4px offset and use system Highlight under forced colors.

Interactive transitions last 150ms with `cubic-bezier(.2,0,0,1)` and press scale .96. They exist only under `prefers-reduced-motion: no-preference`. The ring’s fill transitions when data changes; no object spins continuously and there is no entrance animation. Polite status regions announce feed, summary, copy and wallet outcomes. Clipboard denial provides a selectable full link. No notification containing an error disappears on a timer.

## Do’s and don’ts

Start a new archive surface from the existing shell, spacing tokens and facts pattern. Use data prose in the sans face and identifiers in the mono face. Keep the range control beside the content it changes, with one filled action on the active surface. Reuse the shared core for another display of the same seal.

Keep unknown data explicit, full transaction identifiers readable, and the testnet named before stamping. Do not add persistent collections, invented settlements, image-based seals, wallet reconnect on page load, root-relative assets or additional type scales. Do not treat the arbitrary OBS background as a measured contrast pair; use the panel when footage needs it.

## Guidance attribution

Design guidance is adapted from Jakub Krehel’s Better Interface (MIT), commit `267330e1adfc66a718fb65fa6918c1f06d0a689e`. Documentation method is adapted from Paul Bakaus’s Impeccable (Apache-2.0), commit `9d715cc4f5564a990ca8345abfdd5df6dc9b41c8`. This document was revised for the implemented v2. Both retained licenses are in `DESIGN-LICENSES.txt`. Review findings and unverified coverage belong in `VALIDATION.md`.
