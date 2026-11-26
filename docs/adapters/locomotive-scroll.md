# Locomotive Scroll Adapter

## Version Support Matrix

| Version | Architecture | NativeScroll Support | Reversibility |
|---|---|---|---|
| **v5.x** (verified on `5.1.1`) | Native scrolling + Lenis wheel smoothing | **Supported** (`Compatibility` / `Strict`) via `data-lenis-prevent-wheel` | Fully reversible without reload |
| **v4.x** (legacy) | Virtual CSS `transform: matrix3d(...)` on `[data-scroll-container]` with `html.has-scroll-smooth` | **Unsupported (safe degradation)** | Leaves transforms untouched so page never freezes |

## Why Legacy v4 Degrades Safely

In Locomotive Scroll v4, the document body is locked (`overflow: hidden`) and scrolling is simulated via CSS transforms. Stopping wheel events without destroying the private v4 instance would freeze the page completely. When NativeScroll detects `html.has-scroll-smooth` + `[data-scroll-container]`, it reports `unsupported` in diagnostics and leaves the page untouched.
