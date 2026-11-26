# Scroll-Latency Benchmark Methodology & Measured Results

## Reproducible Run Command

```sh
bun run build
bun run benchmark
```

`scripts/benchmark.mjs` launches an offline local fixture server and two matched Playwright Chromium persistent contexts (baseline without NativeScroll vs NativeScroll enabled), recording raw JSON to `docs/benchmarks/latest-results.json`.

## Metrics (Kept Strictly Distinct)

1. **Input-to-first-visible-scroll (`inputToFirstScrollMs`):** Elapsed time from scroll trigger until the first `requestAnimationFrame` observing a `scrollY` delta > 1 px.
2. **Animation completion time (`animationCompletionMs`):** Elapsed time from scroll trigger until `scrollY` settles for 6 consecutive frames.
3. **Wheel-handler main-thread overhead (`wheelOverhead.p50Ms` / `p95Ms`):** Micro-timed `performance.now()` delta across 50 synthetic `WheelEvent` dispatches on `window`.

## Measured Results (2026-11-26)

- **OS:** macOS (`darwin 25.6.0`)
- **Hardware:** Apple M4 (10 cores, 16 GB RAM)
- **Browser:** Chromium `159.0.0.0` (Playwright headless Chromium)

| Scenario | Metric | Baseline (No Extension) | NativeScroll Enabled |
|---|---|---:|---:|
| `css-smooth.html` (anchor jump) | Input-to-first-scroll | `17.90 ms` | `16.90 ms` |
| `css-smooth.html` (anchor jump) | Animation completion | `699.60 ms` | `16.90 ms` |
| `js-smooth-api.html` (`window.scrollTo` smooth) | Input-to-first-scroll | `16.90 ms` | `17.20 ms` |
| `js-smooth-api.html` (`window.scrollTo` smooth) | Animation completion | `566.70 ms` | `17.20 ms` |
| Synthetic `WheelEvent` main-thread overhead | p50 / p95 | `0.00 ms` / `0.00 ms` | `0.00 ms` / `0.00 ms` |

## Playwright Timing Limitations & Physical Mouse-Wheel Procedure

- `performance.now()` in Chromium is coarsened (100 µs) for Spectre mitigation, so sub-0.1 ms handlers round to `0.00 ms`.
- Headless Chromium `requestAnimationFrame` cadence (~16.6 ms / 60 Hz) sets the floor for single-frame completion (~17 ms).
- Synthetic `WheelEvent`s do not include USB/Bluetooth HID polling latency or OS trackpad momentum. To measure physical mouse-wheel latency, load `dist/` in headed Chrome, open `chrome://tracing` (or DevTools Performance with "Screenshots" enabled), perform 5 discrete physical wheel notches on `fixtures/css-smooth.html` and `fixtures/lenis.html`, and compare `EventLatency.MouseWheel` with NativeScroll off vs on.
