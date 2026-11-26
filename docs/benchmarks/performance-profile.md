# Memory, CPU, Startup & Multi-Tab Performance Profile

## Reproducible Run Command

```sh
bun run build
bun run profile
```

`scripts/profile.mjs` uses Playwright + Chrome DevTools Protocol (`Performance.getMetrics`) to compare **baseline (no extension)**, **NativeScroll enabled**, and **NativeScroll disabled** across 1 tab, 5 simultaneous tabs, and tab cleanup. Raw output is stored in `docs/benchmarks/profile-results.json`.

## Measured Results (2026-11-26)

- **Environment:** macOS (`darwin 25.6.0`), Apple M4 (10 cores), Playwright Chromium `159`

| Metric | Baseline (No Extension) | NativeScroll Enabled | NativeScroll Disabled | Hypothesis Evaluation |
|---|---:|---:|---:|---|
| Cold page load (`css-smooth.html`) | `19.43 ms` | `41.29 ms` | `15.25 ms` | Includes first-load storage/MV3 init (~22 ms cold); warm tabs are sub-5 ms |
| Idle main-thread `TaskDuration` (1000 ms window) | `7.55 ms` | `4.49 ms` | `2.50 ms` | Near-zero idle CPU; no RAF loops, polling timers, or MutationObservers |
| Primary tab `JSHeapUsedSize` (1 tab) | `1.18 MB` | `1.67 MB` | `1.57 MB` | `+0.49 MB` delta (well below `<20 MB` target) |
| Primary tab `JSHeapUsedSize` (5 open tabs) | `1.18 MB` | `1.67 MB` | `1.57 MB` | `0.00 MB` growth; bounded multi-tab footprint |
| Primary tab `JSHeapUsedSize` (after closing 4 tabs) | `1.18 MB` | `1.67 MB` | `1.57 MB` | Clean teardown; no unbounded retention |
| CSS override `<style>` present | `false` | `true` | `false` | Disabled mode performs zero active interception |
