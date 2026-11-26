import { expect, test } from '@playwright/test';
import { FIXTURES_BASE_URL, launchExtensionContext } from './extension';

test.describe('Locomotive Scroll adapter E2E', () => {
  test('neutralizes Locomotive Scroll v5 wheel smoothing in Compatibility mode and reverts cleanly', async () => {
    const harness = await launchExtensionContext();
    try {
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
      await page.goto(`${FIXTURES_BASE_URL}/locomotive-scroll.html`, { waitUntil: 'load' });

      await expect
        .poll(() =>
          page.evaluate(() => ({
            hasLenis: document.documentElement.classList.contains('lenis'),
            preventWheel: document.documentElement.hasAttribute('data-lenis-prevent-wheel'),
          })),
        )
        .toEqual({ hasLenis: true, preventWheel: true });

      await page.mouse.move(400, 300);
      await page.mouse.wheel(0, 300);
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
    } finally {
      await harness.close();
    }
  });
});
