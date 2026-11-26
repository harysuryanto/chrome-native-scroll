# GSAP ScrollSmoother Adapter

- **Supported versions:** GSAP `3.x` (verified against pinned `gsap@3.15.1`, Standard 'no charge' license)
- **Mode:** `Compatibility` and `Strict`
- **Reversibility:** Fully reversible without page reload

## How It Works

NativeScroll looks up the active `ScrollSmoother` instance via the verified public API `ScrollSmoother.get()` (or `gsap.core.globals().ScrollSmoother.get()`). When active, it records the original `smoother.smooth()` duration and calls `smoother.smooth(0)`, which disables smoothing lag while preserving `ScrollTrigger` and all unrelated GSAP animations.

On disable or host exclusion, NativeScroll calls `smoother.smooth(savedSmooth)` to restore the original smoothing duration.

## Known Limitations

- If a site bundles `ScrollSmoother` privately inside a closure without exposing `ScrollSmoother` or `gsap.core.globals().ScrollSmoother`, NativeScroll accurately reports `unsupported` rather than mutating internal DOM transforms.
