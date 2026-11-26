// The page's MAIN world has no privileged Chrome APIs. Never bridge page
// CustomEvents or postMessage payloads into privileged settings mutations.
export const PING_MESSAGE = 'native-scroll:ping' as const;
export const STATE_MESSAGE = 'native-scroll:get-state' as const;

export type ExtensionRequest =
  | { type: typeof PING_MESSAGE }
  | { type: typeof STATE_MESSAGE };

export function isExtensionRequest(value: unknown): value is ExtensionRequest {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const object = value as Record<string, unknown>;
  const keys = Object.keys(object);
  return keys.length === 1 &&
    (object.type === PING_MESSAGE || object.type === STATE_MESSAGE);
}
