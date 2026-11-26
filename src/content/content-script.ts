import {
  getEffectiveMode,
  isEnabledForHost,
  type NativeScrollSettings,
} from '../shared/settings';
import { loadSettings, observeSettings } from '../shared/storage';
import { isExtensionRequest, PING_MESSAGE } from '../shared/messages';
import { CONFIG_EVENT, MAIN_READY_EVENT, type MainWorldConfig } from '../shared/bridge';
import { createCssOverrideController } from './css-override';

let currentSettings: NativeScrollSettings | null = null;
let initialized = false;

const hostname = location.hostname;
const cssOverride = createCssOverrideController(document);

function isHostActive(): boolean {
  return currentSettings !== null && isEnabledForHost(currentSettings, hostname);
}

function buildMainWorldConfig(): MainWorldConfig {
  const active = isHostActive();
  const mode = currentSettings ? getEffectiveMode(currentSettings, hostname) : 'native';
  return {
    active,
    smoothScrollApis: Boolean(active && currentSettings?.features.smoothScrollApis),
    wheelOptimization: Boolean(active && mode === 'strict'),
    libraryAdapters: Boolean(active && (mode === 'compatibility' || mode === 'strict')),
    mode,
  };
}

function pushConfigToMainWorld(): void {
  if (currentSettings === null) return;
  document.dispatchEvent(
    new CustomEvent<MainWorldConfig>(CONFIG_EVENT, {
      detail: buildMainWorldConfig(),
    }),
  );
}

function syncAll(): void {
  if (isHostActive() && currentSettings?.features.cssSmoothScrolling) {
    cssOverride.apply();
  } else {
    cssOverride.remove();
  }
  pushConfigToMainWorld();
}

const onMainReady = () => {
  pushConfigToMainWorld();
};
document.addEventListener(MAIN_READY_EVENT, onMainReady);

const unsubscribe = observeSettings((next) => {
  currentSettings = next;
  syncAll();
});

void loadSettings()
  .then((settings) => {
    // A storage update might arrive while initial load is still in flight.
    if (currentSettings === null) currentSettings = settings;
    initialized = true;
    syncAll();
  })
  .catch((error: unknown) => {
    console.warn('NativeScroll settings could not be loaded:', error);
  });

chrome.runtime.onMessage.addListener((message: unknown, sender, sendResponse) => {
  if (sender.id !== chrome.runtime.id || !isExtensionRequest(message)) return;
  if (message.type === PING_MESSAGE) {
    sendResponse({ ready: initialized });
    return;
  }
  sendResponse({
    ready: initialized,
    active: isHostActive(),
    cssOverrideActive: cssOverride.isActive(),
    smoothScrollApisActive: Boolean(isHostActive() && currentSettings?.features.smoothScrollApis),
    hostname,
  });
});

window.addEventListener(
  'pagehide',
  () => {
    unsubscribe();
    document.removeEventListener(MAIN_READY_EVENT, onMainReady);
  },
  { once: true },
);
