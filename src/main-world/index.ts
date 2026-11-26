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

wheelOptimizer.installObserver();
adapterManager.attachLifecycleListeners();

function applyConfig(config: MainWorldConfig): void {
  if (config.active && config.smoothScrollApis) {
    scrollApiPatch.enable();
  } else {
    scrollApiPatch.disable();
  }

  const adaptersAllowed =
    config.active &&
    config.libraryAdapters &&
    (config.mode === 'compatibility' || config.mode === 'strict');
  adapterManager.setEnabled(adaptersAllowed);

  wheelOptimizer.setStrict(config.active && config.mode === 'strict' && config.wheelOptimization);
}

document.addEventListener(CONFIG_EVENT, (event: Event) => {
  if (!(event instanceof CustomEvent)) return;
  if (!isMainWorldConfig(event.detail)) return;
  applyConfig(event.detail);
});

document.addEventListener(DIAGNOSTIC_PING_EVENT, () => {
  document.dispatchEvent(new Event(MAIN_WORLD_READY_EVENT));
});

document.addEventListener(DIAGNOSTICS_REQUEST_EVENT, () => {
  adapterManager.refresh();
  const apiStatus = scrollApiPatch.getStatus();
  const wheelStatus = wheelOptimizer.getStatus();
  document.dispatchEvent(
    new CustomEvent(DIAGNOSTICS_REPORT_EVENT, {
      detail: {
        apiPatchState: apiStatus.state,
        neutralizedApiCalls: apiStatus.neutralizedCalls,
        nonPassiveRootWheelListeners: wheelStatus.nonPassiveRootListeners,
        strictWheelActive: wheelStatus.strictActive,
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
