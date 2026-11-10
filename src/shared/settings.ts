export const SETTINGS_KEY = 'nativeScrollSettings';
export const SETTINGS_VERSION = 1;

export type SiteMode = 'native' | 'compatibility' | 'strict';

export interface FeatureSettings {
  cssSmoothScrolling: boolean;
  smoothScrollApis: boolean;
  wheelOptimization: boolean;
  libraryAdapters: boolean;
}

export interface NativeScrollSettings {
  schemaVersion: typeof SETTINGS_VERSION;
  enabled: boolean;
  features: FeatureSettings;
  excludedHosts: string[];
  siteModes: Record<string, SiteMode>;
}

export const DEFAULT_SETTINGS: Readonly<NativeScrollSettings> = Object.freeze({
  schemaVersion: SETTINGS_VERSION,
  enabled: true,
  features: Object.freeze({
    cssSmoothScrolling: true,
    smoothScrollApis: true,
    wheelOptimization: false,
    libraryAdapters: false,
  }),
  excludedHosts: Object.freeze([]) as unknown as string[],
  siteModes: Object.freeze({}) as Record<string, SiteMode>,
});

function record(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export function normalizeHostname(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const hostname = value.trim().toLowerCase().replace(/\.$/, '');
  // Restrict stored entries to valid DNS-style or localhost hosts, not URLs or wildcards.
  if (hostname === 'localhost') return hostname;
  if (hostname.length > 253 || !hostname || hostname.includes('..')) return null;
  if (!hostname.split('.').every((label) => label.length > 0 && label.length <= 63 &&
    /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label))) return null;
  return hostname;
}

function bool(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

// All persisted objects are treated as untrusted data. Unknown keys are discarded.
export function normalizeSettings(input: unknown): NativeScrollSettings {
  const source = record(input) ?? {};
  const features = record(source.features) ?? {};
  const old = source.schemaVersion === undefined ? source : {};

  const hosts = Array.isArray(source.excludedHosts)
    ? source.excludedHosts
    : Array.isArray(old.disabledSites) ? old.disabledSites : [];
  const excludedHosts = [...new Set(hosts.map(normalizeHostname).filter(
    (host): host is string => host !== null,
  ))].slice(0, 1000);

  const rawModes = record(source.siteModes) ?? {};
  const siteModes: Record<string, SiteMode> = Object.create(null) as Record<string, SiteMode>;
  for (const [key, mode] of Object.entries(rawModes).slice(0, 1000)) {
    const host = normalizeHostname(key);
    if (host && (mode === 'native' || mode === 'compatibility' || mode === 'strict')) {
      siteModes[host] = mode;
    }
  }

  return {
    schemaVersion: SETTINGS_VERSION,
    enabled: bool(source.enabled, DEFAULT_SETTINGS.enabled),
    features: {
      cssSmoothScrolling: bool(features.cssSmoothScrolling, true),
      smoothScrollApis: bool(features.smoothScrollApis, true),
      wheelOptimization: bool(features.wheelOptimization, false),
      libraryAdapters: bool(features.libraryAdapters, false),
    },
    excludedHosts,
    siteModes,
  };
}

export function isEnabledForHost(settings: NativeScrollSettings, hostname: string): boolean {
  const host = normalizeHostname(hostname);
  return settings.enabled && host !== null && !settings.excludedHosts.includes(host);
}
