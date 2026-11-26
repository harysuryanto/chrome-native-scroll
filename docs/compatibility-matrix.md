# NativeScroll Compatibility Matrix

Every claim below maps directly to automated Vitest or Playwright Chromium tests in this repository.

| Capability / Target | Mode | Status | Reversible Without Reload | Verified By |
|---|---|---|---|---|
| CSS `scroll-behavior: smooth` (root, body, nested) | `Native`+ | Supported | Yes | `tests/css-override.test.ts`, `tests/e2e/mvp.spec.ts` |
| `window.scrollTo/scroll/scrollBy` (`behavior: 'smooth'`) | `Native`+ | Supported | Yes | `tests/scroll-api-patch.test.ts`, `tests/e2e/mvp.spec.ts` |
| `Element.scrollTo/scroll/scrollBy/scrollIntoView` | `Native`+ | Supported | Yes | `tests/scroll-api-patch.test.ts`, `tests/e2e/mvp.spec.ts` |
| Native, nested vertical & horizontal scrolling | All | Preserved | N/A | `tests/e2e/mvp.spec.ts`, `tests/e2e/compatibility-regressions.spec.ts` |
| `Ctrl+wheel` zoom, keyboard scroll, `<canvas>` maps, `<textarea>` editors, carousels | `Native`, `Compatibility`, `Strict` | Preserved | N/A | `tests/e2e/compatibility-regressions.spec.ts` |
| **Lenis `1.x`** (verified on `1.3.29`, closure-scoped) | `Compatibility`+ | Supported | Yes | `tests/e2e/lenis.spec.ts` |
| **GSAP ScrollSmoother `3.x`** (verified on `3.15.1`) | `Compatibility`+ | Supported (when reachable via `ScrollSmoother.get()`) | Yes | `tests/e2e/gsap-scrollsmoother.spec.ts` |
| **Locomotive Scroll `5.x`** (verified on `5.1.1`) | `Compatibility`+ | Supported | Yes | `tests/e2e/locomotive-scroll.spec.ts` |
| **Locomotive Scroll `4.x`** (transform virtual scroll) | `Compatibility`+ | Unsupported (safe degradation) | N/A | `src/main-world/adapters/locomotive-scroll.ts` |
| Root non-passive wheel hijackers | `Strict` | Experimental guard | Yes | `tests/wheel-optimizer.test.ts`, `tests/e2e/compatibility-regressions.spec.ts` |
| `chrome://`, `about:`, Chrome Web Store, `file://` | All | Unsupported (honest UI) | N/A | `tests/url.test.ts`, `tests/e2e/mvp.spec.ts` |
