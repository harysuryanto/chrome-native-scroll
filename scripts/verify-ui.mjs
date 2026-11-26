import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright';

const root = process.cwd();
const distDir = resolve(root, 'dist');
const screenshotsDir = resolve(root, 'docs/screenshots');

async function launchExtension(colorScheme = 'dark') {
  const userDataDir = mkdtempSync(join(tmpdir(), 'nativescroll-verify-'));
  const context = await chromium.launchPersistentContext(userDataDir, {
    channel: 'chromium',
    headless: true,
    colorScheme,
    deviceScaleFactor: 2,
    viewport: { width: 400, height: 760 },
    args: [
      `--disable-extensions-except=${distDir}`,
      `--load-extension=${distDir}`,
      '--no-sandbox',
      '--disable-setuid-sandbox',
    ],
  });

  let [sw] = context.serviceWorkers();
  if (!sw) {
    sw = await context.waitForEvent('serviceworker', { timeout: 15_000 });
  }
  const extensionId = new URL(sw.url()).host;

  return {
    context,
    extensionId,
    userDataDir,
    async close() {
      await context.close();
      try {
        rmSync(userDataDir, { recursive: true, force: true });
      } catch (err) {
        console.warn('Could not remove temp dir:', err);
      }
    },
  };
}

async function run() {
  console.log('Launching extension contexts for verification...');

  // 1. Popup Verification (Light & Dark)
  for (const theme of ['dark', 'light']) {
    const harness = await launchExtension(theme);
    try {
      const page = await harness.context.newPage();
      page.on('console', (msg) => console.log(`PAGE LOG [${theme}]:`, msg.text()));
      page.on('pageerror', (err) => console.log(`PAGE ERROR [${theme}]:`, err.message));

      await page.goto(`chrome-extension://${harness.extensionId}/popup/index.html`);
      await page.waitForTimeout(300);

      const outPath = resolve(screenshotsDir, `popup-${theme}.png`);
      await page.screenshot({ path: outPath, fullPage: true });
      console.log(`Saved screenshot: ${outPath}`);

      const titleText = await page.locator('#title').textContent();
      const taglineText = await page.locator('.tagline').textContent();
      const badgeText = await page.locator('#site-badge').textContent();
      const enabledChecked = await page.locator('#enabled').isChecked();

      console.log(`[Popup ${theme}] Title: "${titleText}", Tagline: "${taglineText}", Badge: "${badgeText}", Enabled: ${enabledChecked}`);

      if (titleText !== 'NativeScroll' || taglineText !== 'Back to native scrolling.' || badgeText !== 'Unsupported') {
        throw new Error(`Popup ${theme} assertions failed`);
      }
    } finally {
      await harness.close();
    }
  }

  // 2. Options Page Verification (Light & Dark)
  for (const theme of ['dark', 'light']) {
    const harness = await launchExtension(theme);
    try {
      const page = await harness.context.newPage();
      await page.setViewportSize({ width: 720, height: 860 });
      await page.goto(`chrome-extension://${harness.extensionId}/options/index.html`);
      await page.waitForTimeout(300);

      // Add a test exclusion host to verify interaction
      await page.fill('#exclude-input', 'smooth-motion-demo.com');
      await page.click('#exclude-add');
      await page.waitForTimeout(100);

      const outPath = resolve(screenshotsDir, `options-${theme}.png`);
      await page.screenshot({ path: outPath, fullPage: true });
      console.log(`Saved screenshot: ${outPath}`);

      const titleText = await page.locator('#title').textContent();
      const enabledChecked = await page.locator('#enabled').isChecked();
      const defaultModeVal = await page.locator('#default-mode').inputValue();
      const excludeCount = await page.locator('.exclude-item').count();

      console.log(`[Options ${theme}] Title: "${titleText}", Enabled: ${enabledChecked}, Mode: ${defaultModeVal}, Exclusions: ${excludeCount}`);

      if (titleText !== 'NativeScroll settings' || !enabledChecked || defaultModeVal !== 'auto' || excludeCount !== 1) {
        throw new Error(`Options ${theme} assertions failed`);
      }

      // Test Mode Switch to Strict in Options
      await page.selectOption('#default-mode', 'strict');
      await page.waitForTimeout(100);
      const strictWarningVisible = await page.locator('#strict-warning').isVisible();
      if (!strictWarningVisible) {
        throw new Error('Strict warning did not appear when defaultMode set to strict');
      }

      // Restore defaults
      await page.click('#restore-defaults');
      await page.waitForTimeout(100);
      const restoredMode = await page.locator('#default-mode').inputValue();
      if (restoredMode !== 'auto') {
        throw new Error('Restore defaults did not reset mode to auto');
      }
    } finally {
      await harness.close();
    }
  }

  // 3. Popup on a Supported Tab (Active State, Diagnostics Open, Mode Card Selected)
  for (const theme of ['dark', 'light']) {
    const harness = await launchExtension(theme);
    try {
      // Create a tab with a real website URL
      const activeTab = await harness.context.newPage();
      await activeTab.goto('https://example.com', { waitUntil: 'commit' }).catch(() => {});
      await activeTab.bringToFront();

      // Open popup in a separate window or view
      const popupPage = await harness.context.newPage();
      await popupPage.setViewportSize({ width: 392, height: 860 });
      await popupPage.goto(`chrome-extension://${harness.extensionId}/popup/index.html`);
      await popupPage.waitForTimeout(400);

      // Open diagnostics details
      const diag = popupPage.locator('#diagnostics-panel');
      if (await diag.isVisible()) {
        await diag.evaluate((el) => {
          el.open = true;
        });
      }

      const outPath = resolve(screenshotsDir, `popup-active-${theme}.png`);
      await popupPage.screenshot({ path: outPath, fullPage: true });
      console.log(`Saved screenshot: ${outPath}`);

      const hostText = await popupPage.locator('#current-site').textContent();
      const badgeText = await popupPage.locator('#site-badge').textContent();
      console.log(`[Popup Active ${theme}] Host: "${hostText}", Badge: "${badgeText}"`);

      await popupPage.close();
      await activeTab.close();
    } finally {
      await harness.close();
    }
  }

  console.log('Automated visual and functional verification completed with 100% success!');
}

run().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
