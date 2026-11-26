import { isEnabledForHost, type NativeScrollSettings } from '../shared/settings';
import { loadSettings, observeSettings } from '../shared/storage';
import { isExtensionRequest, PING_MESSAGE } from '../shared/messages';
import { createCssOverrideController } from './css-override';

let currentSettings: NativeScrollSettings | null = null;
let initialized = false;

const hostname = location.hostname;
const cssOverride = createCssOverrideController(document);

function isHostActive(): boolean {
  return currentSettings !== null && isEnabledForHost(currentSettings, hostname);
}

function syncCssOverride(): void {
  if (isHostActive() && currentSettings?.features.cssSmoothScrolling) {
    cssOverride.apply();
  } else {
    cssOverride.remove();
  }
}

const unsubscribe = observeSettings((next) => {
  currentSettings = next;
  syncCssOverride();
});

void loadSettings()
  .then((settings) => {
    // A storage update might arrive while initial load is still in flight.
    if (currentSettings === null) currentSettings = settings;
    initialized = true;
    syncCssOverride();
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
    hostname,
  });
});

window.addEventListener('pagehide', () => unsubscribe(), { once: true });
