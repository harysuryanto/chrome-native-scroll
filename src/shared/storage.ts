import {
  SETTINGS_KEY,
  normalizeSettings,
  type NativeScrollSettings,
} from './settings';

export async function loadSettings(): Promise<NativeScrollSettings> {
  const value: Record<string, unknown> = await chrome.storage.local.get(SETTINGS_KEY);
  return normalizeSettings(value[SETTINGS_KEY]);
}

export async function saveSettings(settings: NativeScrollSettings): Promise<void> {
  await chrome.storage.local.set({ [SETTINGS_KEY]: normalizeSettings(settings) });
}

// Only the designated settings key is observed; other extensions/storage
// changes are ignored. No timers or polling are needed.
export function observeSettings(
  callback: (settings: NativeScrollSettings) => void,
): () => void {
  const listener = (
    changes: { [key: string]: chrome.storage.StorageChange },
    areaName: string,
  ) => {
    if (areaName !== 'local') return;
    const change = changes[SETTINGS_KEY];
    if (change) callback(normalizeSettings(change.newValue));
  };

  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}
