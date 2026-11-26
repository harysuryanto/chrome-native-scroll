import type { SiteMode } from './settings';

// One-way declarative config events from ISOLATED -> MAIN world.
// MAIN world is unprivileged; ISOLATED world must never trust MAIN-world events
// to mutate settings or invoke privileged extension APIs.
export const CONFIG_EVENT = 'native-scroll:config' as const;
export const MAIN_READY_EVENT = 'native-scroll:main-ready' as const;
export const DIAGNOSTIC_PING_EVENT = 'native-scroll:diagnostic-ping' as const;
export const MAIN_WORLD_READY_EVENT = 'native-scroll:main-world-ready' as const;
export const DIAGNOSTICS_REQUEST_EVENT = 'native-scroll:diagnostics-request' as const;
export const DIAGNOSTICS_REPORT_EVENT = 'native-scroll:diagnostics-report' as const;

export interface MainWorldConfig {
  readonly active: boolean;
  readonly smoothScrollApis: boolean;
  readonly wheelOptimization: boolean;
  readonly libraryAdapters: boolean;
  readonly mode: SiteMode;
}

export function isMainWorldConfig(value: unknown): value is MainWorldConfig {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.active === 'boolean' &&
    typeof record.smoothScrollApis === 'boolean' &&
    typeof record.wheelOptimization === 'boolean' &&
    typeof record.libraryAdapters === 'boolean' &&
    (record.mode === 'native' || record.mode === 'compatibility' || record.mode === 'strict')
  );
}
