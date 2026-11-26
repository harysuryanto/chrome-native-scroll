import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const fixturesDir = resolve(process.cwd(), 'fixtures');

const REQUIRED_FIXTURES = [
  'index.html',
  'native-scroll.html',
  'css-smooth.html',
  'js-smooth-api.html',
  'nested-scroll.html',
  'horizontal-scroll.html',
];

describe('Deterministic scrolling test fixtures', () => {
  it('provides all required local HTML fixtures', () => {
    for (const file of REQUIRED_FIXTURES) {
      expect(existsSync(resolve(fixturesDir, file)), `missing fixture ${file}`).toBe(true);
    }
  });

  it('documents synthetic wheel limitations on the index fixture', () => {
    const indexHtml = readFileSync(resolve(fixturesDir, 'index.html'), 'utf8');
    expect(indexHtml).toContain('WheelEvent');
    expect(indexHtml).toContain('physical trackpad');
  });

  it('includes root and nested smooth-scroll rules in css-smooth.html', () => {
    const cssHtml = readFileSync(resolve(fixturesDir, 'css-smooth.html'), 'utf8');
    expect(cssHtml).toContain('scroll-behavior: smooth');
    expect(cssHtml).toContain('#nested-smooth');
  });
});
