# Scroll-Restoration Extension Comparison Matrix

> **Review Date:** 2026-11-26  
> **Methodology:** NativeScroll (`v0.1.0`) was directly measured in Playwright Chromium `159.0.0.0` against our local deterministic fixture suite (`fixtures/`). Third-party extensions (*Normal Scroll — Disable Scroll-Jacking*, *Stop Smooth Scrolling*, and *I'm an Adult*) are evaluated from their publicly documented store listings and open-source repositories without installing unverified third-party binaries locally. Where live fixture execution was not run for a third-party extension, cells are explicitly marked `Not directly measured`.

## Products Reviewed

| Extension | Version / Context | Public Reference | Primary Mechanism (Documented) |
|---|---|---|---|
| **NativeScroll** | `v0.1.0` (measured `2026-11-26`) | `github.com/harysuryanto/chrome-native-scroll` | Reversible CSS `scroll-behavior: auto`, MAIN-world JS API shims, verified library adapters (`Lenis`, `GSAP ScrollSmoother`, `Locomotive v5`), opt-in Strict wheel guard, on-demand per-site diagnostics |
| **Normal Scroll — Disable Scroll-Jacking** | Public CWS listing (reviewed `2026-11-26`) | Chrome Web Store (`Normal Scroll — Disable Scroll-Jacking`) | Multi-layer CSS `scroll-behavior` reset, JS scroll API shimming, and wheel event handler neutralization |
| **Stop Smooth Scrolling** | Public CWS / GitHub (reviewed `2026-11-26`, author Gea-Suan Lin) | `github.com/gslin/stop-smooth-scrolling` | Lightweight script blocking website-forced smooth scrolling for users who disable Chrome's native smooth-scroll flag |
| **I'm an Adult** | Not found under active CWS listing on `2026-11-26` | N/A (legacy/unlisted) | Previously known for aggressive wheel-hijack prevention; no current public store version available for verification |

## Reproducible Scenario Matrix

| Scenario (Local Fixture) | NativeScroll `v0.1.0` (Measured) | Normal Scroll (Documented) | Stop Smooth Scrolling (Documented) | I'm an Adult |
|---|---|---|---|---|
| CSS `scroll-behavior: smooth` (`fixtures/css-smooth.html`) | **Verified** (`699.6 ms` → `16.9 ms` completion; reversible) | Supported (not directly measured) | Supported (not directly measured) | Unavailable |
| Explicit JS smooth APIs (`fixtures/js-smooth-api.html`) | **Verified** (`566.7 ms` → `17.2 ms`; non-mutating options) | Supported (not directly measured) | Partial / script-focused (not directly measured) | Unavailable |
| Closure-scoped Lenis `1.3.29` (`fixtures/lenis.html`) | **Verified** (`Compatibility` mode via `data-lenis-prevent-wheel`) | Not documented per-library | Not documented per-library | Unavailable |
| GSAP ScrollSmoother `3.15.1` (`fixtures/gsap-scrollsmoother.html`) | **Verified** (`smooth(0)`, preserves unrelated tweens) | Not documented per-library | Not documented per-library | Unavailable |
| Locomotive Scroll `5.1.1` / `4.x` (`fixtures/locomotive-scroll.html`) | **Verified** (v5 supported; v4 safely degrades to `unsupported`) | Not documented per-library | Not documented per-library | Unavailable |
| Interactive widgets: maps, editors, `Ctrl+wheel`, nested, horizontal (`fixtures/interactive-regressions.html`) | **Verified** across `Native`, `Compatibility`, and `Strict` modes | Tradeoffs depend on global wheel blocking (not directly measured) | Low risk (minimal intervention) | Unavailable |
| Per-site diagnostics & transparency | **Verified** (`successfully_neutralized` / `unsupported` / `not_detected` / `failed`) | Not documented | Minimal / none | Unavailable |
| Permissions & zero-telemetry audit | **Verified** (`storage`, `activeTab` only; 0 network requests) | Not audited locally | Open source; minimal permissions | Unavailable |

## Findings & Prioritization

1. **Verifiable differentiation:** NativeScroll's clearest measurable differentiators are (a) **honest, evidence-backed per-site diagnostics**, (b) **tiered operating modes** (`Native` default preserves interactive widgets; `Compatibility` adds reversible library adapters; `Strict` is opt-in with warnings), and (c) **automated real-Chromium E2E + benchmark/CDP verification**.
2. **Validated gaps for future backlog:**
   - Add automated Playwright coverage for Shadow DOM `scroll-behavior: smooth` containers if user feedback surfaces real-world sites using Shadow DOM smooth scrolling.
   - Evaluate optional per-site diagnostics export (local JSON copy) for user bug reports without storing browsing history.
