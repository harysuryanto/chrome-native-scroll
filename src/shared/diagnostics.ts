import type { AdapterStatus } from '../main-world/adapters/types';

export type DiagnosticOutcome =
  | 'not_detected'
  | 'not_tested'
  | 'unsupported'
  | 'failed'
  | 'successfully_neutralized';

export interface SanitizedAdapterDiagnostic {
  readonly id: string;
  readonly name: string;
  readonly outcome: DiagnosticOutcome;
  readonly detail: string;
}

export interface MainWorldDiagnostics {
  readonly apiPatchState: 'inactive' | 'active' | 'partial' | 'failed';
  readonly neutralizedApiCalls: number;
  readonly nonPassiveRootWheelListeners: number;
  readonly strictWheelActive: boolean;
  readonly adapters: readonly SanitizedAdapterDiagnostic[];
}

const MAX_STRING_LEN = 160;
const MAX_ADAPTERS = 12;

function clampString(value: unknown, fallback = ''): string {
  if (typeof value !== 'string') return fallback;
  return value.slice(0, MAX_STRING_LEN);
}

function clampNonNegativeInt(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return 0;
  return Math.min(Math.floor(value), 1_000_000);
}

export function mapAdapterStatusToOutcome(status: AdapterStatus | unknown): DiagnosticOutcome {
  switch (status) {
    case 'active':
      return 'successfully_neutralized';
    case 'unsupported':
      return 'unsupported';
    case 'failed':
      return 'failed';
    case 'detected':
      return 'not_tested';
    case 'not_detected':
    case 'not_applicable':
    default:
      return 'not_detected';
  }
}

/**
 * Treats MAIN-world diagnostic payloads as untrusted page data.
 * Validates types, bounds lengths, and strips unknown keys before UI rendering.
 */
export function sanitizeMainWorldDiagnostics(input: unknown): MainWorldDiagnostics | null {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) return null;
  const src = input as Record<string, unknown>;

  const rawState = src.apiPatchState;
  const apiPatchState =
    rawState === 'active' ||
    rawState === 'partial' ||
    rawState === 'failed' ||
    rawState === 'inactive'
      ? rawState
      : 'inactive';

  const adapters: SanitizedAdapterDiagnostic[] = [];
  if (Array.isArray(src.adapters)) {
    for (const item of src.adapters.slice(0, MAX_ADAPTERS)) {
      if (typeof item !== 'object' || item === null || Array.isArray(item)) continue;
      const rec = item as Record<string, unknown>;
      const id = clampString(rec.id);
      const name = clampString(rec.name);
      if (!id || !name) continue;
      adapters.push({
        id,
        name,
        outcome: mapAdapterStatusToOutcome(rec.status),
        detail: clampString(rec.detail),
      });
    }
  }

  return {
    apiPatchState,
    neutralizedApiCalls: clampNonNegativeInt(src.neutralizedApiCalls),
    nonPassiveRootWheelListeners: clampNonNegativeInt(src.nonPassiveRootWheelListeners),
    strictWheelActive: src.strictWheelActive === true,
    adapters,
  };
}
