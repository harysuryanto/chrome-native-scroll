export type ScrollApiMethodName = 'scrollTo' | 'scroll' | 'scrollBy' | 'scrollIntoView';

export interface ScrollApiPatchTarget {
  windowObj: Record<string, unknown>;
  elementProto: Record<string, unknown> | null;
}

export interface ScrollApiPatchStatus {
  readonly state: 'inactive' | 'active' | 'partial' | 'failed';
  readonly patchedCount: number;
  readonly failedMethods: readonly string[];
  readonly neutralizedCalls: number;
}

type AnyFn = (this: unknown, ...args: unknown[]) => unknown;

interface PatchRecord {
  readonly label: string;
  readonly target: Record<string, unknown>;
  readonly key: ScrollApiMethodName;
  readonly original: AnyFn;
  readonly wrapper: AnyFn;
}

function isPlainScrollOptions(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Rewrites explicitly smooth scroll options to `{ ...options, behavior: 'auto' }`
 * without mutating the caller's input object. Numeric overloads, boolean
 * scrollIntoView arguments, and non-smooth option objects are returned unchanged.
 */
export function normalizeScrollArgs(
  args: readonly unknown[],
  isScrollIntoView: boolean,
): { args: readonly unknown[]; rewritten: boolean } {
  if (args.length === 0) return { args, rewritten: false };
  // Numeric overloads: scrollTo(x, y) / scrollBy(x, y) always have 2+ args or non-object first arg.
  if (!isScrollIntoView && args.length > 1) return { args, rewritten: false };

  const first = args[0];
  if (!isPlainScrollOptions(first)) return { args, rewritten: false };

  if (first.behavior !== 'smooth') return { args, rewritten: false };

  // Shallow-copy own enumerable properties + preserve inherited standard scroll option keys.
  const cloned: Record<string, unknown> = { ...first };
  const keys = isScrollIntoView ? ['block', 'inline'] : ['top', 'left'];
  for (const key of keys) {
    if (!(key in cloned) && first[key] !== undefined) {
      cloned[key] = first[key];
    }
  }
  cloned.behavior = 'auto';

  return { args: [cloned], rewritten: true };
}

export interface ScrollApiPatchController {
  enable(): ScrollApiPatchStatus;
  disable(): ScrollApiPatchStatus;
  getStatus(): ScrollApiPatchStatus;
}

export function createScrollApiPatchController(
  targets: ScrollApiPatchTarget = {
    windowObj: window as unknown as Record<string, unknown>,
    elementProto:
      typeof Element !== 'undefined'
        ? (Element.prototype as unknown as Record<string, unknown>)
        : null,
  },
): ScrollApiPatchController {
  let active = false;
  let installed = false;
  let neutralizedCalls = 0;
  const records: PatchRecord[] = [];
  const failedMethods: string[] = [];

  function installMethod(
    label: string,
    target: Record<string, unknown>,
    key: ScrollApiMethodName,
    isScrollIntoView: boolean,
  ): void {
    const existing = target[key];
    if (typeof existing !== 'function') return;

    const original = existing as AnyFn;
    const wrapper: AnyFn = function (this: unknown, ...args: unknown[]): unknown {
      if (!active) {
        return original.apply(this, args);
      }
      const normalized = normalizeScrollArgs(args, isScrollIntoView);
      if (normalized.rewritten) {
        neutralizedCalls += 1;
      }
      return original.apply(this, normalized.args as unknown[]);
    };

    try {
      Object.defineProperty(wrapper, 'name', { value: original.name, configurable: true });
      Object.defineProperty(wrapper, 'length', { value: original.length, configurable: true });
    } catch {
      // Non-fatal: function metadata preservation is best-effort.
    }

    try {
      const descriptor = Object.getOwnPropertyDescriptor(target, key);
      if (descriptor && descriptor.writable === false && descriptor.configurable === false) {
        failedMethods.push(label);
        return;
      }
      target[key] = wrapper;
      if (target[key] !== wrapper) {
        failedMethods.push(label);
        return;
      }
      records.push({ label, target, key, original, wrapper });
    } catch {
      failedMethods.push(label);
    }
  }

  function installAll(): void {
    if (installed) return;
    installed = true;
    failedMethods.length = 0;

    installMethod('window.scrollTo', targets.windowObj, 'scrollTo', false);
    installMethod('window.scroll', targets.windowObj, 'scroll', false);
    installMethod('window.scrollBy', targets.windowObj, 'scrollBy', false);

    if (targets.elementProto) {
      installMethod('Element.prototype.scrollTo', targets.elementProto, 'scrollTo', false);
      installMethod('Element.prototype.scroll', targets.elementProto, 'scroll', false);
      installMethod('Element.prototype.scrollBy', targets.elementProto, 'scrollBy', false);
      installMethod(
        'Element.prototype.scrollIntoView',
        targets.elementProto,
        'scrollIntoView',
        true,
      );
    }
  }

  function restoreIfUnwrapped(): void {
    // Restore original functions directly when our wrapper is still the active property.
    // If third-party code wrapped our shim afterward, leave the property intact and rely on
    // `active = false` pass-through so we never break downstream wrappers or stack shims.
    let allRestored = true;
    for (const rec of records) {
      if (rec.target[rec.key] === rec.wrapper) {
        try {
          rec.target[rec.key] = rec.original;
        } catch {
          allRestored = false;
        }
      } else {
        allRestored = false;
      }
    }
    if (allRestored) {
      records.length = 0;
      installed = false;
    }
  }

  function getStatus(): ScrollApiPatchStatus {
    if (!active) {
      return {
        state: 'inactive',
        patchedCount: 0,
        failedMethods: [...failedMethods],
        neutralizedCalls,
      };
    }
    if (records.length === 0) {
      return {
        state: 'failed',
        patchedCount: 0,
        failedMethods: [...failedMethods],
        neutralizedCalls,
      };
    }
    return {
      state: failedMethods.length > 0 ? 'partial' : 'active',
      patchedCount: records.length,
      failedMethods: [...failedMethods],
      neutralizedCalls,
    };
  }

  return {
    enable(): ScrollApiPatchStatus {
      installAll();
      active = true;
      return getStatus();
    },

    disable(): ScrollApiPatchStatus {
      active = false;
      restoreIfUnwrapped();
      return getStatus();
    },

    getStatus,
  };
}
