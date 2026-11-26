import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SETTINGS,
  addExcludedHost,
  clearExcludedHosts,
  isEnabledForHost,
  normalizeHostname,
  normalizeSettings,
  removeExcludedHost,
} from '../src/shared/settings';
import { isDetectionBadgeMessage, isExtensionRequest } from '../src/shared/messages';

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

    // Detection badge validation
    expect(
      isDetectionBadgeMessage({
        type: 'native-scroll:detection-badge',
        detected: true,
        summary: 'Lenis',
      }),
    ).toBe(true);
    expect(
      isDetectionBadgeMessage({
        type: 'native-scroll:detection-badge',
        detected: true,
        summary: 'Lenis',
        count: 1,
      }),
    ).toBe(true);
    expect(
      isDetectionBadgeMessage({
        type: 'native-scroll:detection-badge',
        detected: true,
        summary: 'Lenis',
        count: -1,
      }),
    ).toBe(false);
    expect(
      isDetectionBadgeMessage({
        type: 'native-scroll:detection-badge',
        detected: true,
        summary: 'Lenis',
        count: 1,
        extra: 'bad',
      }),
    ).toBe(false);
  });

  it('adds, deduplicates, removes, and clears excluded hosts cleanly', () => {
    const start = normalizeSettings({});
    const bad = addExcludedHost(start, 'https://bad.example/path');
    expect(bad.host).toBeNull();
    expect(bad.settings.excludedHosts).toEqual([]);

    const added1 = addExcludedHost(start, ' Example.COM. ');
    expect(added1.host).toBe('example.com');
    expect(added1.settings.excludedHosts).toEqual(['example.com']);

    const dup = addExcludedHost(added1.settings, 'example.com');
    expect(dup.settings.excludedHosts).toEqual(['example.com']);

    const added2 = addExcludedHost(dup.settings, 'sub.example.com');
    expect(added2.settings.excludedHosts).toEqual(['example.com', 'sub.example.com']);

    const removed = removeExcludedHost(added2.settings, 'example.com');
    expect(removed.excludedHosts).toEqual(['sub.example.com']);

    const cleared = clearExcludedHosts(removed);
    expect(cleared.excludedHosts).toEqual([]);
  });
});
