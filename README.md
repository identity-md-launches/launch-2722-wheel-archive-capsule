# Wheel Archive

Every settled batch of Squeekchain rounds becomes a sealed capsule.

This v2 replaces v1’s exhibition records and saved collections with the Squeekchain API, deterministic SVG seals, a live forming ring, capsule links, zero-value Sepolia stamps and a transparent OBS overlay. It retains the sidebar, featured record, collection layout, DM Sans / DM Mono typography and chartreuse actions. The supplied v1 was light; this revision implements the dark palette requested in the follow-up.

**Revision verified against the live API (2026-10-30):** all five endpoint/range combinations returned JSON successfully. Chromium rendered ten live capsules in each range and the newest capsule in OBS. Settlement rounds now use `settledThroughRound`, and `IDLE` maps to Asleep. A simulated outage retained the real last-good snapshot. Nine live interaction groups and fifteen isolated fixture groups passed. See [validation](VALIDATION.md).

## Install, preview and rebuild

The included `dist/` runs on static hosting without Node, a build step, keys or a backend. Serve the whole directory over HTTP(S); opening `index.html` with `file://` cannot reliably load ES modules or the API.

For source development, use Node 22.12+ and the existing manifest and lockfile:

```sh
npm ci
npm run dev
```

To reproduce the production export and preview it:

```sh
npm run typecheck
npm run build
npm run preview
```

Vite’s existing `base: './'` is unchanged. Assets are relative, links use fragments and `overlay.html` is a real exported file, so a gateway subpath needs no server rewrites. No configuration or dependency files were changed. The worker installed the locked dependencies in a temporary build copy outside the repository, ran the existing scripts there and copied its finished `dist/` back unchanged.

## Browse and share

- **24h / 7d / 30d** sends a new settlement request and displays the selected response’s summary. A failed range change keeps the previous range’s records and labels that retained range.
- **Refresh** retries the three feed requests. Automatic refresh starts 15 seconds after the previous refresh completes; individual requests time out after 12 seconds. An older in-flight response cannot overwrite a newer selection.
- **Open capsule** opens the round’s record at `#capsule-<round>`. A direct link loads the 30-day range. Rounds older than the API’s supported range cannot be retrieved by these endpoints.
- **Copy link** copies the full URL. When clipboard permission is unavailable, a selectable full link appears.
- There are no bookmarks, likes, leaderboards, saved receipts, cookies, service workers or application storage. Reloading discards in-memory snapshots and transaction results.

## Data and seals

Archive data comes only from `https://api.squeekchain.com/v1`:

| GET | Consumed fields |
| --- | --- |
| `/status` | `status.measurement.{coreStatus,rpmMilli,cumulativeWorkUnits}`, `status.builder.anchor.{blockHeight,blockProgress,workPerThousandBlocks,settledThroughRound}` |
| `/economy/state` | `economy.supply.totalMintedBaseUnits`, divided exactly by `1e18` |
| `/settlements?range=24h\|7d\|30d` | `settlements.recentSettlements[]`, `settlements.summary` |

The parser also accepts the endpoint object directly without its named envelope. Live settlement records provide `settledThroughRound`, `blockHeight`, `workAdded`, `completedBlockCount`, and a 32-byte `transactionHash`. Numeric strings are accepted. The legacy `round`/`roundId`, `blockNumber` and `txHash` aliases remain supported, with `settledThroughRound` taking precedence. Invalid or unavailable responses retain the previous response; missing scalar measurements display Unknown. No number is synthesized from unavailable data. Summary text is derived from returned scalar fields, never computed from the displayed subset.

`public/archive-core.js` is shared by the archive and overlay. FNV-1a-32 hashes the lowercase UTF-8 hash text, starting at `0x811c9dc5` with prime `0x01000193`. Expansion feeds counter bytes 0–7 through the same state and emits each resulting word little-endian, producing 32 bytes. This convention is fixed and documented because the brief did not define the expansion convention. All arithmetic uses explicit 32-bit overflow. SVG coordinates are serialized to four decimals; there are no SVG IDs, image requests, libraries, canvas or random values in the seal.

Spokes follow `clamp(6, 48, 6 + round(log2(workAdded + 2) * 4))`. Length and opacity use hash bytes, hue is `24 + byte[2] % 26`, the outer arc is `min(1, completedBlockCount / 40)` and the counter-arc is teal. A hash byte selects one factual voice line from rest (0 work), trot (1–399), or sprint (400+), followed by the exact round and block. The ring uses `blockProgress / 1e9`; remaining work is `ceil((1 - progress) * workPerThousandBlocks / 1000)`. Only `coreStatus` determines the state: `RUNNING` displays Running, `IDLE` and the legacy `asleep` display Asleep, case-insensitively; an unrecognized value is Unknown.

## Stamp on Sepolia

Choose **Stamp** to load the wallet code and read the transaction explanation before a wallet prompt. Choose a named EIP-6963 extension, Coinbase Wallet / Smart Wallet, or a phone link into MetaMask, Coinbase Wallet, Rabby or Phantom. No connection or provider discovery runs on page load. Wagmi persistence and reconnect-on-mount are disabled.

Once connected on Sepolia (chain 11155111 / `0xaa36a7`), **Send zero-value stamp** asks the wallet to send:

```text
from = connected address
to = connected address
value = 0
input = UTF-8 hex of wheel-archive:<round>
```

The app uses no contract or token approval. Test ETH pays gas. The returned hash is displayed in full with a Sepolia Etherscan link; “submitted” does not mean confirmed. Nothing is sent without a connected wallet, and the wrong-chain action switches to Sepolia before sending is enabled. No real wallet was signed or transaction broadcast during worker validation. Physical app handoff, Coinbase passkeys and live transaction acceptance remain unverified.

## OBS browser source

Point an OBS browser source at the exported `overlay.html`, for example:

```text
overlay.html?panel=1&w=480&h=420&every=15
```

| Parameter | Behavior |
| --- | --- |
| `panel=1` | Gives only the widget a dark panel and border; defaults to no panel |
| `w` | Widget outer width in pixels, capped by the viewport; default 440 |
| `h` | Widget outer height in pixels; omitted means content height; short heights scroll |
| `capsule=0` | Hides the newest capsule and skips its settlement request |
| `every` | Delay between refreshes in seconds, default 15; bounded to 1–3600 |

Both `html` and `body` are explicitly transparent, including before the stylesheet loads. Use an OBS canvas at least as large as the chosen widget dimensions. `panel=1` helps maintain readability over footage; contrast over arbitrary footage without a panel is not guaranteed. The overlay uses no wallet code and shares the same seal and progress logic as the archive.

## Checks and actual results

```sh
node --test scripts/core.test.mjs
npm run typecheck
npm run build
npm run validate
node scripts/check-export.mjs
```

`validate.mjs` owns and closes a bounded static preview under `/preview/`. Fixtures are injected by Playwright routing and never enter the production export. It tests records, range requests, races, progress/state, unavailable snapshots, deep links, copying and clipboard denial, keyboard focus, reflow, overlay options, absent wallets and a mocked self-transaction. It writes disposable output under `test/scratch/`.

Revision results: **9 core tests passed; typecheck and production build passed; 15 fixture interaction groups and 9 live interaction groups passed; axe reported no tested WCAG A/AA violations on the archive and capsule dialog; taste@1 passed 16/16 on the populated live export.** The new regression tests failed before the fixes and passed afterward. Reflow was checked at 320, 390, 600, 800, 1024 and 1440px with fixtures and at 320, 390 and 1440px with live data. Open capsule and Stamp are visible on the first 390 × 844 screen. Identical live seal markup was checked after reload and in an independent browser context.

The revision used the provided Playwright/Chromium tooling and installed the unchanged locked build dependencies in a temporary directory. No browser was installed. WebKit's executable was unavailable, so its interaction group was explicitly skipped. Physical wallets, Coinbase passkeys and real broadcasts remain unverified. `WHEEL_PLAYWRIGHT`, `WHEEL_CHROMIUM` and `WHEEL_AXE` optionally point the test tools to externally installed modules/binaries; normal installations need none of them.

The pinned design probe was run on the final export with its prescribed output path. The canonical six-domain review is [VALIDATION.md](VALIDATION.md). Revision screenshots and machine-readable results were inspected under disposable `test/scratch/`; they are not submitted assets. These worker checks are not independent certification. Native browser zoom, screen readers, physical devices, WebKit rendering and real signing remain unverified.

To regenerate the share card after editing `scripts/share-card.mjs`:

```sh
node scripts/share-card.mjs
npm run build
```

## Release and attribution

The source, unchanged lockfile and full production export are included for the platform’s publication step. **Requested v2 label: `wheel-archive-v2`**, preserving the already pinned v1. No publication command was run; a new live URL is not available within this worker run. [Release handoff](artifacts/release.json) records this status.

See [DESIGN.md](DESIGN.md) for the implemented tokens, typography, components and responsive behavior. Fonts retain their SIL Open Font License notices in `public/licenses/`; wallet marks retain the RainbowKit MIT notice in `public/wallets/`. The brand and procedural SVG artwork are local. Better Interface and Impeccable design/documentation guidance and licenses are retained in `DESIGN-LICENSES.txt`.
