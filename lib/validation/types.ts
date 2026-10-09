export type ValidationResult<T> =
  | { valid: true; data: T }
  | { valid: false; errors: string[] };

export const USER_ROLES = ["admin", "manager", "staff"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const WORKSHOP_STATUSES = ["scheduled", "cancelled", "completed"] as const;
export type WorkshopStatus = (typeof WORKSHOP_STATUSES)[number];

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}
