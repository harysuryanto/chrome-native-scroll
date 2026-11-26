import type { AdapterActionResult, ScrollLibraryAdapter } from './types';

interface ScrollSmootherInstance {
  smooth(value?: number): number;
  kill?: () => void;
}

interface ScrollSmootherStatic {
  get?: () => ScrollSmootherInstance | undefined | null;
}

interface WindowWithGsap extends Window {
  ScrollSmoother?: ScrollSmootherStatic;
  gsap?: { core?: { globals?: () => Record<string, unknown> } };
}

function findScrollSmoother(win: WindowWithGsap): ScrollSmootherInstance | null {
  const direct = win.ScrollSmoother?.get?.();
  if (direct && typeof direct.smooth === 'function') return direct;

  const fromGsap = win.gsap?.core?.globals?.().ScrollSmoother as ScrollSmootherStatic | undefined;
  const instance = fromGsap?.get?.();
  if (instance && typeof instance.smooth === 'function') return instance;

  return null;
}

function hasScrollSmootherDom(doc: Document): boolean {
  return Boolean(doc.getElementById('smooth-wrapper') && doc.getElementById('smooth-content'));
}

/**
 * GSAP ScrollSmoother adapter (verified on GSAP 3.15.1).
 * Uses the verified public API `ScrollSmoother.get().smooth(0)` to disable smoothing
 * reversibly without killing ScrollTrigger or unrelated GSAP animations.
 */
export function createGsapScrollSmootherAdapter(
  win: Window = window,
  doc: Document = document,
): ScrollLibraryAdapter {
  let savedSmooth: number | null = null;
  let activeInstance: ScrollSmootherInstance | null = null;

  return {
    id: 'gsap-scrollsmoother',
    name: 'GSAP ScrollSmoother',
    supportedVersions: '3.x (verified on 3.15.1)',

    detect(): AdapterActionResult {
      const instance = findScrollSmoother(win as WindowWithGsap);
      if (instance) {
        return {
          status: 'detected',
          detail: 'Detected reachable GSAP ScrollSmoother instance via ScrollSmoother.get().',
        };
      }
      if (hasScrollSmootherDom(doc)) {
        return {
          status: 'unsupported',
          detail:
            'Detected #smooth-wrapper/#smooth-content DOM, but ScrollSmoother.get() is not reachable.',
        };
      }
      return { status: 'not_detected', detail: 'No GSAP ScrollSmoother instance detected.' };
    },

    activate(): AdapterActionResult {
      const instance = findScrollSmoother(win as WindowWithGsap);
      if (!instance) {
        return hasScrollSmootherDom(doc)
          ? { status: 'unsupported', detail: 'ScrollSmoother instance is not reachable.' }
          : { status: 'not_detected', detail: 'ScrollSmoother not detected.' };
      }

      if (savedSmooth === null) {
        savedSmooth = instance.smooth();
      }
      instance.smooth(0);
      activeInstance = instance;

      return {
        status: 'active',
        detail: `Set ScrollSmoother.smooth(0) (saved original smooth=${savedSmooth}).`,
        requiresReload: false,
      };
    },

    deactivate(): AdapterActionResult {
      if (activeInstance && savedSmooth !== null) {
        activeInstance.smooth(savedSmooth);
        savedSmooth = null;
        activeInstance = null;
      }
      return {
        status: findScrollSmoother(win as WindowWithGsap) ? 'detected' : 'not_detected',
        detail: 'Restored original ScrollSmoother smooth duration.',
        requiresReload: false,
      };
    },
  };
}
