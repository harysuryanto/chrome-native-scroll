export type AdapterStatus =
  | 'not_detected'
  | 'detected'
  | 'active'
  | 'unsupported'
  | 'failed'
  | 'not_applicable';

export interface AdapterStatusReport {
  readonly id: string;
  readonly name: string;
  readonly supportedVersions: string;
  readonly status: AdapterStatus;
  readonly detail: string;
  readonly requiresReload: boolean;
}

export interface AdapterActionResult {
  readonly status: AdapterStatus;
  readonly detail: string;
  readonly requiresReload?: boolean;
}

export interface ScrollLibraryAdapter {
  readonly id: string;
  readonly name: string;
  readonly supportedVersions: string;
  detect(): AdapterActionResult;
  activate(): AdapterActionResult;
  deactivate(): AdapterActionResult;
}
