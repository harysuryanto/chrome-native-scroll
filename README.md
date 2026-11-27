<div align="center">

<img src="public/icons/icon-128.png" alt="NativeScroll icon" width="84" height="84" />

# NativeScroll

**Back to native scrolling.**

A lightweight Chrome Manifest V3 extension that strips out artificial website smooth-scrolling physics and restores crisp, browser-native scrolling.

[![Beta Release](https://img.shields.io/github/v/release/harysuryanto/chrome-native-scroll?include_prereleases&label=beta&color=1a73e8)](https://github.com/harysuryanto/chrome-native-scroll/releases)
[![Verify NativeScroll](https://github.com/harysuryanto/chrome-native-scroll/actions/workflows/verify.yml/badge.svg)](https://github.com/harysuryanto/chrome-native-scroll/actions/workflows/verify.yml)
![Chrome Manifest V3](https://img.shields.io/badge/Chrome-Manifest%20V3-34a853)
[![License: MIT](https://img.shields.io/github/license/harysuryanto/chrome-native-scroll)](LICENSE)

</div>

---

## Why NativeScroll?

Many modern websites hijack your mouse wheel or trackpad with JavaScript smooth-scrolling libraries and artificial inertia. Instead of feeling smooth, it often introduces lag, floaty deceleration, and broken scroll expectations.

**NativeScroll** neutralizes those overrides and hands scrolling back to your browser.

- **Least-risk `Auto` mode by default:** Starts with minimal CSS/API normalization and only escalates when a smooth-scroll library or wheel hijacker is detected.
- **Verified library adapters:** Cleanly neutralizes `Lenis 1.x`, `GSAP ScrollSmoother 3.x`, and `Locomotive Scroll 5.x`.
- **Per-site controls & live updates:** Toggle NativeScroll on/off or switch modes per site with immediate effect on open tabs.
- **Detection badge & diagnostics:** See at a glance when custom scroll physics are detected and inspect real runtime status in the popup.
- **Native Chrome UI:** Built with Chromium WebUI tokens and Material Design 3 guidelines (supports light and dark themes automatically).
- **Private by design:** Zero telemetry, zero external network requests, zero UI frameworks.

> **What NativeScroll is NOT:** It is not a scroll-speed accelerator, does not inject custom inertia/easing, and does not claim universal mouse-wheel vs. trackpad hardware detection.

## Screenshots

| Toolbar Popup | Site Diagnostics | Settings & Exclusions |
|:---:|:---:|:---:|
| <img src="docs/screenshots/popup-active-light.png" alt="NativeScroll Popup" width="260"/> | <img src="docs/screenshots/popup-strict-diag-light.png" alt="NativeScroll Site Diagnostics" width="260"/> | <img src="docs/screenshots/options-light.png" alt="NativeScroll Settings" width="280"/> |

## Install (Beta)

Works on **Google Chrome** and Chromium-based Manifest V3 browsers (Brave, Edge, Arc, Vivaldi, Opera).

### From GitHub Releases (Recommended)

1. Download the latest `nativescroll-v*.zip` from [GitHub Releases](https://github.com/harysuryanto/chrome-native-scroll/releases).
2. Unzip it to a permanent folder on your computer.
3. Open `chrome://extensions` and enable **Developer mode** (top right).
4. Click **Load unpacked** and select the extracted folder.

> **Note:** Unpacked beta installs do not auto-update. To update to a newer beta, replace the folder contents with the new release ZIP and click the reload icon on the extension card in `chrome://extensions`.

### From Source

1. Run `bun run build` (outputs to `dist/`).
2. Open `chrome://extensions`, enable **Developer mode**, click **Load unpacked**, and select `dist/`.

For bleeding-edge `main` builds, you can also download `nativescroll-chrome-extension` artifacts from [GitHub Actions](https://github.com/harysuryanto/chrome-native-scroll/actions/workflows/verify.yml).

## Operating Modes

| Mode | Behavior | Best For |
|---|---|---|
| **Auto (Default)** | Least-risk adaptive mode: starts at `Native`, escalates to `Compatibility` if a supported library is detected, or `Strict` if custom wheel hijacking is detected | Everyday browsing; minimal intervention on standard sites with automatic escalation when needed |
| **Native** | CSS `scroll-behavior: auto !important` + explicit smooth JS scroll API (`window.scrollTo/scrollBy`, `Element.scrollTo/scrollBy/scrollIntoView`) normalization only | Sites where you want minimal override and guaranteed preservation of nested scroll, maps, carousels, and editors |
| **Compatibility** | `Native` + verified library adapters (`Lenis 1.x`, `GSAP ScrollSmoother 3.x`, `Locomotive Scroll 5.x`) | Sites powered by third-party smooth-scroll engines |
| **Strict (Experimental)** | `Compatibility` + conservative root non-passive wheel listener guard (preserves `Ctrl+wheel` zoom, horizontal deltas, nested scrollables, canvas/maps/editors) | Aggressive custom wheel hijackers; can be disabled immediately per site |

## Beta Feedback & Troubleshooting

NativeScroll is currently in **beta**. If a site still feels sluggish or scrolling breaks, your reports directly improve compatibility:

- **[Report a Site Compatibility Issue](https://github.com/harysuryanto/chrome-native-scroll/issues/new?template=site-compatibility.yml)** — Include the URL, active mode, and the status shown under **Site diagnostics** in the popup.
- **[Report a Bug](https://github.com/harysuryanto/chrome-native-scroll/issues/new?template=bug-report.yml)** — For popup, settings, or general extension issues.

**Quick troubleshooting:**
- **Exclude a site:** Click the toolbar icon and toggle **Enable on this site** off, or manage exact-host exclusions in **Settings**.
- **Already-open tabs:** Mode and exclusion changes apply live. Only reload tabs that were already open before NativeScroll was installed.
- **Known limitations:** Browser internal pages (`chrome://`, `about:`, Chrome Web Store) cannot be modified by extensions; legacy Locomotive Scroll v4 transform containers degrade safely to `unsupported`.

## Privacy & Permissions

NativeScroll requests only two minimal permissions:

- **`storage`** — Saves your preferences and site exclusions locally in `chrome.storage.local`.
- **`activeTab`** — Reads the active tab URL only when you open the popup.

Zero telemetry, zero analytics, zero external network requests. See the full [Security & Privacy Audit](docs/security/audit.md).

## Development

Prerequisites: [Bun](https://bun.sh/docs/installation) and Google Chrome (or Chromium).

```sh
bun install
bun run typecheck
bun run lint
bun run test
bun run build
bun run test:e2e
```

Additional scripts:

```sh
bun run package       # Build & verify reproducible release ZIP in release/
bun run fixtures      # Serve local deterministic fixtures at http://127.0.0.1:4173/
bun run benchmark     # Run reproducible Chromium scroll-latency benchmarks
bun run profile       # Run CDP memory, CPU, startup & multi-tab profiler
```

## Documentation

- [Changelog](CHANGELOG.md)
- [Architecture Guide](docs/architecture.md)
- [Compatibility Matrix](docs/compatibility-matrix.md)
- [Wheel-Event Latency Research](docs/research/wheel-event-latency.md)
- [Benchmark Methodology & Results](docs/benchmarks/methodology.md)
- [Memory & CPU Performance Profile](docs/benchmarks/performance-profile.md)
- [Security & Privacy Audit](docs/security/audit.md)
- [Manual Hardware QA Checklist](docs/testing/manual-hardware-checklist.md)

## License

[MIT](LICENSE)
