import { chromium } from '@playwright/test';
import { resolve } from 'node:path';
import { rmSync } from 'node:fs';

const DIST_DIR = resolve(process.cwd(), 'dist');
const USER_DATA_DIR = '/tmp/nativescroll-dev-chrome';

try {
  rmSync(USER_DATA_DIR, { recursive: true, force: true });
} catch {
  // Ignored if directory does not exist
}

console.log('Launching dev Chrome instance with extension at:', DIST_DIR);

const context = await chromium.launchPersistentContext(USER_DATA_DIR, {
  headless: false,
  args: [
    `--disable-extensions-except=${DIST_DIR}`,
    `--load-extension=${DIST_DIR}`,
    '--no-first-run',
    '--no-default-browser-check',
  ],
});

console.log('Waiting for extension service worker to register...');
let [serviceWorker] = context.serviceWorkers();
if (!serviceWorker) {
  serviceWorker = await context.waitForEvent('serviceworker', { timeout: 15_000 });
}
const extensionId = new URL(serviceWorker.url()).host;
console.log('SUCCESS: NativeScroll extension is verified installed!');
console.log('Extension ID:', extensionId);

// Page 1: Options page
const optionsPage = context.pages()[0] || (await context.newPage());
await optionsPage.goto(`chrome-extension://${extensionId}/options/index.html`);

// Page 2: Popup page in view
const popupPage = await context.newPage();
await popupPage.goto(`chrome-extension://${extensionId}/popup/index.html`);

// Page 3: chrome://extensions to inspect installed extension
const extManagerPage = await context.newPage();
try {
  await extManagerPage.goto('chrome://extensions');
} catch {
  // If chrome:// is restricted, load a sample test page
  await extManagerPage.goto('https://example.com');
}

console.log('Chrome is open with NativeScroll extension loaded. Ready for testing.');

// Keep browser alive
await new Promise(() => {});
