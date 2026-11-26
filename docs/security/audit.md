# NativeScroll Security & Privacy Audit

## 1. Manifest V3 Permissions Justification

| Permission | Why It Is Required | Scope |
|---|---|---|
| `storage` | Persist user preferences (`enabled`, `defaultMode`, `excludedHosts`, `siteModes`, feature flags) locally in `chrome.storage.local` | Local device only; never synced or transmitted |
| `activeTab` | Read the active tab's URL in the popup when the user clicks the toolbar icon to display hostname and per-site controls | Invoked only on explicit user click |

- **No `host_permissions`**, **no `tabs`**, **no `cookies`**, **no `webNavigation`**, **no `externally_connectable`**.
- Content scripts declare `<all_urls>` solely to neutralize website scrolling behavior on pages the user visits.

## 2. World Isolation & Trust Boundary

- **MAIN world (`src/main-world/index.ts`):** Runs in the page's JavaScript context with **zero** access to `chrome.*` APIs. Receives one-way declarative configuration snapshots from the ISOLATED world.
- **ISOLATED world (`src/content/content-script.ts`):** Validates `sender.id === chrome.runtime.id` and strict message schemas (`isExtensionRequest`) on `chrome.runtime.onMessage`. Never accepts settings mutations or privileged commands from page `CustomEvent`s or `window.postMessage`.
- **Untrusted diagnostics defense:** MAIN-world diagnostic snapshots are validated and length-clamped by `sanitizeMainWorldDiagnostics()` and rendered in the popup strictly via `textContent` (zero `innerHTML`).

## 3. CSP, Dependencies & Zero Telemetry

- Strict Manifest V3 CSP: zero `eval`, zero `new Function`, zero inline scripts, zero remote executable code.
- Zero runtime dependencies bundled into `dist/` (all UI and scripts are vanilla TypeScript/HTML/CSS).
- Verified by `tests/security-static.test.ts` and `tests/e2e/security.spec.ts`: **0** outgoing network requests, **0** analytics/telemetry, **0** browsing-history persistence.

## 4. Protected Pages & Reversible Patches

- `chrome://`, `chrome-extension://`, `edge://`, `about:`, `file://`, and Chrome Web Store pages are classified as unsupported in `src/shared/url.ts`.
- CSS overrides, JS scroll API shims, Lenis, GSAP ScrollSmoother, and Locomotive Scroll v5 adapters are cleanly reversible on disable or host exclusion.

## 5. Privacy Disclosure (Matches Implementation)

> NativeScroll does not collect, transmit, sell, or share any personal data, browsing history, or telemetry. All settings (global toggle, operating mode, and user-chosen excluded hostnames) are stored locally in your browser via `chrome.storage.local` and never leave your device.
