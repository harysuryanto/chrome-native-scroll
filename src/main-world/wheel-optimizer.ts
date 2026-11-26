export interface WheelOptimizerStatus {
  readonly strictActive: boolean;
  readonly nonPassiveRootListeners: number;
  readonly guardedListeners: number;
  readonly skippedHijackEvents: number;
  readonly unhandledPreventedEvents: number;
  readonly avgOverheadMs: number;
}

const INTERACTIVE_SELECTOR = [
  'canvas',
  'textarea',
  '[contenteditable=""]',
  '[contenteditable="true"]',
  '[role="application"]',
  '.leaflet-container',
  '.mapboxgl-canvas',
  '.gm-style',
  '.monaco-editor',
  '.CodeMirror',
  '.cm-editor',
].join(',');

export function isInteractiveOrNestedScrollTarget(target: EventTarget | null): boolean {
  if (!target || typeof target !== 'object') return false;
  const el = target as Partial<Element> & { parentElement?: Element | null };
  if (typeof el.closest === 'function' && el.closest(INTERACTIVE_SELECTOR)) {
    return true;
  }

  // Check if target sits inside a nested scrollable container (not root/body).
  let current: Element | null =
    typeof el.nodeType === 'number' && el.nodeType === 1 ? (el as Element) : (el.parentElement ?? null);
  const root = typeof document !== 'undefined' ? document.documentElement : null;
  const body = typeof document !== 'undefined' ? document.body : null;

  let depth = 0;
  while (current && current !== root && current !== body && depth < 12) {
    depth += 1;
    if (
      typeof getComputedStyle === 'function' &&
      current.scrollHeight > current.clientHeight + 1
    ) {
      const overflowY = getComputedStyle(current).overflowY;
      if (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') {
        return true;
      }
    }
    current = current.parentElement;
  }
  return false;
}

export function shouldPreserveWheelEvent(event: {
  ctrlKey?: boolean;
  shiftKey?: boolean;
  deltaX?: number;
  deltaY?: number;
  target?: EventTarget | null;
}): boolean {
  if (event.ctrlKey || event.shiftKey) return true;
  const dx = Math.abs(event.deltaX ?? 0);
  const dy = Math.abs(event.deltaY ?? 0);
  if (dx > dy) return true;
  return isInteractiveOrNestedScrollTarget(event.target ?? null);
}

function isExplicitlyNonPassive(options: boolean | AddEventListenerOptions | undefined): boolean {
  return typeof options === 'object' && options !== null && options.passive === false;
}

function isRootTarget(target: unknown): boolean {
  if (typeof window !== 'undefined' && target === window) return true;
  if (typeof document !== 'undefined') {
    if (target === document || target === document.documentElement || target === document.body) {
      return true;
    }
  }
  return false;
}

export interface WheelOptimizerController {
  installObserver(): void;
  setStrict(enabled: boolean): void;
  setOnUnhandledPrevented(callback: (() => void) | null): void;
  resetUnhandledPrevented(): void;
  getStatus(): WheelOptimizerStatus;
  uninstall(): void;
}

export function createWheelOptimizer(
  eventTargetProto: {
    addEventListener: EventTarget['addEventListener'];
    removeEventListener: EventTarget['removeEventListener'];
  } = EventTarget.prototype,
  rootChecker: (target: unknown) => boolean = isRootTarget,
): WheelOptimizerController {
  let installed = false;
  let strictActive = false;
  let nonPassiveRootListeners = 0;
  let guardedListeners = 0;
  let skippedHijackEvents = 0;
  let unhandledPreventedEvents = 0;
  let totalOverheadMs = 0;
  let measuredEvents = 0;
  let onUnhandledPrevented: (() => void) | null = null;

  const originalAdd = eventTargetProto.addEventListener;
  const originalRemove = eventTargetProto.removeEventListener;
  const wrapperMap = new WeakMap<EventListenerOrEventListenerObject, EventListener>();

  function invokeOriginalListener(
    listener: EventListenerOrEventListenerObject,
    thisArg: unknown,
    event: Event,
  ): void {
    if (typeof listener === 'function') {
      listener.call(thisArg, event);
    } else if (typeof listener.handleEvent === 'function') {
      listener.handleEvent(event);
    }
  }

  function wrappedAdd(
    this: EventTarget,
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | AddEventListenerOptions,
  ): void {
    if (
      listener &&
      (type === 'wheel' || type === 'mousewheel') &&
      rootChecker(this) &&
      isExplicitlyNonPassive(options)
    ) {
      nonPassiveRootListeners += 1;
      let guarded = wrapperMap.get(listener);
      if (!guarded) {
        guarded = function (this: unknown, event: Event): void {
          if (!strictActive) {
            invokeOriginalListener(listener, this, event);
            if (event.defaultPrevented && !shouldPreserveWheelEvent(event as WheelEvent)) {
              unhandledPreventedEvents += 1;
              onUnhandledPrevented?.();
            }
            return;
          }
          const t0 = typeof performance !== 'undefined' ? performance.now() : 0;
          const preserve = shouldPreserveWheelEvent(event as WheelEvent);
          const t1 = typeof performance !== 'undefined' ? performance.now() : 0;
          totalOverheadMs += Math.max(0, t1 - t0);
          measuredEvents += 1;

          if (preserve) {
            invokeOriginalListener(listener, this, event);
          } else {
            skippedHijackEvents += 1;
          }
        };
        wrapperMap.set(listener, guarded);
        guardedListeners += 1;
      }
      originalAdd.call(this, type, guarded, options);
      return;
    }

    originalAdd.call(this, type, listener, options);
  }

  function wrappedRemove(
    this: EventTarget,
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | EventListenerOptions,
  ): void {
    if (listener && (type === 'wheel' || type === 'mousewheel')) {
      const guarded = wrapperMap.get(listener);
      if (guarded) {
        originalRemove.call(this, type, guarded, options);
        return;
      }
    }
    originalRemove.call(this, type, listener, options);
  }

  return {
    installObserver(): void {
      if (installed) return;
      installed = true;
      eventTargetProto.addEventListener = wrappedAdd as EventTarget['addEventListener'];
      eventTargetProto.removeEventListener = wrappedRemove as EventTarget['removeEventListener'];
    },

    setStrict(enabled: boolean): void {
      strictActive = enabled;
    },

    setOnUnhandledPrevented(callback: (() => void) | null): void {
      onUnhandledPrevented = callback;
    },

    resetUnhandledPrevented(): void {
      unhandledPreventedEvents = 0;
    },

    getStatus(): WheelOptimizerStatus {
      return {
        strictActive,
        nonPassiveRootListeners,
        guardedListeners,
        skippedHijackEvents,
        unhandledPreventedEvents,
        avgOverheadMs: measuredEvents > 0 ? totalOverheadMs / measuredEvents : 0,
      };
    },

    uninstall(): void {
      strictActive = false;
      if (!installed) return;
      if (eventTargetProto.addEventListener === wrappedAdd) {
        eventTargetProto.addEventListener = originalAdd;
      }
      if (eventTargetProto.removeEventListener === wrappedRemove) {
        eventTargetProto.removeEventListener = originalRemove;
      }
      installed = false;
    },
  };
}
