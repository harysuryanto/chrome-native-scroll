import { isEnabledForHost, type NativeScrollSettings } from '../shared/settings';
import { loadSettings, observeSettings } from '../shared/storage';
import { isExtensionRequest, PING_MESSAGE } from '../shared/messages';

let currentSettings: NativeScrollSettings | null = null;
let initialized = false;

const hostname = location.hostname;

function active(): boolean {
  return currentSettings !== null && isEnabledForHost(currentSettings, hostname);
}

const unsubscribe = observeSettings((next) => {
  currentSettings = next;
});

void loadSettings().then((settings) => {
  // A storage update might arrive while initial load is still in flight.
  if (currentSettings === null) currentSettings = settings;
  initialized = true;
}).catch((error: unknown) => {
  console.warn('NativeScroll settings could not be loaded:', error);
});

chrome.runtime.onMessage.addListener((message: unknown, sender, sendResponse) => {
  if (sender.id !== chrome.runtime.id || !isExtensionRequest(message)) return;
  if (message.type === PING_MESSAGE) {
    sendResponse({ ready: initialized });
    return;
  }
  sendResponse({ ready: initialized, active: active(), hostname });
});

window.addEventListener('pagehide', () => unsubscribe(), { once: true });

// Issue #2 only tracks settings; actual scrolling hooks are added in #3 and #4.
