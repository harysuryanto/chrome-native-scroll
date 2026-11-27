# Changelog

All notable changes to NativeScroll will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0-beta.1] - 2026-11-27

First public GitHub beta pre-release of NativeScroll (Chrome Manifest V3).

### Added
- **Auto (Least-Risk) default operating mode:** Automatically starts in `Native` mode, escalates to `Compatibility` when a supported smooth-scroll library is detected, or escalates to `Strict` if custom wheel hijacking is detected.
- **Explicit operating modes:** `Native`, `Compatibility` (`Lenis 1.x`, `GSAP ScrollSmoother 3.x`, `Locomotive Scroll 5.x`), and `Strict (Experimental)` root non-passive wheel listener guard.
- **Chrome Material Design 3 UI:** Redesigned toolbar popup with selectable mode radio cards, live per-site enable/exclude toggle, custom-scroll detection toolbar badge, expandable site diagnostics, and full light/dark theme support.
- **Settings & Exclusions page:** Manage global default mode and exact-host exclusions with live application to open tabs.
- **Privacy-first permissions:** Uses only `storage` and `activeTab`, with zero telemetry and zero external network requests.

### Known Limitations
- Browser internal pages (`chrome://`, `about:`, Chrome Web Store) cannot be modified by extensions.
- Legacy Locomotive Scroll v4 transform containers degrade safely to `unsupported`.
- Unpacked GitHub beta installs do not auto-update; replace the extracted folder and reload the extension in `chrome://extensions` when upgrading.
