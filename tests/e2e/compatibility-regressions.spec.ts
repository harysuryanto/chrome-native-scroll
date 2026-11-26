import { expect, test } from '@playwright/test';
import { FIXTURES_BASE_URL, launchExtensionContext } from './extension';

for (const mode of ['native', 'compatibility', 'strict'] as const) {
  test.describe(`Interactive regressions (${mode} mode)`, () => {
    test(`preserves nested scroll, horizontal scroll, Ctrl+wheel zoom, keyboard scroll, canvas maps, carousels, and editors in ${mode} mode`, async () => {
      const harness = await launchExtensionContext();
      try {
        const optionsPage = await harness.context.newPage();
        await optionsPage.goto(`chrome-extension://${harness.extensionId}/options/index.html`);
        await optionsPage.selectOption('#default-mode', mode);

        const page = await harness.context.newPage();
        await page.goto(`${FIXTURES_BASE_URL}/interactive-regressions.html`, { waitUntil: 'load' });
        await page.waitForTimeout(100);

        // 1. Canvas map wheel preventDefault() still fires.
        const canvasBox = await page.locator('#map-canvas').boundingBox();
        expect(canvasBox).not.toBeNull();
        await page.mouse.move(canvasBox!.x + 40, canvasBox!.y + 40);
        await page.mouse.wheel(0, 120);
        await expect(page.locator('#canvas-wheel-count')).toHaveText('1');

        // 2. Carousel intentional wheel capture still fires.
        const carouselBox = await page.locator('#carousel').boundingBox();
        expect(carouselBox).not.toBeNull();
        await page.mouse.move(carouselBox!.x + 40, carouselBox!.y + 40);
        await page.mouse.wheel(0, 120);
        await expect(page.locator('#slide-index')).toHaveText('1');

        // 3. Ctrl+wheel zoom listener still fires.
        await page.keyboard.down('Control');
        await page.mouse.move(10, 10);
        await page.mouse.wheel(0, -100);
        await page.keyboard.up('Control');
        await expect(page.locator('#zoom-count')).toHaveText('1');

        // 4. Nested vertical container scrolls independently.
        const nestedBox = await page.locator('#nested-box').boundingBox();
        await page.mouse.move(nestedBox!.x + 40, nestedBox!.y + 40);
        await page.mouse.wheel(0, 200);
        await expect
          .poll(() => page.locator('#nested-box').evaluate((el) => el.scrollTop))
          .toBeGreaterThan(0);

        // 5. Horizontal scroll container scrolls horizontally.
        const horizBox = await page.locator('#horiz-box').boundingBox();
        await page.mouse.move(horizBox!.x + 40, horizBox!.y + 40);
        await page.mouse.wheel(200, 0);
        await expect
          .poll(() => page.locator('#horiz-box').evaluate((el) => el.scrollLeft))
          .toBeGreaterThan(0);

        // 6. Scrollable textarea editor scrolls cleanly.
        const editorBox = await page.locator('#editor').boundingBox();
        await page.mouse.move(editorBox!.x + 40, editorBox!.y + 40);
        await page.mouse.wheel(0, 150);
        await expect
          .poll(() => page.locator('#editor').evaluate((el) => el.scrollTop))
          .toBeGreaterThan(0);

        // 7. Keyboard scrolling (PageDown) scrolls the main document.
        await page.mouse.click(10, 10);
        await page.keyboard.press('PageDown');
        await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
      } finally {
        await harness.close();
      }
    });
  });
}
