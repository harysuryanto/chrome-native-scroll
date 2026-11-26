import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { chromium, type BrowserContext } from '@playwright/test';

export const DIST_DIR = resolve(process.cwd(), 'dist');
export const FIXTURES_BASE_URL = 'http://127.0.0.1:4173';

export interface ExtensionHarness {
  context: BrowserContext;
  extensionId: string;
  userDataDir: string;
  close(): Promise<void>;
}

export async function launchExtensionContext(existingUserDataDir?: string): Promise<ExtensionHarness> {
  const ownsDir = !existingUserDataDir;
  const userDataDir = existingUserDataDir ?? mkdtempSync(join(tmpdir(), 'nativescroll-e2e-'));

  const context = await chromium.launchPersistentContext(userDataDir, {
    channel: 'chromium',
    headless: true,
    args: [
      `--disable-extensions-except=${DIST_DIR}`,
      `--load-extension=${DIST_DIR}`,
    ],
  });

  let [serviceWorker] = context.serviceWorkers();
  if (!serviceWorker) {
    serviceWorker = await context.waitForEvent('serviceworker', { timeout: 15_000 });
  }
  const extensionId = new URL(serviceWorker.url()).host;

  return {
    context,
    extensionId,
    userDataDir,
    async close() {
      await context.close();
      if (ownsDir) {
        rmSync(userDataDir, { recursive: true, force: true });
      }
    },
  };
}
