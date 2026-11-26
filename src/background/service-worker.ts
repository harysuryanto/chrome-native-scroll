import { SETTINGS_KEY, normalizeSettings } from '../shared/settings';
import { loadSettings, observeSettings } from '../shared/storage';

const ACTIVE_ICONS = {
  16: 'icons/icon-16.png',
  32: 'icons/icon-32.png',
  48: 'icons/icon-48.png',
  128: 'icons/icon-128.png',
};

const DISABLED_ICONS = {
  16: 'icons/icon-disabled-16.png',
  32: 'icons/icon-disabled-32.png',
  48: 'icons/icon-disabled-48.png',
  128: 'icons/icon-disabled-128.png',
};

async function syncActionIcon(enabled: boolean): Promise<void> {
  try {
    await chrome.action.setIcon({ path: enabled ? ACTIVE_ICONS : DISABLED_ICONS });
  } catch (error: unknown) {
    console.warn('NativeScroll icon update failed:', error);
  }
}

chrome.runtime.onInstalled.addListener(() => {
  void chrome.storage.local
    .get(SETTINGS_KEY)
    .then(async (stored) => {
      const normalized = normalizeSettings(stored[SETTINGS_KEY]);
      await chrome.storage.local.set({ [SETTINGS_KEY]: normalized });
      await syncActionIcon(normalized.enabled);
    })
    .catch((error: unknown) => {
      console.error('NativeScroll settings initialization failed:', error);
    });
});

chrome.runtime.onStartup.addListener(() => {
  void loadSettings().then((settings) => syncActionIcon(settings.enabled));
});

observeSettings((settings) => {
  void syncActionIcon(settings.enabled);
});

void loadSettings()
  .then((settings) => syncActionIcon(settings.enabled))
  .catch(() => {});
