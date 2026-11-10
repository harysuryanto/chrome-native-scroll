import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_SETTINGS, SETTINGS_KEY, normalizeSettings } from '../src/shared/settings';
import { loadSettings, observeSettings, saveSettings } from '../src/shared/storage';

type ChangeListener = (changes: Record<string, chrome.storage.StorageChange>, area: string) => void;

describe('chrome.storage.local settings integration', () => {
  const stored: Record<string, unknown> = {};
  const listeners = new Set<ChangeListener>();

  beforeEach(() => {
    delete stored[SETTINGS_KEY];
    listeners.clear();
    vi.stubGlobal('chrome', {
      storage: {
        local: {
          get: vi.fn(async (key: string) => ({ [key]: stored[key] })),
          set: vi.fn(async (items: Record<string, unknown>) => {
            for (const [key, value] of Object.entries(items)) {
              const oldValue = stored[key];
              stored[key] = value;
              for (const listener of listeners) {
                listener({ [key]: { oldValue, newValue: value } }, 'local');
              }
            }
          }),
        },
        onChanged: {
          addListener: (listener: ChangeListener) => listeners.add(listener),
          removeListener: (listener: ChangeListener) => listeners.delete(listener),
        },
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses defaults for empty storage and persists changes', async () => {
    expect(await loadSettings()).toEqual(DEFAULT_SETTINGS);
    const newValue = normalizeSettings({
      enabled: false,
      excludedHosts: ['example.com'],
    });
    await saveSettings(newValue);
    expect(await loadSettings()).toEqual(newValue);
  });

  it('sanitizes malformed persisted values when loading', async () => {
    stored[SETTINGS_KEY] = { enabled: 'no', excludedHosts: ['https://bad.example'] };
    expect(await loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('notifies only for the correct area/key and supports cleanup', async () => {
    const received: boolean[] = [];
    const stop = observeSettings((settings) => received.push(settings.enabled));
    for (const listener of listeners) {
      listener({ ignored: { newValue: {} } }, 'local');
      listener({ [SETTINGS_KEY]: { newValue: { enabled: false } } }, 'sync');
    }
    expect(received).toEqual([]);
    await saveSettings(normalizeSettings({ enabled: false }));
    expect(received).toEqual([false]);
    stop();
    await saveSettings(normalizeSettings({ enabled: true }));
    expect(received).toEqual([false]);
  });
});
