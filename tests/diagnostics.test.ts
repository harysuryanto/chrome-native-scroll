import { describe, expect, it } from 'vitest';
import {
  mapAdapterStatusToOutcome,
  sanitizeMainWorldDiagnostics,
} from '../src/shared/diagnostics';

describe('per-site diagnostics sanitization', () => {
  it('maps adapter statuses to honest diagnostic outcomes', () => {
    expect(mapAdapterStatusToOutcome('active')).toBe('successfully_neutralized');
    expect(mapAdapterStatusToOutcome('unsupported')).toBe('unsupported');
    expect(mapAdapterStatusToOutcome('failed')).toBe('failed');
    expect(mapAdapterStatusToOutcome('detected')).toBe('not_tested');
    expect(mapAdapterStatusToOutcome('not_detected')).toBe('not_detected');
  });

  it('sanitizes untrusted MAIN-world payloads and bounds string lengths and counts', () => {
    const result = sanitizeMainWorldDiagnostics({
      apiPatchState: 'active',
      neutralizedApiCalls: 42,
      nonPassiveRootWheelListeners: -5,
      strictWheelActive: 'yes',
      adapters: [
        {
          id: 'lenis',
          name: 'Lenis',
          status: 'active',
          detail: 'x'.repeat(500),
          extraEvilField: '<script>alert(1)</script>',
        },
        { id: '', name: 'Invalid' },
      ],
    });

    expect(result).not.toBeNull();
    expect(result?.apiPatchState).toBe('active');
    expect(result?.neutralizedApiCalls).toBe(42);
    expect(result?.nonPassiveRootWheelListeners).toBe(0);
    expect(result?.strictWheelActive).toBe(false);
    expect(result?.adapters).toHaveLength(1);
    expect(result?.adapters[0]?.outcome).toBe('successfully_neutralized');
    expect(result?.adapters[0]?.detail.length).toBe(160);
    expect('extraEvilField' in (result?.adapters[0] ?? {})).toBe(false);
  });

  it('rejects non-object diagnostics payloads', () => {
    expect(sanitizeMainWorldDiagnostics(null)).toBeNull();
    expect(sanitizeMainWorldDiagnostics('bad')).toBeNull();
    expect(sanitizeMainWorldDiagnostics([])).toBeNull();
  });
});
