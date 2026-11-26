# NativeScroll Architecture Guide

## Entry Points & World Boundaries

NativeScroll is a vanilla TypeScript Manifest V3 extension with zero UI frameworks and zero runtime dependencies.

- **`src/background/service-worker.ts` (Event-driven SW):** Initializes and migrates versioned settings in `chrome.storage.local` on `chrome.runtime.onInstalled`. No timers or persistent loops.
- **`src/content/content-script.ts` (ISOLATED world, `document_start`):** Reads settings via `chrome.storage.local` and `chrome.storage.onChanged`, manages the reversible CSS override (`src/content/css-override.ts`), pushes one-way declarative config snapshots to the MAIN world, and answers read-only `chrome.runtime.onMessage` queries from the popup.
- **`src/main-world/index.ts` (MAIN world, `document_start`):** Runs in the page JS context with **zero** extension API privileges. Manages browser scroll API shims (`scroll-api-patch.ts`), the conservative root wheel observer/guard (`wheel-optimizer.ts`), and modular scrolling-library adapters (`adapters/registry.ts`).
- **`src/popup/` & `src/options/`:** Vanilla HTML/CSS/TypeScript UIs synchronized via `chrome.storage.onChanged`.

## Multi-Stage Classic-IIFE Build (`scripts/build.mjs`)

1. Vite builds `src/popup/index.html`, `src/options/index.html`, shared CSS, and copies `public/` (including `manifest.json`) into `dist/`.
2. Vite independently bundles `background`, `content`, and `main-world` as **classic IIFEs** (`dist/scripts/*.js`) so MV3 manifest-declared content scripts never rely on ES module imports or shared chunks.

## Trust Boundary

- ISOLATED → MAIN: One-way declarative `MainWorldConfig` via `CustomEvent` (`native-scroll:config`).
- MAIN → ISOLATED: On-demand `MainWorldDiagnostics` via `CustomEvent` (`native-scroll:diagnostics-report`), treated as untrusted page data, strictly validated/clamped by `sanitizeMainWorldDiagnostics()`, and rendered exclusively via `textContent`.
- Page scripts can never mutate `chrome.storage.local` or invoke privileged extension APIs.
