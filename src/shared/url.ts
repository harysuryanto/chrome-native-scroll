import { normalizeHostname } from './settings';

export type TabSupportResult =
  | { readonly supported: true; readonly hostname: string }
  | { readonly supported: false; readonly hostname: null; readonly reason: string };

const RESTRICTED_PROTOCOLS = new Set([
  'chrome:',
  'chrome-extension:',
  'edge:',
  'brave:',
  'about:',
  'devtools:',
  'view-source:',
  'data:',
  'javascript:',
]);

export function classifyTabUrl(rawUrl: string | undefined): TabSupportResult {
  if (!rawUrl) {
    return { supported: false, hostname: null, reason: 'No active page URL available.' };
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { supported: false, hostname: null, reason: 'Unsupported page URL.' };
  }

  if (RESTRICTED_PROTOCOLS.has(parsed.protocol)) {
    return {
      supported: false,
      hostname: null,
      reason: `Browser internal page (${parsed.protocol.replace(':', '')}) cannot be modified.`,
    };
  }

  if (parsed.protocol === 'file:') {
    return {
      supported: false,
      hostname: null,
      reason: 'Local file:// pages require explicit file URL permission in Chrome.',
    };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return {
      supported: false,
      hostname: null,
      reason: `Unsupported protocol (${parsed.protocol}).`,
    };
  }

  const host = normalizeHostname(parsed.hostname);
  if (!host) {
    return { supported: false, hostname: null, reason: 'Unsupported hostname.' };
  }

  if (
    host === 'chromewebstore.google.com' ||
    (host === 'chrome.google.com' && parsed.pathname.startsWith('/webstore'))
  ) {
    return {
      supported: false,
      hostname: null,
      reason: 'Chrome Web Store pages cannot be modified by extensions.',
    };
  }

  return { supported: true, hostname: host };
}
