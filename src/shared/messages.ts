// The page's MAIN world has no privileged Chrome APIs. Never bridge page
// CustomEvents or postMessage payloads into privileged settings mutations.
export const PING_MESSAGE = 'native-scroll:ping' as const;
export const STATE_MESSAGE = 'native-scroll:get-state' as const;
export const DETECTION_BADGE_MESSAGE = 'native-scroll:detection-badge' as const;

export type ExtensionRequest =
  | { type: typeof PING_MESSAGE }
  | { type: typeof STATE_MESSAGE };

export interface DetectionBadgeMessage {
  type: typeof DETECTION_BADGE_MESSAGE;
  detected: boolean;
  summary: string;
  count?: number;
}

export function isDetectionBadgeMessage(value: unknown): value is DetectionBadgeMessage {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj);
  if (keys.length === 3) {
    return (
      obj.type === DETECTION_BADGE_MESSAGE &&
      typeof obj.detected === 'boolean' &&
      typeof obj.summary === 'string' &&
      obj.summary.length <= 120
    );
  }
  if (keys.length === 4) {
    return (
      obj.type === DETECTION_BADGE_MESSAGE &&
      typeof obj.detected === 'boolean' &&
      typeof obj.summary === 'string' &&
      obj.summary.length <= 120 &&
      typeof obj.count === 'number' &&
      Number.isInteger(obj.count) &&
      obj.count >= 0
    );
  }
  return false;
}

export function isExtensionRequest(value: unknown): value is ExtensionRequest {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const object = value as Record<string, unknown>;
  const keys = Object.keys(object);
  return keys.length === 1 &&
    (object.type === PING_MESSAGE || object.type === STATE_MESSAGE);
}
