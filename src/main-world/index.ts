import {
  CONFIG_EVENT,
  DIAGNOSTICS_REPORT_EVENT,
  DIAGNOSTICS_REQUEST_EVENT,
  DIAGNOSTIC_PING_EVENT,
  MAIN_READY_EVENT,
  MAIN_WORLD_READY_EVENT,
  isMainWorldConfig,
  type MainWorldConfig,
} from '../shared/bridge';
import type { ResolvedAutoMode } from '../shared/diagnostics';
import { createGsapScrollSmootherAdapter } from './adapters/gsap-scrollsmoother';
import { createLenisAdapter } from './adapters/lenis';
import { createLocomotiveScrollAdapter } from './adapters/locomotive-scroll';
import { createAdapterManager } from './adapters/registry';
import { createScrollApiPatchController } from './scroll-api-patch';
import { createWheelOptimizer } from './wheel-optimizer';

// MAIN-world entry point. Runs in the page JS context with zero privileged extension APIs.
const scrollApiPatch = createScrollApiPatchController();
const wheelOptimizer = createWheelOptimizer();
const adapterManager = createAdapterManager([
  createLenisAdapter(),
  createGsapScrollSmootherAdapter(),
  createLocomotiveScrollAdapter(),
]);

let lastConfig: MainWorldConfig | null = null;
let resolvedAutoMode: ResolvedAutoMode | null = null;

wheelOptimizer.installObserver();
wheelOptimizer.setOnUnhandledPrevented(() => {
  if (lastConfig?.active && lastConfig.mode === 'auto') {
    resolvedAutoMode = 'strict';
    wheelOptimizer.setStrict(true);
  }
});
adapterManager.attachLifecycleListeners();

/**
 * Least-risk Auto mode resolution:
 * 1. If a supported library adapter detects & neutralizes the page -> Compatibility (no Strict needed).
 * 2. Else if an unhandled root non-passive wheel hijacker is detected -> Strict.
 * 3. Otherwise -> Native (lowest risk).
 */
function resolveAndApplyAuto(config: MainWorldConfig): void {
  if (!config.active) {
    resolvedAutoMode = null;
    adapterManager.setEnabled(false);
    wheelOptimizer.setStrict(false);
    return;
  }

  // First try Compatibility (verified library adapters) without enabling Strict.
  adapterManager.setEnabled(true);
  const reports = adapterManager.getReports();
  const adapterHandled = reports.some((r) => r.status === 'active');
  const wheelStatus = wheelOptimizer.getStatus();

  // If a plain vertical wheel event was STILL defaultPrevented despite Compatibility,
  // escalate to Strict so hijacked scrolling is actually neutralized.
  if (wheelStatus.unhandledPreventedEvents > 0) {
    resolvedAutoMode = 'strict';
    wheelOptimizer.setStrict(true);
    return;
  }

  if (adapterHandled) {
    resolvedAutoMode = 'compatibility';
    wheelOptimizer.setStrict(false);
    return;
  }

  // No verified adapter handled the page; escalate to Strict ONLY if a root wheel hijacker exists.
  if (wheelStatus.nonPassiveRootListeners > 0) {
    resolvedAutoMode = 'strict';
    wheelOptimizer.setStrict(true);
    return;
  }

  // Default to lowest-risk Native mode.
  resolvedAutoMode = 'native';
  adapterManager.setEnabled(false);
  wheelOptimizer.setStrict(false);
}

function applyConfig(config: MainWorldConfig): void {
  lastConfig = config;
  if (config.active && config.smoothScrollApis) {
    scrollApiPatch.enable();
  } else {
    scrollApiPatch.disable();
  }

  if (config.mode === 'auto') {
    resolveAndApplyAuto(config);
    return;
  }

  resolvedAutoMode = null;
  const adaptersAllowed =
    config.active &&
    config.libraryAdapters &&
    (config.mode === 'compatibility' || config.mode === 'strict');
  adapterManager.setEnabled(adaptersAllowed);

  wheelOptimizer.setStrict(config.active && config.mode === 'strict' && config.wheelOptimization);
}

// Re-evaluate Auto mode after DOMContentLoaded / load so late-initializing libraries are caught.
const onAutoLifecycle = () => {
  if (lastConfig?.mode === 'auto') {
    resolveAndApplyAuto(lastConfig);
  }
};
document.addEventListener('DOMContentLoaded', onAutoLifecycle, { once: true });
window.addEventListener('load', onAutoLifecycle, { once: true });

document.addEventListener(CONFIG_EVENT, (event: Event) => {
  if (!(event instanceof CustomEvent)) return;
  if (!isMainWorldConfig(event.detail)) return;
  applyConfig(event.detail);
});

document.addEventListener(DIAGNOSTIC_PING_EVENT, () => {
  document.dispatchEvent(new Event(MAIN_WORLD_READY_EVENT));
});

document.addEventListener(DIAGNOSTICS_REQUEST_EVENT, () => {
  if (lastConfig?.mode === 'auto') {
    resolveAndApplyAuto(lastConfig);
  } else {
    adapterManager.refresh();
  }
  const apiStatus = scrollApiPatch.getStatus();
  const wheelStatus = wheelOptimizer.getStatus();
  document.dispatchEvent(
    new CustomEvent(DIAGNOSTICS_REPORT_EVENT, {
      detail: {
        apiPatchState: apiStatus.state,
        neutralizedApiCalls: apiStatus.neutralizedCalls,
        nonPassiveRootWheelListeners: wheelStatus.nonPassiveRootListeners,
        strictWheelActive: wheelStatus.strictActive,
        resolvedAutoMode,
        adapters: adapterManager.getReports().map((r) => ({
          id: r.id,
          name: r.name,
          status: r.status,
          detail: r.detail,
        })),
      },
    }),
  );
});

// Signal readiness so ISOLATED world can immediately push current config if it loaded first.
document.dispatchEvent(new Event(MAIN_READY_EVENT));
