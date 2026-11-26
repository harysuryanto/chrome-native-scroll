/* global Bun */
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { cpus, platform, release, totalmem, tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { chromium } from '@playwright/test';

const DIST_DIR = resolve(process.cwd(), 'dist');
const PORT = 4179;
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

async function measureScrollTo(page, triggerFn) {
  return page.evaluate(async (fnSrc) => {
    window.scrollTo(0, 0);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const startY = window.scrollY;
    const t0 = performance.now();
    let firstMoveMs = null;
    let lastMoveMs = 0;
    let lastY = startY;
    let stableFrames = 0;

    const fn = new Function(fnSrc);
    fn();

    return new Promise((resolvePromise) => {
      const check = () => {
        const now = performance.now();
        const y = window.scrollY;
        if (firstMoveMs === null && Math.abs(y - startY) > 1) {
          firstMoveMs = now - t0;
        }
        if (Math.abs(y - lastY) > 0.5) {
          lastY = y;
          lastMoveMs = now - t0;
          stableFrames = 0;
        } else {
          stableFrames += 1;
        }
        if (stableFrames >= 6 || now - t0 > 2000) {
          resolvePromise({
            inputToFirstScrollMs: Number((firstMoveMs ?? 0).toFixed(2)),
            animationCompletionMs: Number(lastMoveMs.toFixed(2)),
            finalScrollY: Math.round(y),
          });
          return;
        }
        requestAnimationFrame(check);
      };
      requestAnimationFrame(check);
    });
  }, triggerFn);
}

async function measureWheelOverhead(page) {
  return page.evaluate(() => {
    const samples = [];
    for (let i = 0; i < 50; i += 1) {
      const t0 = performance.now();
      window.dispatchEvent(new WheelEvent('wheel', { deltaY: 100, cancelable: true }));
      samples.push(performance.now() - t0);
    }
    samples.sort((a, b) => a - b);
    return {
      p50Ms: Number((samples[Math.floor(samples.length * 0.5)] ?? 0).toFixed(4)),
      p95Ms: Number((samples[Math.floor(samples.length * 0.95)] ?? 0).toFixed(4)),
    };
  });
}

async function runSuite(withExtension) {
  const userDataDir = mkdtempSync(join(tmpdir(), 'nativescroll-bench-'));
  const args = withExtension
    ? [`--disable-extensions-except=${DIST_DIR}`, `--load-extension=${DIST_DIR}`]
    : [];
  const context = await chromium.launchPersistentContext(userDataDir, {
    channel: 'chromium',
    headless: true,
    args,
  });

  try {
    let chromeVersion = 'unknown';
    const page = await context.newPage();
    chromeVersion = await page.evaluate(() => navigator.userAgent);

    if (withExtension) {
      let [sw] = context.serviceWorkers();
      if (!sw) sw = await context.waitForEvent('serviceworker', { timeout: 10_000 });
      const extId = new URL(sw.url()).host;
      const opt = await context.newPage();
      await opt.goto(`chrome-extension://${extId}/options/index.html`);
      await opt.selectOption('#default-mode', 'compatibility');
      await opt.close();
    }

    await page.goto(`${BASE_URL}/css-smooth.html`, { waitUntil: 'load' });
    await page.waitForTimeout(100);
    const cssSmooth = await measureScrollTo(
      page,
      `document.getElementById('jump-target').click();`,
    );

    await page.goto(`${BASE_URL}/js-smooth-api.html`, { waitUntil: 'load' });
    await page.waitForTimeout(100);
    const jsSmoothApi = await measureScrollTo(
      page,
      `window.scrollTo({ top: 1200, behavior: 'smooth' });`,
    );
    const wheelOverhead = await measureWheelOverhead(page);

    return { chromeVersion, cssSmooth, jsSmoothApi, wheelOverhead };
  } finally {
    await context.close();
    rmSync(userDataDir, { recursive: true, force: true });
  }
}

try {
  await waitForServer();
  const baseline = await runSuite(false);
  const enabled = await runSuite(true);

  const report = {
    timestamp: new Date().toISOString(),
    environment: {
      os: `${platform()} ${release()}`,
      cpu: cpus()[0]?.model ?? 'unknown',
      cores: cpus().length,
      ramGb: Number((totalmem() / 1024 ** 3).toFixed(1)),
      chromeUserAgent: enabled.chromeVersion,
    },
    baseline: {
      cssSmooth: baseline.cssSmooth,
      jsSmoothApi: baseline.jsSmoothApi,
      wheelOverhead: baseline.wheelOverhead,
    },
    nativeScrollEnabled: {
      cssSmooth: enabled.cssSmooth,
      jsSmoothApi: enabled.jsSmoothApi,
      wheelOverhead: enabled.wheelOverhead,
    },
  };

  mkdirSync(resolve(process.cwd(), 'docs/benchmarks'), { recursive: true });
  writeFileSync(
    resolve(process.cwd(), 'docs/benchmarks/latest-results.json'),
    JSON.stringify(report, null, 2) + '\n',
  );
  console.log(JSON.stringify(report, null, 2));
} finally {
  server.kill();
}
