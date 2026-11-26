import { expect, test } from '@playwright/test';
import { FIXTURES_BASE_URL, launchExtensionContext } from './extension';

test.describe('Security & privacy boundary E2E', () => {
  test('untrusted page events cannot mutate extension storage and extension makes zero external network requests', async () => {
    const harness = await launchExtensionContext();
    try {
      const externalRequests: string[] = [];
      harness.context.on('request', (req) => {
        const url = req.url();
        if (
          !url.startsWith(FIXTURES_BASE_URL) &&
          !url.startsWith(`chrome-extension://${harness.extensionId}`) &&
          !url.startsWith('data:') &&
          !url.startsWith('about:')
        ) {
          externalRequests.push(url);
        }
      });

      const page = await harness.context.newPage();
      await page.goto(`${FIXTURES_BASE_URL}/css-smooth.html`, { waitUntil: 'load' });

      // Simulate hostile page attempting to forge settings mutation events.
      await page.evaluate(() => {
        window.postMessage(
          { type: 'native-scroll:write-settings', enabled: false, excludedHosts: ['evil.com'] },
          '*',
        );
        document.dispatchEvent(
          new CustomEvent('native-scroll:diagnostics-report', {
            detail: {
              apiPatchState: 'active',
              neutralizedApiCalls: 999999999,
              adapters: [{ id: 'xss', name: '<img src=x onerror=alert(1)>', status: 'active' }],
            },
          }),
        );
      });

      // Verify storage remains untouched at defaults.
      const optionsPage = await harness.context.newPage();
      await optionsPage.goto(`chrome-extension://${harness.extensionId}/options/index.html`);
      const stored = await optionsPage.evaluate(async () => {
        const data = await chrome.storage.local.get('nativeScrollSettings');
        return data.nativeScrollSettings;
      });
      expect(stored.enabled).toBe(true);
      expect(stored.excludedHosts).toEqual([]);
      expect(externalRequests).toEqual([]);
    } finally {
      await harness.close();
    }
  });
});
