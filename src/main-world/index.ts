import {
  CONFIG_EVENT,
  DIAGNOSTIC_PING_EVENT,
  MAIN_READY_EVENT,
  MAIN_WORLD_READY_EVENT,
  isMainWorldConfig,
  type MainWorldConfig,
} from '../shared/bridge';
import { createScrollApiPatchController } from './scroll-api-patch';

// MAIN-world entry point. Runs in the page JS context with zero privileged extension APIs.
const scrollApiPatch = createScrollApiPatchController();

function applyConfig(config: MainWorldConfig): void {
  if (config.active && config.smoothScrollApis) {
    scrollApiPatch.enable();
  } else {
    scrollApiPatch.disable();
  }
}

document.addEventListener(CONFIG_EVENT, (event: Event) => {
  if (!(event instanceof CustomEvent)) return;
  if (!isMainWorldConfig(event.detail)) return;
  applyConfig(event.detail);
});

document.addEventListener(DIAGNOSTIC_PING_EVENT, () => {
  document.dispatchEvent(new Event(MAIN_WORLD_READY_EVENT));
});

// Signal readiness so ISOLATED world can immediately push current config if it loaded first.
document.dispatchEvent(new Event(MAIN_READY_EVENT));
