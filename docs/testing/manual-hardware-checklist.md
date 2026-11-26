# Manual Hardware & Trackpad QA Checklist

Automated Playwright tests use synthetic `WheelEvent` / Chromium input injection, which accurately verifies DOM event routing, `preventDefault()` preservation, and API semantics—but **cannot** reproduce physical mouse-wheel detents, OS scroll acceleration, or macOS/Windows trackpad inertia curves.

## Before Release — Manual Hardware Checks

1. **Physical stepped mouse wheel (macOS / Windows / Linux):**
   - Scroll on `fixtures/css-smooth.html` and `fixtures/lenis.html` with NativeScroll **off** vs **on**.
   - Verify immediate first-frame response without artificial easing tail.
2. **Trackpad two-finger scroll & momentum inertia (macOS Trackpad / Windows Precision Touchpad):**
   - Verify native OS momentum feels identical to Chrome with NativeScroll disabled on `fixtures/native-scroll.html`.
   - Verify horizontal two-finger swipe on `fixtures/horizontal-scroll.html`.
   - Verify pinch-to-zoom (`Ctrl+wheel`) still zooms cleanly.
3. **Interactive web apps (real sites in `Native`, `Compatibility`, and `Strict` modes):**
   - Google Maps / OpenStreetMap: wheel zooms map, does not scroll outer page.
   - Code editor (GitHub / Monaco / CodeMirror): editor scrolls smoothly inside its pane.
   - Nested sidebars & modals: inner pane scrolls without locking outer document.
