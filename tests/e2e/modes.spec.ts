import { expect, test } from '@playwright/test';
import { FIXTURES_BASE_URL, launchExtensionContext } from './extension';

test.describe('Operating modes E2E (Native, Compatibility, Strict)', () => {
  test('switches between Native, Compatibility, and Strict modes with warning and restores defaults', async () => {
    const harness = await launchExtensionContext();
    try {
      const optionsPage = await harness.context.newPage();
      await optionsPage.goto(`chrome-extension://${harness.extensionId}/options/index.html`);

      // Default mode is Native; Strict warning is hidden.
      await expect(optionsPage.locator('#default-mode')).toHaveValue('native');
      await expect(optionsPage.locator('#strict-warning')).toBeHidden();

      // Switch to Strict -> warning appears immediately.
      await optionsPage.selectOption('#default-mode', 'strict');
      await expect(optionsPage.locator('#strict-warning')).toBeVisible();

      // Switch to Compatibility -> Lenis fixture is neutralized without needing per-site override.
      await optionsPage.selectOption('#default-mode', 'compatibility');
      await expect(optionsPage.locator('#strict-warning')).toBeHidden();

      const lenisPage = await harness.context.newPage();
      await lenisPage.goto(`${FIXTURES_BASE_URL}/lenis.html`, { waitUntil: 'load' });
      await expect
        .poll(() =>
          lenisPage.evaluate(() => document.documentElement.hasAttribute('data-lenis-prevent-wheel')),
        )
        .toBe(true);

      // Restore defaults -> returns to Native and removes Lenis opt-out attribute.
      await optionsPage.click('#restore-defaults');
      await expect(optionsPage.locator('#default-mode')).toHaveValue('native');
      await expect
        .poll(() =>
          lenisPage.evaluate(() => document.documentElement.hasAttribute('data-lenis-prevent-wheel')),
        )
        .toBe(false);
    } finally {
      await harness.close();
    }
  });
});
