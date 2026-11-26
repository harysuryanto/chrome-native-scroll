import { expect, test } from '@playwright/test';
import { FIXTURES_BASE_URL, launchExtensionContext } from './extension';

test.describe('Lenis adapter E2E', () => {
  test('neutralizes closure-scoped Lenis wheel interception in Compatibility mode and reverts cleanly', async () => {
    const harness = await launchExtensionContext();
    try {
      // Enable Compatibility mode + libraryAdapters for 127.0.0.1 via extension storage.
      const optionsPage = await harness.context.newPage();
      await optionsPage.goto(`chrome-extension://${harness.extensionId}/options/index.html`);
      await optionsPage.evaluate(async () => {
        await chrome.storage.local.set({
          nativeScrollSettings: {
            schemaVersion: 1,
            enabled: true,
            features: {
              cssSmoothScrolling: true,
              smoothScrollApis: true,
              wheelOptimization: false,
              libraryAdapters: true,
            },
            excludedHosts: [],
            siteModes: { '127.0.0.1': 'compatibility' },
          },
        });
      });

      const page = await harness.context.newPage();
      await page.goto(`${FIXTURES_BASE_URL}/lenis.html`, { waitUntil: 'load' });

      // Lenis initializes and NativeScroll applies data-lenis-prevent-wheel.
      await expect
        .poll(() =>
          page.evaluate(() => ({
            hasLenis: document.documentElement.classList.contains('lenis'),
            preventWheel: document.documentElement.hasAttribute('data-lenis-prevent-wheel'),
          })),
        )
        .toEqual({ hasLenis: true, preventWheel: true });

      // Wheel scrolling on the main document succeeds natively.
      await page.mouse.move(600, 300);
      await page.mouse.wheel(0, 300);
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);

      // Normal UI interactions and nested scroll continue working.
      await page.click('#click-test');
      await expect(page.locator('#click-count')).toHaveText('1');

      // Disabling NativeScroll removes data-lenis-prevent-wheel cleanly.
      await optionsPage.evaluate(async () => {
        const stored = await chrome.storage.local.get('nativeScrollSettings');
        const current = stored.nativeScrollSettings;
        await chrome.storage.local.set({
          nativeScrollSettings: { ...current, enabled: false },
        });
      });

      await expect
        .poll(() =>
          page.evaluate(() => document.documentElement.hasAttribute('data-lenis-prevent-wheel')),
        )
        .toBe(false);
    } finally {
      await harness.close();
    }
  });
});
