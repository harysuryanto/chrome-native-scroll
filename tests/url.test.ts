import { describe, expect, it } from 'vitest';
import { classifyTabUrl } from '../src/shared/url';

describe('classifyTabUrl', () => {
  it('supports standard http/https hosts and localhost/IPv4', () => {
    expect(classifyTabUrl('https://example.com/article')).toEqual({
      supported: true,
      hostname: 'example.com',
    });
    expect(classifyTabUrl('http://localhost:4173/css-smooth.html')).toEqual({
      supported: true,
      hostname: 'localhost',
    });
    expect(classifyTabUrl('http://127.0.0.1:4173/')).toEqual({
      supported: true,
      hostname: '127.0.0.1',
    });
  });

  it('marks chrome://, chrome-extension://, about:, and file:// as unsupported', () => {
    expect(classifyTabUrl('chrome://extensions').supported).toBe(false);
    expect(classifyTabUrl('chrome-extension://abcdef/popup/index.html').supported).toBe(false);
    expect(classifyTabUrl('about:blank').supported).toBe(false);
    expect(classifyTabUrl('file:///tmp/test.html').supported).toBe(false);
  });

  it('marks Chrome Web Store pages as unsupported', () => {
    expect(classifyTabUrl('https://chromewebstore.google.com/detail/xyz').supported).toBe(false);
    expect(classifyTabUrl('https://chrome.google.com/webstore/category/extensions').supported).toBe(
      false,
    );
    expect(classifyTabUrl('https://chrome.google.com/').supported).toBe(true);
  });

  it('handles missing or malformed URLs safely', () => {
    expect(classifyTabUrl(undefined).supported).toBe(false);
    expect(classifyTabUrl('not a url').supported).toBe(false);
  });
});
