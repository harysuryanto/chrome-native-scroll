import { describe, expect, it, vi } from 'vitest';
import {
  createWheelOptimizer,
  shouldPreserveWheelEvent,
} from '../src/main-world/wheel-optimizer';

describe('wheel-listener optimizer', () => {
  it('preserves Ctrl+wheel zoom, Shift+wheel, and horizontal wheel gestures', () => {
    expect(shouldPreserveWheelEvent({ ctrlKey: true, deltaY: 100, deltaX: 0 })).toBe(true);
    expect(shouldPreserveWheelEvent({ shiftKey: true, deltaY: 100, deltaX: 0 })).toBe(true);
    expect(shouldPreserveWheelEvent({ deltaX: 120, deltaY: 10 })).toBe(true);
    expect(shouldPreserveWheelEvent({ deltaX: 0, deltaY: 100, target: null })).toBe(false);
  });

  it('preserves interactive widget targets such as canvas and editors', () => {
    const fakeCanvas = {
      closest: (selector: string) => (selector.includes('canvas') ? {} : null),
    } as unknown as EventTarget;
    expect(shouldPreserveWheelEvent({ deltaY: 100, target: fakeCanvas })).toBe(true);
  });

  it('passes all events through when Strict mode is off and guards vertical root hijackers when Strict is on', () => {
    const listeners = new Map<string, Set<EventListener>>();
    const proto = {
      addEventListener(
        this: EventTarget,
        type: string,
        listener: EventListenerOrEventListenerObject | null,
      ) {
        if (!listener) return;
        const set = listeners.get(type) ?? new Set();
        set.add(listener as EventListener);
        listeners.set(type, set);
      },
      removeEventListener(
        this: EventTarget,
        type: string,
        listener: EventListenerOrEventListenerObject | null,
      ) {
        if (!listener) return;
        listeners.get(type)?.delete(listener as EventListener);
      },
    };

    const fakeRoot = {} as EventTarget;
    const optimizer = createWheelOptimizer(proto, (t) => t === fakeRoot);
    optimizer.installObserver();

    const hijackHandler = vi.fn();
    proto.addEventListener.call(fakeRoot, 'wheel', hijackHandler, { passive: false });
    expect(optimizer.getStatus().nonPassiveRootListeners).toBe(1);

    const dispatch = (evt: Record<string, unknown>) => {
      for (const fn of listeners.get('wheel') ?? []) {
        fn.call(fakeRoot, evt as unknown as Event);
      }
    };

    // Native/default mode: handler runs normally.
    dispatch({ deltaX: 0, deltaY: 100, ctrlKey: false, shiftKey: false, target: null });
    expect(hijackHandler).toHaveBeenCalledTimes(1);

    // Strict mode: plain vertical root wheel is skipped; Ctrl+wheel still runs.
    optimizer.setStrict(true);
    dispatch({ deltaX: 0, deltaY: 100, ctrlKey: false, shiftKey: false, target: null });
    expect(hijackHandler).toHaveBeenCalledTimes(1);
    expect(optimizer.getStatus().skippedHijackEvents).toBe(1);

    dispatch({ deltaX: 0, deltaY: 100, ctrlKey: true, shiftKey: false, target: null });
    expect(hijackHandler).toHaveBeenCalledTimes(2);

    // removeEventListener cleanly removes the wrapped listener.
    proto.removeEventListener.call(fakeRoot, 'wheel', hijackHandler, { passive: false });
    expect(listeners.get('wheel')?.size).toBe(0);

    // Per-wheel overhead stays well under 0.1ms.
    expect(optimizer.getStatus().avgOverheadMs).toBeLessThan(0.1);

    optimizer.uninstall();
  });
});
