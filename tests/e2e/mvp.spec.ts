import { expect, test } from '@playwright/test';
import { FIXTURES_BASE_URL, launchExtensionContext } from './extension';

test.describe('NativeScroll MVP E2E', () => {
  test('neutralizes CSS smooth scrolling without altering unrelated styles and reverts on disable', async () => {
    const harness = await launchExtensionContext();
    try {
      const page = await harness.context.newPage();
      const errors: string[] = [];
      page.on('pageerror', (err) => errors.push(err.message));

      await page.goto(`${FIXTURES_BASE_URL}/css-smooth.html`, { waitUntil: 'load' });

      // Wait for content script to apply CSS override.
      await expect
        .poll(() =>
          page.evaluate(() => ({
            html: getComputedStyle(document.documentElement).scrollBehavior,
            nested: getComputedStyle(document.getElementById('nested-smooth')!).scrollBehavior,
            color: getComputedStyle(document.body).color,
          })),
        )
        .toEqual({ html: 'auto', nested: 'auto', color: 'rgb(17, 24, 39)' });

      // Disable NativeScroll via Options page and verify original CSS smooth behavior is restored.
      const optionsPage = await harness.context.newPage();
      await optionsPage.goto(`chrome-extension://${harness.extensionId}/options/index.html`);
      const globalToggle = optionsPage.locator('#enabled');
      await expect(globalToggle).toBeChecked();
      await globalToggle.uncheck();

      await expect
        .poll(() =>
          page.evaluate(() => ({
            html: getComputedStyle(document.documentElement).scrollBehavior,
            nested: getComputedStyle(document.getElementById('nested-smooth')!).scrollBehavior,
          })),
        )
        .toEqual({ html: 'smooth', nested: 'smooth' });

      expect(errors).toEqual([]);
    } finally {
      await harness.close();
    }
  });

  test('neutralizes explicit JS smooth-scroll APIs and preserves numeric overloads and caller objects', async () => {
    const harness = await launchExtensionContext();
    try {
      const page = await harness.context.newPage();
      await page.goto(`${FIXTURES_BASE_URL}/js-smooth-api.html`, { waitUntil: 'load' });

      // Give MAIN-world config handshake a moment to settle.
      await page.waitForTimeout(100);

      // window.scrollTo({ top: 1200, behavior: 'smooth' }) should jump immediately without mutating opts.
      await page.click('#btn-win-scrollto-smooth');
      const afterScrollTo = await page.evaluate(() => ({
        y: Math.round(window.scrollY),
        optsBehavior: (window as unknown as { __lastOptionsBehavior: string }).__lastOptionsBehavior,
      }));
      expect(afterScrollTo.y).toBeGreaterThanOrEqual(1150);
      expect(afterScrollTo.optsBehavior).toBe('smooth');

      // Numeric overload window.scrollTo(0, 900) continues to work.
      await page.click('#btn-win-scrollto-numeric');
      const afterNumeric = await page.evaluate(() => Math.round(window.scrollY));
      expect(afterNumeric).toBe(900);

      // Element.scrollTo({ top: 600, behavior: 'smooth' }) jumps immediately.
      await page.click('#btn-el-scrollto-smooth');
      const boxScrollTop = await page.evaluate(
        () => Math.round(document.getElementById('box')!.scrollTop),
      );
      expect(boxScrollTop).toBeGreaterThanOrEqual(590);

      // Element.scrollIntoView({ behavior: 'smooth', block: 'start' }) jumps immediately.
      await page.click('#btn-el-intoview-smooth');
      const afterIntoView = await page.evaluate(() => Math.round(window.scrollY));
      expect(afterIntoView).toBeGreaterThan(1500);
    } finally {
      await harness.close();
    }
  });

  test('preserves native, nested, and horizontal scrolling', async () => {
    const harness = await launchExtensionContext();
    try {
      const nestedPage = await harness.context.newPage();
      await nestedPage.goto(`${FIXTURES_BASE_URL}/nested-scroll.html`, { waitUntil: 'load' });
      const inner = nestedPage.locator('#inner-vertical');
      await inner.evaluate((el) => {
        el.scrollTop = 300;
      });
      expect(await inner.evaluate((el) => el.scrollTop)).toBe(300);

      const horizPage = await harness.context.newPage();
      await horizPage.goto(`${FIXTURES_BASE_URL}/horizontal-scroll.html`, { waitUntil: 'load' });
      const strip = horizPage.locator('#horizontal-strip');
      await strip.evaluate((el) => {
        el.scrollLeft = 400;
      });
      expect(await strip.evaluate((el) => el.scrollLeft)).toBe(400);
    } finally {
      await harness.close();
    }
  });

  test('exclusions persist across browser restart and synchronize live with open tabs', async () => {
    const harness = await launchExtensionContext();
    const sharedProfileDir = harness.userDataDir;
    try {
      const sitePage = await harness.context.newPage();
      await sitePage.goto(`${FIXTURES_BASE_URL}/css-smooth.html`, { waitUntil: 'load' });
      await expect
        .poll(() => sitePage.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior))
        .toBe('auto');

      // Exclude 127.0.0.1 in Options.
      const optionsPage = await harness.context.newPage();
      await optionsPage.goto(`chrome-extension://${harness.extensionId}/options/index.html`);
      await optionsPage.fill('#exclude-input', '127.0.0.1');
      await optionsPage.click('#exclude-add');
      await expect(optionsPage.locator('#exclude-list')).toContainText('127.0.0.1');

      // Open tab immediately restores smooth scrolling.
      await expect
        .poll(() => sitePage.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior))
        .toBe('smooth');

      // Close context without deleting profile dir, then relaunch to verify persistence.
      await harness.context.close();
      const restarted = await launchExtensionContext(sharedProfileDir);
      try {
        const verifyOptions = await restarted.context.newPage();
        await verifyOptions.goto(`chrome-extension://${restarted.extensionId}/options/index.html`);
        await expect(verifyOptions.locator('#exclude-list')).toContainText('127.0.0.1');

        // Clear all exclusions and verify list empties.
        await verifyOptions.click('#exclude-clear');
        await expect(verifyOptions.locator('#exclude-empty')).toBeVisible();
      } finally {
        await restarted.context.close();
      }
    } finally {
      // Clean up temp profile dir via fs in close() if still open; ignore already-closed context.
      await harness.close().catch(() => {});
    }
  });

  test('popup displays accurate state and handles unsupported pages honestly', async () => {
    const harness = await launchExtensionContext();
    try {
      const popupPage = await harness.context.newPage();
      await popupPage.goto(`chrome-extension://${harness.extensionId}/popup/index.html`);
      await expect(popupPage.locator('#title')).toHaveText('NativeScroll');
      await expect(popupPage.locator('.tagline')).toHaveText('Back to native scrolling.');
      // When popup is opened directly as a tab, its own chrome-extension:// URL is unsupported.
      await expect(popupPage.locator('#site-badge')).toHaveText('Unsupported');
      await expect(popupPage.locator('#site-enabled')).toBeDisabled();
    } finally {
      await harness.close();
    }
  });
});
