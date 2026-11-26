import { describe, expect, it, vi } from 'vitest';
import {
  createScrollApiPatchController,
  normalizeScrollArgs,
} from '../src/main-world/scroll-api-patch';
import { isMainWorldConfig } from '../src/shared/bridge';

describe('normalizeScrollArgs', () => {
  it('rewrites behavior: "smooth" to "auto" without mutating caller options', () => {
    const input = { top: 400, left: 10, behavior: 'smooth' as const };
    const result = normalizeScrollArgs([input], false);
    expect(result.rewritten).toBe(true);
    expect(result.args).toEqual([{ top: 400, left: 10, behavior: 'auto' }]);
    expect(input.behavior).toBe('smooth');
  });

  it('preserves numeric overloads and non-smooth option objects unchanged', () => {
    expect(normalizeScrollArgs([0, 500], false)).toEqual({ args: [0, 500], rewritten: false });
    const instant = { top: 200, behavior: 'instant' };
    expect(normalizeScrollArgs([instant], false)).toEqual({ args: [instant], rewritten: false });
    const auto = { top: 200 };
    expect(normalizeScrollArgs([auto], false)).toEqual({ args: [auto], rewritten: false });
  });

  it('handles scrollIntoView boolean, empty, and object overloads', () => {
    expect(normalizeScrollArgs([], true)).toEqual({ args: [], rewritten: false });
    expect(normalizeScrollArgs([true], true)).toEqual({ args: [true], rewritten: false });
    expect(normalizeScrollArgs([false], true)).toEqual({ args: [false], rewritten: false });
    const opts = { behavior: 'smooth', block: 'center', inline: 'nearest' };
    const res = normalizeScrollArgs([opts], true);
    expect(res.rewritten).toBe(true);
    expect(res.args).toEqual([{ behavior: 'auto', block: 'center', inline: 'nearest' }]);
    expect(opts.behavior).toBe('smooth');
  });
});

describe('createScrollApiPatchController', () => {
  function createTargets() {
    const winScrollTo = vi.fn(function (this: unknown, ...args: unknown[]) {
      return { receiver: this, args };
    });
    const winScroll = vi.fn();
    const winScrollBy = vi.fn();
    const elScrollTo = vi.fn(function (this: unknown, ...args: unknown[]) {
      return { receiver: this, args };
    });
    const elScroll = vi.fn();
    const elScrollBy = vi.fn();
    const elScrollIntoView = vi.fn(function (this: unknown, ...args: unknown[]) {
      return { receiver: this, args };
    });

    const windowObj: Record<string, unknown> = {
      scrollTo: winScrollTo,
      scroll: winScroll,
      scrollBy: winScrollBy,
    };
    const elementProto: Record<string, unknown> = {
      scrollTo: elScrollTo,
      scroll: elScroll,
      scrollBy: elScrollBy,
      scrollIntoView: elScrollIntoView,
    };

    return {
      windowObj,
      elementProto,
      originals: {
        winScrollTo,
        winScroll,
        winScrollBy,
        elScrollTo,
        elScroll,
        elScrollBy,
        elScrollIntoView,
      },
    };
  }

  it('rewrites smooth calls on window and Element.prototype while preserving this and return values', () => {
    const { windowObj, elementProto, originals } = createTargets();
    const controller = createScrollApiPatchController({ windowObj, elementProto });

    const status = controller.enable();
    expect(status.state).toBe('active');
    expect(status.patchedCount).toBe(7);

    const ret = (windowObj.scrollTo as (...a: unknown[]) => unknown).call(windowObj, {
      top: 300,
      behavior: 'smooth',
    });
    expect(ret).toEqual({ receiver: windowObj, args: [{ top: 300, behavior: 'auto' }] });
    expect(originals.winScrollTo).toHaveBeenCalledTimes(1);

    const fakeEl = { tagName: 'DIV' };
    const elRet = (elementProto.scrollIntoView as (...a: unknown[]) => unknown).call(fakeEl, {
      behavior: 'smooth',
      block: 'start',
    });
    expect(elRet).toEqual({
      receiver: fakeEl,
      args: [{ behavior: 'auto', block: 'start' }],
    });
    expect(controller.getStatus().neutralizedCalls).toBe(2);
  });

  it('is idempotent on repeated enable/disable and restores original functions', () => {
    const { windowObj, elementProto, originals } = createTargets();
    const controller = createScrollApiPatchController({ windowObj, elementProto });

    controller.enable();
    const firstWrapper = windowObj.scrollTo;
    controller.enable();
    expect(windowObj.scrollTo).toBe(firstWrapper);

    controller.disable();
    expect(windowObj.scrollTo).toBe(originals.winScrollTo);
    expect(elementProto.scrollIntoView).toBe(originals.elScrollIntoView);
    expect(controller.getStatus().state).toBe('inactive');

    // Calling after disable passes smooth through unchanged.
    (windowObj.scrollTo as (...a: unknown[]) => unknown)({ top: 100, behavior: 'smooth' });
    expect(originals.winScrollTo).toHaveBeenLastCalledWith({ top: 100, behavior: 'smooth' });
  });

  it('passes through cleanly when disabled even if third-party code wrapped our shim', () => {
    const { windowObj, elementProto, originals } = createTargets();
    const controller = createScrollApiPatchController({ windowObj, elementProto });

    controller.enable();
    const ourWrapper = windowObj.scrollTo as (...a: unknown[]) => unknown;
    const thirdPartyWrapper = vi.fn((...args: unknown[]) => ourWrapper(...args));
    windowObj.scrollTo = thirdPartyWrapper;

    controller.disable();
    // Third-party wrapper stays intact, and our inner shim passes through unchanged.
    expect(windowObj.scrollTo).toBe(thirdPartyWrapper);
    (windowObj.scrollTo as (...a: unknown[]) => unknown)({ top: 50, behavior: 'smooth' });
    expect(originals.winScrollTo).toHaveBeenLastCalledWith({ top: 50, behavior: 'smooth' });
  });

  it('reports partial status safely when a property is non-writable/non-configurable', () => {
    const { windowObj, elementProto } = createTargets();
    Object.defineProperty(windowObj, 'scrollBy', {
      value: windowObj.scrollBy,
      writable: false,
      configurable: false,
    });
    const controller = createScrollApiPatchController({ windowObj, elementProto });
    const status = controller.enable();
    expect(status.state).toBe('partial');
    expect(status.failedMethods).toEqual(['window.scrollBy']);
    expect(status.patchedCount).toBe(6);
  });

  it('validates MainWorldConfig payloads strictly', () => {
    expect(
      isMainWorldConfig({
        active: true,
        smoothScrollApis: true,
        wheelOptimization: false,
        libraryAdapters: false,
        mode: 'native',
      }),
    ).toBe(true);
    expect(isMainWorldConfig({ active: 'yes' })).toBe(false);
    expect(isMainWorldConfig(null)).toBe(false);
  });
});
