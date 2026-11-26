import { describe, expect, it } from 'vitest';
import {
  CSS_OVERRIDE_ATTR,
  CSS_OVERRIDE_ID,
  CSS_OVERRIDE_RULE,
  createCssOverrideController,
  type CssOverrideDocument,
} from '../src/content/css-override';

interface MockStyleElement {
  id: string;
  textContent: string | null;
  attributes: Record<string, string>;
  setAttribute(name: string, value: string): void;
  remove(): void;
}

function createMockDocument(opts: { hasHead?: boolean; hasRoot?: boolean } = {}) {
  const { hasHead = true, hasRoot = true } = opts;
  const nodes: MockStyleElement[] = [];
  const listeners = new Map<string, Set<() => void>>();

  const makeContainer = () => ({
    appendChild(node: unknown) {
      nodes.push(node as MockStyleElement);
      return node;
    },
  });

  const doc: CssOverrideDocument & {
    _head: ReturnType<typeof makeContainer> | null;
    _root: ReturnType<typeof makeContainer> | null;
    _nodes: MockStyleElement[];
    triggerReadyStateChange(): void;
  } = {
    _head: hasHead ? makeContainer() : null,
    _root: hasRoot ? makeContainer() : null,
    _nodes: nodes,
    get head() {
      return this._head;
    },
    get documentElement() {
      return this._root;
    },
    getElementById(id: string) {
      return nodes.find((n) => n.id === id) ?? null;
    },
    createElement() {
      const el: MockStyleElement = {
        id: '',
        textContent: null,
        attributes: {},
        setAttribute(name: string, value: string) {
          this.attributes[name] = value;
        },
        remove() {
          const idx = nodes.indexOf(el);
          if (idx !== -1) nodes.splice(idx, 1);
        },
      };
      return el;
    },
    addEventListener(type: string, listener: () => void) {
      const set = listeners.get(type) ?? new Set();
      set.add(listener);
      listeners.set(type, set);
    },
    removeEventListener(type: string, listener: () => void) {
      listeners.get(type)?.delete(listener);
    },
    triggerReadyStateChange() {
      for (const listener of [...(listeners.get('readystatechange') ?? [])]) {
        listener();
      }
    },
  };

  return doc;
}

describe('CSS smooth-scroll override controller', () => {
  it('injects a single scoped scroll-behavior rule without altering other properties', () => {
    const doc = createMockDocument();
    const controller = createCssOverrideController(doc);

    expect(controller.isActive()).toBe(false);
    expect(controller.apply()).toBe(true);
    expect(controller.isActive()).toBe(true);
    expect(doc._nodes).toHaveLength(1);

    const style = doc._nodes[0]!;
    expect(style.id).toBe(CSS_OVERRIDE_ID);
    expect(style.attributes[CSS_OVERRIDE_ATTR]).toBe('css-override');
    expect(style.textContent).toBe(CSS_OVERRIDE_RULE);
    expect(style.textContent).toContain('scroll-behavior: auto !important');
    expect(style.textContent).not.toContain('overflow');
    expect(style.textContent).not.toContain('transform');
  });

  it('is idempotent across repeated apply() calls and cleanly reversible on remove()', () => {
    const doc = createMockDocument();
    const controller = createCssOverrideController(doc);

    controller.apply();
    controller.apply();
    controller.apply();
    expect(doc._nodes).toHaveLength(1);

    controller.remove();
    expect(controller.isActive()).toBe(false);
    expect(doc._nodes).toHaveLength(0);

    // Safe to call remove() again when already removed.
    controller.remove();
    expect(controller.isActive()).toBe(false);
  });

  it('falls back to documentElement at document_start when head is not yet present', () => {
    const doc = createMockDocument({ hasHead: false, hasRoot: true });
    const controller = createCssOverrideController(doc);

    expect(controller.apply()).toBe(true);
    expect(controller.isActive()).toBe(true);
    expect(doc._nodes).toHaveLength(1);
  });

  it('defers injection until documentElement exists and cancels pending listener on remove()', () => {
    const doc = createMockDocument({ hasHead: false, hasRoot: false });
    const controller = createCssOverrideController(doc);

    expect(controller.apply()).toBe(false);
    expect(controller.isActive()).toBe(false);

    // Removing before documentElement arrives cancels deferred injection.
    controller.remove();
    doc._root = {
      appendChild(node: unknown) {
        doc._nodes.push(node as MockStyleElement);
        return node;
      },
    };
    doc.triggerReadyStateChange();
    expect(controller.isActive()).toBe(false);

    // Applying again injects immediately now that documentElement exists.
    expect(controller.apply()).toBe(true);
    expect(controller.isActive()).toBe(true);
  });
});
