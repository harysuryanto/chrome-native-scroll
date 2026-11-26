import { resolve } from 'node:path';
import { chromium } from 'playwright';

const root = process.cwd();
const screenshotsDir = resolve(root, 'docs/screenshots');

async function renderMockup() {
  const browser = await chromium.launch({ headless: true });

  for (const theme of ['dark', 'light']) {
    const context = await browser.newContext({
      colorScheme: theme,
      deviceScaleFactor: 2,
      viewport: { width: 384, height: 780 },
    });
    const page = await context.newPage();

    // Load dist popup HTML
    const htmlPath = resolve(root, 'dist/popup/index.html');
    await page.goto('file://' + htmlPath);

    // Inject active simulated state directly into the DOM
    await page.evaluate(() => {
      // 1. Enable switches
      const enabled = document.getElementById('enabled');
      if (enabled) enabled.checked = true;
      const siteEnabled = document.getElementById('site-enabled');
      if (siteEnabled) siteEnabled.checked = true;

      // 2. Set site info
      const siteHost = document.getElementById('current-site');
      if (siteHost) siteHost.textContent = 'linear.app';
      const siteDetail = document.getElementById('site-detail');
      if (siteDetail) siteDetail.textContent = 'CSS and smooth-scroll APIs normalized on this host.';
      const siteBadge = document.getElementById('site-badge');
      if (siteBadge) {
        siteBadge.textContent = 'Active';
        siteBadge.dataset.state = 'active';
      }

      // 3. Set custom physics banner
      const physics = document.getElementById('physics-indicator');
      if (physics) {
        physics.textContent = 'Custom scroll physics detected: Lenis, non-passive root wheel listener';
        physics.hidden = false;
      }

      // 4. Set Mode Card state (Auto selected)
      const autoCard = document.querySelector('.mode-card[data-mode="auto"]');
      if (autoCard) {
        autoCard.setAttribute('aria-checked', 'true');
        autoCard.disabled = false;
      }
      const autoTitle = document.getElementById('mode-auto-title');
      if (autoTitle) autoTitle.textContent = 'Auto (Using Native)';

      const allCards = document.querySelectorAll('.mode-card');
      allCards.forEach((c) => (c.disabled = false));

      // 5. Diagnostics
      const diagPanel = document.getElementById('diagnostics-panel');
      const diagList = document.getElementById('diagnostics-list');
      if (diagPanel && diagList) {
        diagPanel.hidden = false;
        diagPanel.open = true;
        diagList.innerHTML = '';
        const items = [
          'CSS override: successfully_neutralized',
          'Smooth-scroll APIs: active (5 smooth calls neutralized)',
          'Root non-passive wheel listeners: 1 (observing only)',
          'Lenis: neutralized — wheel listener detached',
          'GSAP ScrollSmoother: not_detected',
          'Locomotive Scroll: not_detected',
        ];
        items.forEach((text) => {
          const li = document.createElement('li');
          li.textContent = text;
          diagList.appendChild(li);
        });
      }
    });

    await page.waitForTimeout(200);

    const outPath = resolve(screenshotsDir, `popup-active-${theme}.png`);
    await page.screenshot({ path: outPath, fullPage: true });
    console.log(`Rendered rich preview: ${outPath}`);

    await context.close();
  }

  await browser.close();
  console.log('Active state mockup previews successfully generated!');
}

renderMockup().catch((err) => {
  console.error('Mockup render failed:', err);
  process.exit(1);
});
