import { SETTINGS_KEY, normalizeSettings } from '../shared/settings';

chrome.runtime.onInstalled.addListener(() => {
  void chrome.storage.local.get(SETTINGS_KEY).then(async (stored) => {
    await chrome.storage.local.set({
      [SETTINGS_KEY]: normalizeSettings(stored[SETTINGS_KEY]),
    });
  }).catch((error: unknown) => {
    console.error('NativeScroll settings initialization failed:', error);
  });
});
