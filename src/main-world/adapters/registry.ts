import type { AdapterStatusReport, ScrollLibraryAdapter } from './types';

interface ManagedAdapter {
  readonly adapter: ScrollLibraryAdapter;
  report: AdapterStatusReport;
  activated: boolean;
}

export interface AdapterManager {
  register(adapter: ScrollLibraryAdapter): void;
  setEnabled(enabled: boolean): void;
  refresh(): void;
  getReports(): readonly AdapterStatusReport[];
  attachLifecycleListeners(doc?: Document, win?: Window): () => void;
}

export function createAdapterManager(
  initialAdapters: readonly ScrollLibraryAdapter[] = [],
): AdapterManager {
  const entries = new Map<string, ManagedAdapter>();
  let enabled = false;

  function makeReport(
    adapter: ScrollLibraryAdapter,
    status: AdapterStatusReport['status'],
    detail: string,
    requiresReload = false,
  ): AdapterStatusReport {
    return {
      id: adapter.id,
      name: adapter.name,
      supportedVersions: adapter.supportedVersions,
      status,
      detail,
      requiresReload,
    };
  }

  function register(adapter: ScrollLibraryAdapter): void {
    if (entries.has(adapter.id)) return;
    entries.set(adapter.id, {
      adapter,
      activated: false,
      report: makeReport(adapter, 'not_detected', 'Not scanned yet.'),
    });
  }

  for (const adapter of initialAdapters) {
    register(adapter);
  }

  function evaluateEntry(entry: ManagedAdapter): void {
    const { adapter } = entry;
    try {
      const detected = adapter.detect();
      if (detected.status === 'not_detected' || detected.status === 'not_applicable') {
        if (entry.activated) {
          adapter.deactivate();
          entry.activated = false;
        }
        entry.report = makeReport(adapter, detected.status, detected.detail);
        return;
      }

      if (detected.status === 'unsupported') {
        entry.report = makeReport(adapter, 'unsupported', detected.detail);
        return;
      }

      if (!enabled) {
        if (entry.activated) {
          const res = adapter.deactivate();
          entry.activated = false;
          entry.report = makeReport(adapter, res.status, res.detail, Boolean(res.requiresReload));
        } else {
          entry.report = makeReport(
            adapter,
            detected.status,
            `${detected.detail} (adapter disabled in current mode)`,
          );
        }
        return;
      }

      if (entry.activated) {
        // Idempotent: already active; keep current verified report.
        return;
      }

      const activated = adapter.activate();
      entry.activated = activated.status === 'active';
      entry.report = makeReport(
        adapter,
        activated.status,
        activated.detail,
        Boolean(activated.requiresReload),
      );
    } catch (error: unknown) {
      entry.activated = false;
      const reason = error instanceof Error ? error.message : String(error);
      entry.report = makeReport(adapter, 'failed', `Adapter error: ${reason}`);
    }
  }

  function refresh(): void {
    for (const entry of entries.values()) {
      evaluateEntry(entry);
    }
  }

  function setEnabled(next: boolean): void {
    enabled = next;
    refresh();
  }

  function getReports(): readonly AdapterStatusReport[] {
    return [...entries.values()].map((entry) => entry.report);
  }

  function attachLifecycleListeners(
    doc: Document | undefined = typeof document !== 'undefined' ? document : undefined,
    win: Window | undefined = typeof window !== 'undefined' ? window : undefined,
  ): () => void {
    const onLifecycle = () => refresh();
    doc?.addEventListener('DOMContentLoaded', onLifecycle, { once: true });
    win?.addEventListener('load', onLifecycle, { once: true });
    return () => {
      doc?.removeEventListener('DOMContentLoaded', onLifecycle);
      win?.removeEventListener('load', onLifecycle);
    };
  }

  return {
    register,
    setEnabled,
    refresh,
    getReports,
    attachLifecycleListeners,
  };
}
