import type { AdapterActionResult, ScrollLibraryAdapter } from './types';

const PREVENT_WHEEL_ATTR = 'data-lenis-prevent-wheel';

function hasLenisDomMarkers(doc: Document): boolean {
  const root = doc.documentElement;
  if (!root) return false;
  return (
    root.classList.contains('lenis') ||
    root.classList.contains('lenis-smooth') ||
    doc.querySelector('[data-lenis-prevent], [data-lenis-prevent-wheel]') !== null
  );
}

/**
 * Lenis adapter (verified on Lenis 1.x).
 * Uses Lenis's documented `data-lenis-prevent-wheel` attribute on the root element
 * rather than inventing global `window.lenis` assumptions. Fully reversible without reload.
 */
export function createLenisAdapter(doc: Document = document): ScrollLibraryAdapter {
  let addedAttribute = false;

  return {
    id: 'lenis',
    name: 'Lenis',
    supportedVersions: '1.x (verified on 1.3.29)',

    detect(): AdapterActionResult {
      if (!hasLenisDomMarkers(doc)) {
        return { status: 'not_detected', detail: 'No Lenis DOM markers found.' };
      }
      if (doc.documentElement?.classList.contains('lenis-smooth')) {
        return { status: 'detected', detail: 'Detected active Lenis smooth scroll (html.lenis-smooth).' };
      }
      return { status: 'detected', detail: 'Detected Lenis DOM markers (html.lenis).' };
    },

    activate(): AdapterActionResult {
      const root = doc.documentElement;
      if (!root || !hasLenisDomMarkers(doc)) {
        return { status: 'not_detected', detail: 'Lenis not detected.' };
      }
      if (!root.hasAttribute(PREVENT_WHEEL_ATTR)) {
        root.setAttribute(PREVENT_WHEEL_ATTR, '');
        addedAttribute = true;
      }
      return {
        status: 'active',
        detail: 'Neutralized Lenis wheel interception via reversible data-lenis-prevent-wheel.',
        requiresReload: false,
      };
    },

    deactivate(): AdapterActionResult {
      if (addedAttribute && doc.documentElement) {
        doc.documentElement.removeAttribute(PREVENT_WHEEL_ATTR);
        addedAttribute = false;
      }
      return {
        status: hasLenisDomMarkers(doc) ? 'detected' : 'not_detected',
        detail: 'Restored original Lenis wheel behavior.',
        requiresReload: false,
      };
    },
  };
}
