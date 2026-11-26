import { expect, test } from '@playwright/test';
import { FIXTURES_BASE_URL, launchExtensionContext } from './extension';

test.describe('GSAP ScrollSmoother adapter E2E', () => {
  test('sets ScrollSmoother smooth(0) in Compatibility mode, preserves unrelated tweens, and restores on disable', async () => {
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
      await page.goto(`${FIXTURES_BASE_URL}/gsap-scrollsmoother.html`, { waitUntil: 'load' });

      await expect
        .poll(() =>
          page.evaluate(() => ({
            smooth: (window as unknown as { ScrollSmoother: { get(): { smooth(): number } } })
              .ScrollSmoother.get()
              .smooth(),
            tweenDone: (window as unknown as { __unrelatedTweenDone: boolean }).__unrelatedTweenDone,
          })),
        )
        .toEqual({ smooth: 0, tweenDone: true });

      // Disabling NativeScroll restores original smooth duration (1.5).
      await optionsPage.evaluate(async () => {
        const stored = await chrome.storage.local.get('nativeScrollSettings');
        await chrome.storage.local.set({
          nativeScrollSettings: { ...stored.nativeScrollSettings, enabled: false },
        });
      });

      await expect
        .poll(() =>
          page.evaluate(() =>
            (window as unknown as { ScrollSmoother: { get(): { smooth(): number } } })
              .ScrollSmoother.get()
              .smooth(),
          ),
        )
        .toBe(1.5);
    } finally {
      await harness.close();
    }
  });
});
