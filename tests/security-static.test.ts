import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();

function collectSourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...collectSourceFiles(full));
    } else if (full.endsWith('.ts') || full.endsWith('.html')) {
      out.push(full);
    }
  }
  return out;
}

describe('Manifest V3 security & privacy static audit', () => {
  it('requests only minimal justified permissions in public/manifest.json', () => {
    const manifest = JSON.parse(readFileSync(resolve(root, 'public/manifest.json'), 'utf8')) as {
      manifest_version: number;
      permissions?: string[];
      host_permissions?: string[];
      externally_connectable?: unknown;
    };
    expect(manifest.manifest_version).toBe(3);
    expect(manifest.permissions).toEqual(['storage', 'activeTab']);
    expect(manifest.host_permissions).toBeUndefined();
    expect(manifest.externally_connectable).toBeUndefined();
  });

  it('contains no eval, new Function, innerHTML, document.write, or network calls in src/', () => {
    const files = collectSourceFiles(resolve(root, 'src'));
    const forbidden = [
      /\beval\s*\(/,
      /\bnew\s+Function\s*\(/,
      /\.innerHTML\s*=/,
      /\.outerHTML\s*=/,
      /\bdocument\.write\s*\(/,
      /\bfetch\s*\(/,
      /\bXMLHttpRequest\b/,
      /\bnavigator\.sendBeacon\b/,
    ];
    for (const file of files) {
      const content = readFileSync(file, 'utf8');
      for (const pattern of forbidden) {
        expect(pattern.test(content), `Forbidden pattern ${pattern} found in ${file}`).toBe(false);
      }
    }
  });
});
