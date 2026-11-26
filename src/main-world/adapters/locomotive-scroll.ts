import type { AdapterActionResult, ScrollLibraryAdapter } from './types';

const PREVENT_WHEEL_ATTR = 'data-lenis-prevent-wheel';

function isLegacyV4TransformDom(doc: Document): boolean {
  const root = doc.documentElement;
  return Boolean(
    root?.classList.contains('has-scroll-smooth') && doc.querySelector('[data-scroll-container]'),
  );
}

function isModernV5Dom(doc: Document): boolean {
  const root = doc.documentElement;
  return Boolean(
    root?.classList.contains('lenis') && doc.querySelector('[data-scroll], [data-scroll-section]'),
  );
}

/**
 * Version-aware Locomotive Scroll adapter.
 * - v5 (Lenis-backed native scroll): safely neutralized via reversible `data-lenis-prevent-wheel`.
 * - Legacy v4 (CSS transform virtual scroll): safely reports `unsupported` when no reachable
 *   instance is exposed, avoiding frozen scroll containers.
 */
export function createLocomotiveScrollAdapter(doc: Document = document): ScrollLibraryAdapter {
  let addedAttribute = false;

  return {
    id: 'locomotive-scroll',
    name: 'Locomotive Scroll',
    supportedVersions: '5.x (verified on 5.1.1); 4.x transform mode safely unsupported',

    detect(): AdapterActionResult {
      if (isLegacyV4TransformDom(doc)) {
        return {
          status: 'unsupported',
          detail:
            'Detected legacy Locomotive Scroll v4 transform container (html.has-scroll-smooth); degrading safely without mutating transforms.',
        };
      }
      if (isModernV5Dom(doc)) {
        return {
          status: 'detected',
          detail: 'Detected Locomotive Scroll v5 (Lenis-backed native scroll).',
        };
      }
      return { status: 'not_detected', detail: 'No Locomotive Scroll markers found.' };
    },

    activate(): AdapterActionResult {
      if (isLegacyV4TransformDom(doc)) {
        return {
          status: 'unsupported',
          detail: 'Legacy Locomotive Scroll v4 transform mode is not safely reversible.',
        };
      }
      const root = doc.documentElement;
      if (!root || !isModernV5Dom(doc)) {
        return { status: 'not_detected', detail: 'Locomotive Scroll not detected.' };
      }
      if (!root.hasAttribute(PREVENT_WHEEL_ATTR)) {
        root.setAttribute(PREVENT_WHEEL_ATTR, '');
        addedAttribute = true;
      }
      return {
        status: 'active',
        detail: 'Neutralized Locomotive Scroll v5 wheel smoothing via data-lenis-prevent-wheel.',
        requiresReload: false,
      };
    },

    deactivate(): AdapterActionResult {
      if (addedAttribute && doc.documentElement) {
        doc.documentElement.removeAttribute(PREVENT_WHEEL_ATTR);
        addedAttribute = false;
      }
      return {
        status: isModernV5Dom(doc) ? 'detected' : 'not_detected',
        detail: 'Restored original Locomotive Scroll v5 behavior.',
        requiresReload: false,
      };
    },
  };
}
