# Wheel Archive

A capsule per settlement, and a stamp you can leave on your own address. Built with React, TypeScript, and Vite, with an included static export in `dist/`.

The site is a complete **exhibition collection** of six illustrative settlements. No production settlement feed, contract, or backend was supplied. The interface labels sample content throughout. Wallet-signed stamps are real, verified message signatures saved in the current browser; they are not minted tokens or onchain writes.

## Install and run

Use Node.js 22.12 or newer and npm.

```sh
npm ci
npm run dev
```

Open the local URL Vite prints. No account, environment file, project ID, or private credential is required.

## Rebuild and preview

```sh
npm run typecheck
npm run build
npm run preview
```

The completed `dist/index.html`, fonts, wallet marks, artwork logic, and share image are included. Serve `dist/` with any static HTTP server. Vite uses `base: './'`; URLs are relative and navigation uses hashes, so a gateway subpath does not require server rewrites. Preserve the whole export when publishing it. Production hosting is outside this deliverable.

To regenerate the share image after changing its source:

```sh
npx playwright install chromium
node scripts/share-card.mjs
npm run build
```

## Use the archive

- Search by title, settlement number, or description; filter by month and sort by date or name.
- Open a capsule to read its record. Capsule URLs such as `#/capsule/184` can be linked directly.
- Bookmark capsules to save them in this browser. Saved capsules remain available without a wallet.
- Connect a wallet, open a capsule, and choose **Sign and leave a stamp**. The site verifies the signature before saving it against the signing address.
- Download a JSON stamp receipt inside a stamped capsule, or export the connected address’s collection from **My stamps**.

## Wallets and storage

Browser wallets are discovered by EIP-6963 using wagmi. The same connect sheet supports Coinbase Wallet/Smart Wallet and phone links for MetaMask, Coinbase Wallet, Rabby, and Phantom. Phone links open the page in the wallet’s own browser; they need an installed wallet app and a reachable hosted page. There is no WalletConnect relay or project ID.

Base is the signing context, configured in `src/wallet.ts`. The app requests a network switch when necessary. It never sends a transaction, requests a token allowance, or charges gas. EOA signatures are verified locally with viem. Contract-wallet signatures use Base’s public RPC for EIP-1271/EIP-6492 verification if local verification cannot succeed. That path requires network access.

Bookmarks use `wheel-archive:saved:v1`; receipts use `wheel-archive:stamps:v1`. Browser storage is not a public registry and is not synchronized across devices or visitors. Clearing site data removes the collection. Export receipts before clearing data. If storage is unavailable, the site explains that changes last only for the current page session. Full signing addresses remain available in capsule details and receipts.

## Validation

```sh
npx playwright install chromium
npm run build
npm run validate
```

`scripts/validate.mjs` starts and closes its own local server, serves the production export under `/preview/`, and runs actual Chromium interactions. It generates a new ephemeral signer only in memory to test wallet signatures; no test key or account is part of the application. Optional WebKit coverage runs when that browser can launch.

Final worker results: production build and TypeScript check passed; **13 interaction groups passed, 0 failed**. The pinned taste@1 probe passed **16/16 checks** after fixes. Automated axe checks found no violations for the selected WCAG A/AA tags on the archive, capsule dialog, and collapsed tablet navigation. The 390 × 844 first screen shows the product and primary action. Reflow was checked at 320, 390, 600, 800, 1024, and 1440 CSS pixels.

WebKit could not launch in the validation runtime. Physical wallets, phone app handoff, Coinbase passkey creation, contract-wallet verification against a real account, screen readers, and native browser zoom remain unverified. These results are worker checks, not independent certification. See [the full validation record](artifacts/validation.md), [machine-readable interactions](artifacts/interaction-results.json), and [design probe results](artifacts/taste-results.json).

Dependencies and browser downloads were installed in temporary locations outside the submitted project. The source and lockfile reproduce the build with normal `npm ci`; dependencies and package caches are not included in the submission. `test/scratch/` contains disposable validation output and is not needed to build or run the site.

## Source and design

`src/data.ts` contains exhibition content; `src/WheelArt.tsx` generates the original wheel studies. `src/App.tsx` owns archive navigation and collections. `src/WalletSheet.tsx`, `src/StampPanel.tsx`, and `src/storage.ts` implement connection, signing, and receipts. The final tokens, components, and responsive behavior are documented in [DESIGN.md](DESIGN.md).

Wallet integration follows the pinned connector reference and the current [wagmi configuration](https://wagmi.sh/react/api/createConfig), [connection](https://wagmi.sh/react/api/hooks/useConnection), and [Coinbase connector](https://wagmi.sh/react/api/connectors/coinbaseWallet) APIs. Rabby’s URL uses the `open-dapp` handler in its [official mobile source](https://github.com/RabbyHub/rabby-mobile/blob/develop/apps/mobile/src/hooks/universalLink.ts); native app handoff was not tested.

DM Sans and DM Mono are bundled through Fontsource under the SIL Open Font License; notices are in `public/licenses/`. Wallet artwork is copied from RainbowKit 2.2.11 under MIT, with its license in `public/wallets/`. The wheel artwork is original procedural SVG. Design and documentation guidance credits and retained licenses are in `DESIGN-LICENSES.txt` and `DESIGN.md`.
