# NativeScroll

**Back to native scrolling.**

NativeScroll is a lightweight Chrome extension intended to neutralize artificial smooth-scroll physics imposed by websites and restore browser-native scrolling.

> **Status:** Foundation only (Issue #1). This scaffold does **not** change how websites scroll yet. CSS overrides, JavaScript API interception, and controls will be implemented in [subsequent issues](https://github.com/harysuryanto/chrome-native-scroll/issues).

## Tech stack

- Chrome Manifest V3
- Vanilla TypeScript, HTML and CSS (no UI framework)
- Vite 8 for HTML/assets and independent classic-script IIFE bundles
- Bun for package management and scripts
- ESLint, Prettier and strict TypeScript

## Prerequisites

- [Bun](https://bun.sh/docs/installation)
- Google Chrome or another Chromium browser supporting Manifest V3

## Install and build

```sh
bun install
bun run typecheck
bun run lint
bun run build
```

The output is written to `dist/`. The build packages popup and options HTML and independently bundles the background, isolated content script and MAIN-world script as **classic IIFEs**. This avoids ES module imports in manifest-declared content scripts.

## Download a remotely built extension

You do not need Bun, Node.js or a local build environment to install a CI build.

1. Open the [NativeScroll GitHub Actions runs](https://github.com/harysuryanto/chrome-native-scroll/actions/workflows/verify.yml).
2. Open a successful run for your desired commit or pull request.
3. Under **Artifacts**, download `nativescroll-chrome-extension` (GitHub sign-in may be required).
4. Extract the downloaded ZIP to a new folder. The extracted folder should contain `manifest.json` at its root.
5. Open `chrome://extensions`, enable **Developer mode**, click **Load unpacked**, and select that extracted folder.

Artifacts are retained for **14 days**. GitHub Actions uses a hosted Ubuntu runner; no build command runs on your Mac.

## Load in Chrome

1. Run `bun run build`.
2. Visit `chrome://extensions` in Chrome.
3. Enable **Developer mode**.
4. Select **Load unpacked** and choose the repository's `dist/` directory.
5. Open the NativeScroll popup and click **Open settings** to verify both UI entry points.
6. In the extension's service-worker console, verify the installation message. Website scrolling remains unchanged at this stage.

## Development

```sh
bun run dev           # Vite UI-only dev server; does not reload extension content scripts
bun run build         # Rebuild extension into dist/
bun run typecheck
bun run lint
bun run format:check
```

After rebuilding, click **Reload** on the extension in `chrome://extensions` to refresh injected scripts. The Vite dev server is only for popup/options iteration; use the built extension to test Manifest V3 contexts.

## Architecture

```text
public/manifest.json                  Manifest V3 source
src/popup/                            Popup HTML and TypeScript
src/options/                          Settings HTML and TypeScript
src/ui/                               Shared plain CSS
src/content/content-script.ts         Isolated-world content entry
src/main-world/index.ts               MAIN-world page entry (no privileged APIs)
src/background/service-worker.ts      Event-driven background entry
scripts/build.mjs                     Multi-stage Vite production builder
```

Both content entry points are currently minimal. The MAIN-world entry only supports a public diagnostic ping event and has no access to privileged extension APIs. The isolated entry supports a lightweight ping response to verify injection.

## Security and performance

- No React, UI framework, runtime framework, remote scripts or telemetry.
- No extra browser permissions or host permissions; manifest content scripts are declared for `<all_urls>` because the eventual scrolling behavior is page-specific.
- Scripts are loaded at `document_start` in their explicit worlds.
- No animation loops, timers, DOM scanning or periodic background work.
- No scroll modifications are applied until follow-up issues implement them.

## Roadmap

See the [NativeScroll issue tracker](https://github.com/harysuryanto/chrome-native-scroll/issues). This PR addresses [Issue #1](https://github.com/harysuryanto/chrome-native-scroll/issues/1) only.
