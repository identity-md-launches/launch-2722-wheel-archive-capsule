# Wheel Archive v2 validation

Reviewed 2026-10-30 against the final source and static export. These are worker observations, not independent certification.

## Scope and assumptions

The revision keeps the name, pitch, v1 layout, typography and chartreuse action. The provided v1 used light surfaces; the follow-up’s explicit dark direction wins. Removed exhibition records, bookmarks, local receipts and page-load wallet initialization. The archive, capsule dialog, stamp flow and OBS overlay were reviewed. No contract was deployed or transaction broadcast.

All archive reads use the specified API. HTTP 403 Cloudflare challenge pages were returned by `/status`, `/economy/state`, and settlement requests for 24h, 7d and 30d. Chromium also received HTTP 403. No live payload, live schema or count of ten live capsules could be verified. Settlement row aliases are documented in README as integration assumptions; fixtures do not establish that the real service uses them. No fixture or snapshot is packaged as live data. The canonical text is also included in root `VALIDATION.md`, since this checkout excludes `artifacts/` from Git; evidence files remain in the platform’s artifact location.

Publication belongs to the platform after submission. `dist/` is ready for the requested `wheel-archive-v2` label; no new URL was assigned in this run. The supplied pinned v1 was not published over.

## Acceptance coverage

| Requirement | Result and evidence |
| --- | --- |
| Live API wiring and at least ten live capsules | Wiring implemented; live content/count **unverified**, all specified endpoints returned 403. Isolated fixtures render 12 / 14 / 16 complete capsules for the three ranges |
| Deterministic inline SVG | Same markup after reload and in a second independent Chromium context; exact formula, hue and arc tested; shared runtime contains no random, canvas or image operations |
| Factual rest / trot / sprint line | Core boundary tests at 0, 1, 399, 400; line closes with exact round and block; no emoji |
| Forming ring and wheel state | 25% to 87.5% and Running to Asleep tested from API fields; unknown values and retained snapshot tested |
| Refetch range and summary | Recorded network requests for all three ranges, differing server summary values, retained old range on failure and stale-response cancellation tested |
| Stamp | Mocked named EIP-6963 provider received `eth_sendTransaction`; `from === to`, value zero, UTF-8-decoded calldata exactly `wheel-archive:1000`, chain `0xaa36a7`; rejected and submitted states tested; full returned hash shown |
| No wallet, no transaction | No provider requests/discovery before Stamp; absent provider has no send control; no storage writes even after opening and failing to connect |
| Deep links and copy | Direct 30-day deep link, normal open, clipboard success, denied clipboard fallback, Escape, Tab wrap and focus return tested |
| OBS | Transparent html/body, 480 × 420 outer dimensions, panel, newest seal/line, `capsule=0`, fast test interval, live progress/state changes and failure retention tested |
| API failure | `status: unavailable` keeps all prior capsules, seal, summary and percentage; state becomes Unknown and one-line warning identifies unreachable API; initial outage invents no records |
| No console errors | Zero script/console errors during normal Chromium fixture interactions; no missing local resources in either design probe. Real 403 requests remain an external network failure |
| Responsive product and action | No page overflow at 320, 390, 600, 800, 1024 and 1440px; Open capsule and Stamp fully visible at 390 × 844 |
| Static export and metadata | `dist/index.html`, real `dist/overlay.html`, all runtime assets, title, description, favicon, og:title, og:image present; local resources served successfully at `/preview/` |
| Protected configuration / dependencies | No existing build/dependency files changed; no node_modules, caches, archives or submodules added; contribution below 8 MiB |

## Commands and actual outcomes

| Executed command | Outcome |
| --- | --- |
| `npm ci --prefix /tmp/wheel-archive-build --cache /tmp/wheel-archive-npm-cache --ignore-scripts --no-audit --no-fund` after copying the existing manifest/lockfile | Passed; production uses locked dependencies without modifying repository dependencies |
| `npm run typecheck --prefix /tmp/wheel-archive-build` | Passed (`tsc --noEmit`); source was mirrored into this temporary build directory |
| `npm run build --prefix /tmp/wheel-archive-build` | Passed after final runtime source changes; Vite 7.3.7 built 1,841 modules; finished export copied back, not rebuilt by the publisher |
| `node --test scripts/core.test.mjs` | 7 passed, 0 failed |
| `node --check public/archive-core.js` and `node --check public/overlay.js` | Both passed |
| `node scripts/share-card.mjs` with external Chromium tooling | Passed; generated local 1200 × 630 PNG and SVG share cards; no settlement fixture used for this brand card |
| `node scripts/validate.mjs` with external Playwright/axe modules and `WHEEL_SKIP_WEBKIT=1` | 15 interaction groups passed, 0 failed, 1 explicitly skipped WebKit group |
| `node .imd/reads/skills/design-critic/scripts/taste.mjs --out test/scratch/taste` with external Chromium tooling | 16/16 passed against the final export’s actual unavailable-feed state |
| Same pinned probe with `--out test/scratch/taste-fixtures` and a scratch-only fetch fixture adapter | 16/16 passed against the populated final export; supplemental rendering evidence only |
| `node scripts/check-export.mjs` | Passed; checks required assets, relative URLs, export cleanliness, protected paths, no submodules and 8 MiB contribution budget |
| `curl` for all five supplied endpoint/range combinations; Chromium navigation to `/v1/status` | HTTP 403, HTML challenge rather than JSON |
| Bounded WebKit page probe after downloading WebKit and local shared libraries | Could not create a page in 12 seconds; exited 2; no WebKit interaction or rendered observation is claimed |

The supplied browser connector could not launch its configured Chrome. Normal Chrome / Headless Shell downloads also returned a regional 403. A compatible Chromium 140 / Playwright 1.55.1 was installed in temporary directories, with libraries and fonts outside the repository. Initial interaction assertions failed because that stripped runtime had no usable font configuration: even a plain `Hello world` div had zero height and empty innerText. After providing temporary fonts and font configuration, the same interactions passed. No application checks were weakened to hide a source failure. WebKit’s preflight could not locate locally supplied optional libraries; a separate bounded attempt with the local library wrapper passed startup but could not create a page. This remains a limitation.

The existing production dependency and build files were unchanged. Temporary browser packages, fonts, shared libraries, package caches and probe adapters are not in the submission. The optional test environment variables only locate those external tools; the production site has none.

## Better Interface review: six domains

| Domain | Coverage and evidence | Remaining limits |
| --- | --- | --- |
| Accessibility | Native links/buttons, stable status regions, named SVGs/dialogs; explicit names after nav collapse; Tab/Shift+Tab wrap, Escape and trigger focus return; axe WCAG A/AA scan of phone archive and capsule found no violations | No screen-reader session, physical assistive device or actual signing accessibility test |
| Layout | Viewed mobile and full desktop screenshots; measured reflow at six widths; first-screen main action at y≈751–795 at 390px; range controls precede summary/content; full hashes wrap | No native 200% browser zoom, RTL or translated-content review |
| Writing | Required pitch retained; voice derives only from work band and actual round/block; API errors say unknown/last snapshot; transaction explanation appears before wallet prompts; success says submitted rather than confirmed | Actual API summary keys/schema not observed; unknown enum values remain Unknown |
| Typography | Two local families and weights, six-step authored scale, tabular numbers, prose measure, normal casing and natural tracking; web font loaded in Chromium; probe passed size/face/tracking checks | WebKit typography and physical-device rendering not observed |
| Colors | Dark semantic tokens reviewed in source and actual screenshots; both probes passed contrast; populated probe’s minimum measured UI text ratio 7.45:1; state has text as well as color | Arbitrary footage behind a panel-free overlay is not a fixed contrast pair; prefer `panel=1` |
| UI | Flat surfaces, coherent icons, primary/secondary actions, hover/focus/pressed/disabled states; loading, empty, unavailable, disconnected, declined and submitted paths tested; reduced-motion probe passed, no continuous animation | Phone app links and Coinbase passkeys were rendered but not activated with real accounts; no native animation-panel slow playback session |

## Findings and corrections

| Source reference | Observed issue and impact | Correction and recheck |
| --- | --- | --- |
| `src/App.tsx:40` | Icon rail hides visible text at tablet/phone widths, which would remove link names | Added stable `aria-label` values; mobile axe scan and keyboard interaction pass |
| `src/ProgressRing.tsx:6` | A retained Running snapshot could leave a green dot while current state was Unknown after failure | Stale state now uses the neutral unknown class while retaining measured percentage; a first-load failure does not claim a prior snapshot. Initial-outage and retained-snapshot interactions pass |
| `src/App.tsx:11` | A direct link could name a round absent from the initial 24-hour window | Direct links start with 30d; an in-session missing round broadens the range once; older fixture link opens correctly |
| `src/feed.ts:19` | Replacing failed measurements with defaults would imply a false zero; overlapping ranges could show stale results | Independent last-good snapshots, explicit unavailable flags and abort guards; outage, recovery and response-race checks pass |
| `src/wallet.ts:7`, `src/StampPanel.tsx:12` | v1 stored wallet state/reconnected and used Base; that conflicts with this task | Sepolia-only configuration, `storage: null`, `reconnectOnMount: false` and lazy entry; no requests before Stamp and no storage writes verified |
| `public/overlay.js:44` | A refresh finishing during page exit could schedule another update | `stopped` guard prevents rescheduling after pagehide; overlay interactions and source review cover the change |
| `src/App.tsx:31` | Clipboard denial could otherwise leave the share action without a usable result | Full read-only selectable URL fallback; denied clipboard interaction passes |
| `scripts/share-card.mjs:5` | v1 share image claimed an exhibition settlement and used the prior light treatment | Regenerated a dark brand-only wheel card with the required pitch; viewed asset and share probe pass |

No unresolved source finding from these checks blocks the reviewed fixture flows. The live data, WebKit, physical wallet and publication limitations above remain explicit; they are not counted as passed criteria.

## Evidence files

- [Interaction results](artifacts/interaction-results.json): fixture-only checks, including the skipped WebKit group.
- [Real-feed design probe](artifacts/taste-results.json): unavailable-feed state, 16/16.
- [Populated design probe](artifacts/taste-fixture-results.json): isolated fixtures, 16/16.
- [Mobile fixture screenshot](artifacts/mobile-fixture-390.png): product, ring, seal, Open capsule and Stamp on the first screen.
- [Desktop fixture screenshot](artifacts/desktop-fixture-1440.png): feature and collection layout.
- [Overlay fixture screenshot](artifacts/overlay-fixture.png): optional panel, ring, state and newest capsule.
- [Stamp fixture screenshot](artifacts/stamp-fixture.png): returned mocked hash; not a real broadcast.
- [Release handoff](artifacts/release.json): requested v2 label and pending platform URL.

No screenshot here represents verified live settlement data. All populated evidence uses fixtures injected only by the validation harness.
