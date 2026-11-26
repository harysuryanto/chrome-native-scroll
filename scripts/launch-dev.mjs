import { resolve } from 'node:path';
import { chromium } from 'playwright';

const root = process.cwd();
const distDir = resolve(root, 'dist');
const userDataDir = '/tmp/chromium-dev-nativescroll-ui';

console.log('Launching dev browser instance with NativeScroll extension from:', distDir);

const context = await chromium.launchPersistentContext(userDataDir, {
  headless: false,
  viewport: null,
  args: [
    `--disable-extensions-except=${distDir}`,
    `--load-extension=${distDir}`,
    '--no-first-run',
    '--no-default-browser-check',
  ],
});

let [sw] = context.serviceWorkers();
if (!sw) {
  try {
    sw = await context.waitForEvent('serviceworker', { timeout: 10_000 });
  } catch {
    console.warn('Waiting for serviceworker timed out, continuing...');
  }
}

const extensionId = sw ? new URL(sw.url()).host : null;
console.log('--------------------------------------------------');
console.log('NativeScroll Extension loaded successfully!');
console.log('Extension ID:', extensionId);
console.log('--------------------------------------------------');

// Open tabs
if (extensionId) {
  const optionsPage = await context.newPage();
  await optionsPage.goto(`chrome-extension://${extensionId}/options/index.html`);
}

const fixturesIndexPage = await context.newPage();
await fixturesIndexPage.goto('http://127.0.0.1:4173/');

// Primary active tab with Lenis custom scroll physics to demonstrate the detection indicator
const lenisTab = context.pages()[0] ?? (await context.newPage());
await lenisTab.goto('http://127.0.0.1:4173/lenis.html');
await lenisTab.bringToFront();

console.log('Dev Browser is ready for testing.');
console.log('Active tab: http://127.0.0.1:4173/lenis.html (Demonstrating detection indicator)');
console.log('Other open tabs:');
console.log(' - http://127.0.0.1:4173/ (All fixtures)');
if (extensionId) {
  console.log(` - chrome-extension://${extensionId}/options/index.html (Options settings)`);
}

// Keep process alive for user testing
await new Promise(() => {});
