import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { chromium } from 'playwright';

function getSvg(size, disabled = false) {
  if (size === 16) {
    const bgFill = disabled ? '#1e293b' : 'url(#bg16)';
    const strokeUp = disabled ? '#94a3b8' : '#38bdf8';
    const strokeDown = disabled ? '#64748b' : '#2563eb';
    const centerFill = disabled ? '#475569' : '#e0f2fe';
    const borderStroke = disabled ? 'rgba(148, 163, 184, 0.3)' : 'rgba(56, 189, 248, 0.4)';

    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
        <defs>
          <linearGradient id="bg16" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#0e1726"/>
            <stop offset="100%" stop-color="#020617"/>
          </linearGradient>
        </defs>
        <rect x="0.5" y="0.5" width="15" height="15" rx="3.5" fill="${bgFill}" stroke="${borderStroke}" stroke-width="1"/>
        <path d="M4 6 L8 2.5 L12 6" fill="none" stroke="${strokeUp}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <line x1="6" y1="8" x2="10" y2="8" stroke="${centerFill}" stroke-width="1.5" stroke-linecap="round"/>
        <path d="M4 10 L8 13.5 L12 10" fill="none" stroke="${strokeDown}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
  }

  if (size === 32) {
    const bgFill = disabled ? '#1e293b' : 'url(#bg32)';
    const strokeUp = disabled ? '#94a3b8' : '#38bdf8';
    const strokeDown = disabled ? '#64748b' : '#3b82f6';
    const centerFill = disabled ? '#64748b' : '#bae6fd';
    const borderStroke = disabled ? 'rgba(148, 163, 184, 0.25)' : 'rgba(56, 189, 248, 0.45)';

    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
        <defs>
          <linearGradient id="bg32" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#0e1726"/>
            <stop offset="100%" stop-color="#020617"/>
          </linearGradient>
        </defs>
        <rect x="1" y="1" width="30" height="30" rx="7.5" fill="${bgFill}" stroke="${borderStroke}" stroke-width="1.5"/>
        <path d="M8 12 L16 5 L24 12" fill="none" stroke="${strokeUp}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
        <line x1="11" y1="16" x2="21" y2="16" stroke="${centerFill}" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M8 20 L16 27 L24 20" fill="none" stroke="${strokeDown}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
  }

  if (size === 48) {
    const bgFill = disabled ? '#1e293b' : 'url(#bg48)';
    const strokeUp = disabled ? '#94a3b8' : '#38bdf8';
    const strokeDown = disabled ? '#64748b' : '#3b82f6';
    const centerFill = disabled ? '#64748b' : '#e0f2fe';
    const borderStroke = disabled ? 'rgba(148, 163, 184, 0.25)' : 'rgba(56, 189, 248, 0.45)';

    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
        <defs>
          <linearGradient id="bg48" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#111c33"/>
            <stop offset="100%" stop-color="#030712"/>
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="44" height="44" rx="11" fill="${bgFill}" stroke="${borderStroke}" stroke-width="1.8"/>
        <!-- Upward kinetic chevron -->
        <path d="M12 18 L24 8 L36 18" fill="none" stroke="${strokeUp}" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"/>
        <!-- Central kinetic rail indicator -->
        <rect x="21" y="21" width="6" height="6" rx="3" fill="${centerFill}"/>
        <line x1="16" y1="24" x2="18" y2="24" stroke="${centerFill}" stroke-width="2" stroke-linecap="round"/>
        <line x1="30" y1="24" x2="32" y2="24" stroke="${centerFill}" stroke-width="2" stroke-linecap="round"/>
        <!-- Downward kinetic chevron -->
        <path d="M12 30 L24 40 L36 30" fill="none" stroke="${strokeDown}" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;
  }

  // 128x128
  const bgFill = disabled ? 'url(#bgDis128)' : 'url(#bg128)';
  const strokeUp = disabled ? '#94a3b8' : 'url(#gradUp128)';
  const strokeDown = disabled ? '#64748b' : 'url(#gradDown128)';
  const centerFill = disabled ? '#64748b' : '#38bdf8';
  const railStroke = disabled ? '#334155' : 'rgba(56, 189, 248, 0.25)';
  const borderStroke = disabled ? 'rgba(148, 163, 184, 0.25)' : 'rgba(56, 189, 248, 0.5)';

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
      <defs>
        <linearGradient id="bg128" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#0f172a"/>
          <stop offset="60%" stop-color="#090d16"/>
          <stop offset="100%" stop-color="#020617"/>
        </linearGradient>
        <linearGradient id="bgDis128" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#1e293b"/>
          <stop offset="100%" stop-color="#0f172a"/>
        </linearGradient>
        <linearGradient id="gradUp128" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stop-color="#0ea5e9"/>
          <stop offset="100%" stop-color="#38bdf8"/>
        </linearGradient>
        <linearGradient id="gradDown128" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#2563eb"/>
          <stop offset="100%" stop-color="#38bdf8"/>
        </linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feComposite in="SourceGraphic" in2="blur" operator="over"/>
        </filter>
      </defs>
      <!-- Base squircle -->
      <rect x="6" y="6" width="116" height="116" rx="28" fill="${bgFill}" stroke="${borderStroke}" stroke-width="2.5"/>
      <!-- Inner subtle guide lines -->
      <line x1="64" y1="36" x2="64" y2="92" stroke="${railStroke}" stroke-width="2" stroke-dasharray="3 4"/>
      <!-- Upward kinetic chevron -->
      <path d="M34 50 L64 24 L94 50" fill="none" stroke="${strokeUp}" stroke-width="9.5" stroke-linecap="round" stroke-linejoin="round"/>
      <!-- Central precision core -->
      <rect x="56" y="56" width="16" height="16" rx="8" fill="${centerFill}"/>
      <line x1="42" y1="64" x2="48" y2="64" stroke="${centerFill}" stroke-width="3" stroke-linecap="round"/>
      <line x1="80" y1="64" x2="86" y2="64" stroke="${centerFill}" stroke-width="3" stroke-linecap="round"/>
      <!-- Downward kinetic chevron -->
      <path d="M34 78 L64 104 L94 78" fill="none" stroke="${strokeDown}" stroke-width="9.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;
}

async function renderIcons() {
  const browser = await chromium.launch({ headless: true });
  const sizes = [16, 32, 48, 128];

  for (const size of sizes) {
    for (const disabled of [false, true]) {
      const page = await browser.newPage({ viewport: { width: size, height: size } });
      const svg = getSvg(size, disabled);
      const html = `
        <!doctype html>
        <html>
          <body style="margin: 0; padding: 0; width: ${size}px; height: ${size}px; overflow: hidden; background: transparent; display: grid; place-items: center;">
            ${svg}
          </body>
        </html>
      `;
      await page.setContent(html);
      const fileName = disabled ? `icon-disabled-${size}.png` : `icon-${size}.png`;
      const outPath = resolve(process.cwd(), 'public/icons', fileName);
      const buf = await page.screenshot({ type: 'png', omitBackground: true });
      writeFileSync(outPath, buf);
      console.log(`Rendered ${fileName} (${buf.length} bytes)`);
      await page.close();
    }
  }

  await browser.close();
  console.log('All icons rendered successfully!');
}

renderIcons().catch((err) => {
  console.error('Error rendering icons:', err);
  process.exit(1);
});
