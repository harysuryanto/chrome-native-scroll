import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SETTINGS,
  isEnabledForHost,
  normalizeHostname,
  normalizeSettings,
} from '../src/shared/settings';
import { isExtensionRequest } from '../src/shared/messages';

describe('NativeScroll settings', () => {
  it('recovers defaults from missing or malformed storage', () => {
    expect(normalizeSettings(undefined)).toEqual(DEFAULT_SETTINGS);
    expect(normalizeSettings({ enabled: 'false', features: 3 })).toEqual(DEFAULT_SETTINGS);
  });

  it('validates booleans, sanitizes domains and drops unknown fields', () => {
    const settings = normalizeSettings({
      schemaVersion: 1,
      enabled: false,
      features: { cssSmoothScrolling: false, wheelOptimization: true, libraryAdapters: 'yes' },
      excludedHosts: [' Example.COM. ', 'example.com', 'https://evil.com', 'a..b'],
      siteModes: { 'FOO.com': 'strict', 'bad site': 'native', 'bar.com': 'unknown' },
      admin: true,
    });
    expect(settings.enabled).toBe(false);
    expect(settings.features).toEqual({
      cssSmoothScrolling: false,
      smoothScrollApis: true,
      wheelOptimization: true,
      libraryAdapters: false,
    });
    expect(settings.excludedHosts).toEqual(['example.com']);
    expect(settings.siteModes).toEqual({ 'foo.com': 'strict' });
    expect('admin' in settings).toBe(false);
  });

  it('migrates a legacy disabledSites field without losing the enabled flag', () => {
    const result = normalizeSettings({ enabled: false, disabledSites: ['legacy.example'] });
    expect(result.schemaVersion).toBe(1);
    expect(result.enabled).toBe(false);
    expect(result.excludedHosts).toEqual(['legacy.example']);
  });

  it('enforces exact-host exclusions and global switch', () => {
    const settings = normalizeSettings({ excludedHosts: ['example.com'] });
    expect(isEnabledForHost(settings, 'example.com')).toBe(false);
    expect(isEnabledForHost(settings, 'sub.example.com')).toBe(true);
    expect(isEnabledForHost({ ...settings, enabled: false }, 'sub.example.com')).toBe(false);
    expect(normalizeHostname('https://foo.com')).toBeNull();
  });

  it('rejects malformed extension messages and unexpected properties', () => {
    expect(isExtensionRequest({ type: 'native-scroll:ping' })).toBe(true);
    expect(isExtensionRequest({ type: 'native-scroll:get-state' })).toBe(true);
    expect(isExtensionRequest({ type: 'native-scroll:ping', settings: {} })).toBe(false);
    expect(isExtensionRequest({ type: 'native-scroll:write-settings' })).toBe(false);
  });
});
