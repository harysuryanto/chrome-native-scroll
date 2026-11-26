import { describe, expect, it, vi } from 'vitest';
import { createAdapterManager } from '../src/main-world/adapters/registry';
import type { ScrollLibraryAdapter } from '../src/main-world/adapters/types';

describe('AdapterManager lifecycle and capability reporting', () => {
  it('activates detected adapters idempotently and deactivates cleanly', () => {
    const activate = vi.fn(() => ({ status: 'active' as const, detail: 'Neutralized' }));
    const deactivate = vi.fn(() => ({ status: 'detected' as const, detail: 'Restored' }));
    const adapter: ScrollLibraryAdapter = {
      id: 'sample',
      name: 'SampleScroll',
      supportedVersions: '1.x',
      detect: () => ({ status: 'detected', detail: 'Found marker' }),
      activate,
      deactivate,
    };

    const manager = createAdapterManager([adapter]);
    manager.setEnabled(true);
    manager.refresh();
    expect(activate).toHaveBeenCalledTimes(1);
    expect(manager.getReports()[0]?.status).toBe('active');

    manager.setEnabled(false);
    expect(deactivate).toHaveBeenCalledTimes(1);
    expect(manager.getReports()[0]?.status).toBe('detected');
  });

  it('isolates adapter exceptions and reports failed status without crashing other adapters', () => {
    const broken: ScrollLibraryAdapter = {
      id: 'broken',
      name: 'BrokenLib',
      supportedVersions: '0.x',
      detect: () => {
        throw new Error('boom');
      },
      activate: () => ({ status: 'active', detail: 'ok' }),
      deactivate: () => ({ status: 'not_detected', detail: 'ok' }),
    };

    const unsupported: ScrollLibraryAdapter = {
      id: 'legacy',
      name: 'LegacyLib',
      supportedVersions: '4.x',
      detect: () => ({ status: 'unsupported', detail: 'Unreachable transform container' }),
      activate: () => ({ status: 'unsupported', detail: 'Unreachable' }),
      deactivate: () => ({ status: 'not_detected', detail: '' }),
    };

    const manager = createAdapterManager([broken]);
    manager.register(unsupported);
    manager.setEnabled(true);

    const reports = manager.getReports();
    expect(reports.find((r) => r.id === 'broken')?.status).toBe('failed');
    expect(reports.find((r) => r.id === 'legacy')?.status).toBe('unsupported');
  });
});
