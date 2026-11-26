/* global Bun */
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { cpus, platform, release, tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { chromium } from '@playwright/test';

const DIST_DIR = resolve(process.cwd(), 'dist');
const PORT = 4180;
const BASE_URL = `http://127.0.0.1:${PORT}`;

const server = Bun.spawn(['bun', 'scripts/serve-fixtures.mjs'], {
  env: { ...process.env, FIXTURES_PORT: String(PORT) },
  stdout: 'ignore',
  stderr: 'ignore',
});

async function waitForServer() {
  for (let i = 0; i < 30; i += 1) {
    try {
      const res = await fetch(`${BASE_URL}/`);
      if (res.ok) return;
    } catch {
      // retry
    }
    await Bun.sleep(100);
  }
  throw new Error('Fixture server failed to start');
}

async function getMetricsMap(cdp) {
  const { metrics } = await cdp.send('Performance.getMetrics');
  return Object.fromEntries(metrics.map((m) => [m.name, m.value]));
}

async function profileMode(mode) {
  const userDataDir = mkdtempSync(join(tmpdir(), 'nativescroll-prof-'));
  const args =
    mode === 'baseline'
      ? []
      : [`--disable-extensions-except=${DIST_DIR}`, `--load-extension=${DIST_DIR}`];
  const context = await chromium.launchPersistentContext(userDataDir, {
    channel: 'chromium',
    headless: true,
    args,
  });

  try {
    if (mode === 'disabled') {
      let [sw] = context.serviceWorkers();
      if (!sw) sw = await context.waitForEvent('serviceworker', { timeout: 10_000 });
      const extId = new URL(sw.url()).host;
      const opt = await context.newPage();
      await opt.goto(`chrome-extension://${extId}/options/index.html`);
      await opt.locator('#enabled').uncheck();
      await opt.close();
    }

    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send('Performance.enable');

    const navStart = performance.now();
    await page.goto(`${BASE_URL}/css-smooth.html`, { waitUntil: 'load' });
    const loadMs = Number((performance.now() - navStart).toFixed(2));

    const beforeIdle = await getMetricsMap(cdp);
    await page.waitForTimeout(1000);
    const afterIdle = await getMetricsMap(cdp);
    const idleTaskDurationMs = Number(
      (((afterIdle.TaskDuration ?? 0) - (beforeIdle.TaskDuration ?? 0)) * 1000).toFixed(2),
    );
    const singleTabHeapMb = Number(((afterIdle.JSHeapUsedSize ?? 0) / 1024 / 1024).toFixed(2));

    // Open 4 additional tabs (5 total) to verify multi-tab memory stays bounded.
    const extraPages = [];
    for (let i = 0; i < 4; i += 1) {
      const p = await context.newPage();
      await p.goto(`${BASE_URL}/native-scroll.html`, { waitUntil: 'load' });
      extraPages.push(p);
    }
    const fiveTabMetrics = await getMetricsMap(cdp);
    const fiveTabPrimaryHeapMb = Number(
      ((fiveTabMetrics.JSHeapUsedSize ?? 0) / 1024 / 1024).toFixed(2),
    );

    for (const p of extraPages) await p.close();
    const afterCloseMetrics = await getMetricsMap(cdp);
    const afterCloseHeapMb = Number(
      ((afterCloseMetrics.JSHeapUsedSize ?? 0) / 1024 / 1024).toFixed(2),
    );

    const styleInjected = await page.evaluate(
      () => document.getElementById('nativescroll-css-override') !== null,
    );

    return {
      loadMs,
      idleTaskDurationMs,
      singleTabHeapMb,
      fiveTabPrimaryHeapMb,
      afterCloseHeapMb,
      styleInjected,
    };
  } finally {
    await context.close();
    rmSync(userDataDir, { recursive: true, force: true });
  }
}

try {
  await waitForServer();
  const baseline = await profileMode('baseline');
  const enabled = await profileMode('enabled');
  const disabled = await profileMode('disabled');

  const report = {
    timestamp: new Date().toISOString(),
    environment: {
      os: `${platform()} ${release()}`,
      cpu: cpus()[0]?.model ?? 'unknown',
      cores: cpus().length,
    },
    baseline,
    enabled,
    disabled,
  };

  mkdirSync(resolve(process.cwd(), 'docs/benchmarks'), { recursive: true });
  writeFileSync(
    resolve(process.cwd(), 'docs/benchmarks/profile-results.json'),
    JSON.stringify(report, null, 2) + '\n',
  );
  console.log(JSON.stringify(report, null, 2));
} finally {
  server.kill();
}
