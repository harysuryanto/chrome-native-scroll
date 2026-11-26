export const CSS_OVERRIDE_ID = 'nativescroll-css-override';
export const CSS_OVERRIDE_ATTR = 'data-nativescroll';
export const CSS_OVERRIDE_RULE = ':root, html, body, * { scroll-behavior: auto !important; }';

export interface CssOverrideDocument {
  readonly head: { appendChild(node: unknown): unknown } | null;
  readonly documentElement: { appendChild(node: unknown): unknown } | null;
  getElementById(id: string): { remove(): void; isConnected?: boolean } | null;
  createElement(tagName: 'style'): {
    id: string;
    textContent: string | null;
    setAttribute(name: string, value: string): void;
    remove(): void;
    isConnected?: boolean;
  };
  addEventListener(type: string, listener: () => void): void;
  removeEventListener(type: string, listener: () => void): void;
}

export interface CssOverrideController {
  apply(): boolean;
  remove(): void;
  isActive(): boolean;
}

export function createCssOverrideController(
  doc: CssOverrideDocument = document,
): CssOverrideController {
  let pendingListener: (() => void) | null = null;
  let styleEl: ReturnType<CssOverrideDocument['createElement']> | null = null;

  function clearPending(): void {
    if (pendingListener) {
      doc.removeEventListener('readystatechange', pendingListener);
      pendingListener = null;
    }
  }

  function attachNow(): boolean {
    const existing = doc.getElementById(CSS_OVERRIDE_ID);
    if (existing) {
      clearPending();
      return true;
    }

    const parent = doc.head ?? doc.documentElement;
    if (!parent) return false;

    const el = doc.createElement('style');
    el.id = CSS_OVERRIDE_ID;
    el.setAttribute(CSS_OVERRIDE_ATTR, 'css-override');
    el.textContent = CSS_OVERRIDE_RULE;
    parent.appendChild(el);
    styleEl = el;
    clearPending();
    return true;
  }

  return {
    apply(): boolean {
      if (attachNow()) return true;
      if (!pendingListener) {
        pendingListener = () => {
          attachNow();
        };
        doc.addEventListener('readystatechange', pendingListener);
      }
      return false;
    },

    remove(): void {
      clearPending();
      const existing = doc.getElementById(CSS_OVERRIDE_ID);
      if (existing) {
        existing.remove();
      } else if (styleEl) {
        styleEl.remove();
      }
      styleEl = null;
    },

    isActive(): boolean {
      return doc.getElementById(CSS_OVERRIDE_ID) !== null;
    },
  };
}
