# Lenis Adapter

- **Supported versions:** Lenis `1.x` (verified against pinned `lenis@1.3.29`)
- **Mode:** `Compatibility` and `Strict`
- **Reversibility:** Fully reversible without page reload

## How It Works

Modern web apps typically bundle Lenis inside ES modules without exposing a global `window.lenis` instance. Rather than assuming a global variable, NativeScroll detects Lenis via its official root DOM classes (`html.lenis`, `html.lenis-smooth`) and applies Lenis's documented `data-lenis-prevent-wheel` opt-out attribute on `document.documentElement`.

When `data-lenis-prevent-wheel` is present, Lenis's `VirtualScroll` handler skips `preventDefault()` on wheel events and allows Chrome to perform native wheel scrolling immediately. Disabling NativeScroll or excluding the site removes the attribute (only if NativeScroll added it).

## Known Limitations

- Custom Lenis configurations that override `prevent` to ignore `data-lenis-prevent-wheel` cannot be neutralized via this attribute.
- Programmatic `lenis.scrollTo(...)` calls invoked by site scripts are not intercepted unless they delegate to native `window.scrollTo`.
