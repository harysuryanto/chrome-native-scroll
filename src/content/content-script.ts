import {
  getEffectiveMode,
  isEnabledForHost,
  type NativeScrollSettings,
} from '../shared/settings';
import { loadSettings, observeSettings } from '../shared/storage';
import { DETECTION_BADGE_MESSAGE, isExtensionRequest, PING_MESSAGE } from '../shared/messages';
import {
  CONFIG_EVENT,
  DIAGNOSTICS_REPORT_EVENT,
  DIAGNOSTICS_REQUEST_EVENT,
  MAIN_READY_EVENT,
  type MainWorldConfig,
} from '../shared/bridge';
import {
  sanitizeMainWorldDiagnostics,
  type MainWorldDiagnostics,
} from '../shared/diagnostics';
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
    wheelOptimization: Boolean(active && (mode === 'strict' || mode === 'auto')),
    libraryAdapters: Boolean(
      active && (mode === 'compatibility' || mode === 'strict' || mode === 'auto'),
    ),
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

function requestMainWorldDiagnostics(): MainWorldDiagnostics | null {
  let captured: MainWorldDiagnostics | null = null;
  const listener = (event: Event) => {
    if (event instanceof CustomEvent) {
      captured = sanitizeMainWorldDiagnostics(event.detail);
    }
  };
  document.addEventListener(DIAGNOSTICS_REPORT_EVENT, listener, { once: true });
  document.dispatchEvent(new Event(DIAGNOSTICS_REQUEST_EVENT));
  document.removeEventListener(DIAGNOSTICS_REPORT_EVENT, listener);
  return captured;
}

function summarizeCustomPhysics(diag: MainWorldDiagnostics | null): { count: number; summary: string } | null {
  if (!diag) return null;
  const parts: string[] = [];
  for (const adapter of diag.adapters) {
    if (adapter.outcome !== 'not_detected') {
      parts.push(adapter.name);
    }
  }
  if (diag.nonPassiveRootWheelListeners > 0) {
    parts.push('wheel hijacker');
  }
  if (diag.neutralizedApiCalls > 0) {
    parts.push('smooth scroll API');
  }
  return parts.length > 0
    ? { count: parts.length, summary: parts.join(', ').slice(0, 120) }
    : null;
}

function reportDetectionBadge(): void {
  const diag = requestMainWorldDiagnostics();
  const result = summarizeCustomPhysics(diag);
  void chrome.runtime
    .sendMessage({
      type: DETECTION_BADGE_MESSAGE,
      detected: result !== null,
      summary: result?.summary ?? '',
      count: result?.count ?? 0,
    })
    .catch(() => {});
}

function scheduleDetectionReports(): void {
  reportDetectionBadge();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => reportDetectionBadge(), { once: true });
  }
  window.addEventListener('load', () => reportDetectionBadge(), { once: true });
  setTimeout(reportDetectionBadge, 250);
  setTimeout(reportDetectionBadge, 800);
  setTimeout(reportDetectionBadge, 2000);
}

scheduleDetectionReports();

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
    diagnostics: requestMainWorldDiagnostics(),
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
