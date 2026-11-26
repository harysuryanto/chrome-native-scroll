/* global Bun */
import { mkdtempSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { chromium } from '@playwright/test';

const root = process.cwd();
const distDir = resolve(root, 'dist');
const releaseDir = resolve(root, 'release');

// 1. Clean production build
const buildProc = Bun.spawnSync(['bun', 'scripts/build.mjs'], { stdout: 'inherit', stderr: 'inherit' });
if (buildProc.exitCode !== 0) throw new Error('Build failed');

const manifest = await Bun.file(join(distDir, 'manifest.json')).json();
const version = manifest.version;

// 2. Audit dist/ for forbidden dev-only or sourcemap artifacts
function walk(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) files.push(...walk(full));
    else files.push(full);
  }
  return files;
}

const distFiles = walk(distDir);
for (const file of distFiles) {
  if (file.endsWith('.map') || file.endsWith('.ts') || file.includes('node_modules')) {
    throw new Error(`Forbidden dev artifact in dist/: ${file}`);
  }
}

// 3. Create reproducible release ZIP
mkdirSync(releaseDir, { recursive: true });
const zipPath = join(releaseDir, `nativescroll-v${version}.zip`);
rmSync(zipPath, { force: true });

const zipProc = Bun.spawnSync(['zip', '-r', '-q', zipPath, '.'], {
  cwd: distDir,
  stdout: 'inherit',
  stderr: 'inherit',
});
if (zipProc.exitCode !== 0) throw new Error('zip command failed');

// 4. Extract ZIP to temp dir and verify it loads cleanly in Chromium
const extractDir = mkdtempSync(join(tmpdir(), 'nativescroll-zip-verify-'));
const userDataDir = mkdtempSync(join(tmpdir(), 'nativescroll-zip-profile-'));
try {
  const unzipProc = Bun.spawnSync(['unzip', '-q', zipPath, '-d', extractDir]);
  if (unzipProc.exitCode !== 0) throw new Error('unzip verification failed');

  const context = await chromium.launchPersistentContext(userDataDir, {
    channel: 'chromium',
    headless: true,
    args: [`--disable-extensions-except=${extractDir}`, `--load-extension=${extractDir}`],
  });
  try {
    let [sw] = context.serviceWorkers();
    if (!sw) sw = await context.waitForEvent('serviceworker', { timeout: 10_000 });
    const extId = new URL(sw.url()).host;
    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extId}/popup/index.html`);
    const title = await popup.locator('#title').textContent();
    if (title !== 'NativeScroll') throw new Error(`Unexpected popup title: ${title}`);
    console.log(`Verified extracted release ZIP loads cleanly in Chromium (v${version}): ${zipPath}`);
  } finally {
    await context.close();
  }
} finally {
  rmSync(extractDir, { recursive: true, force: true });
  rmSync(userDataDir, { recursive: true, force: true });
}
