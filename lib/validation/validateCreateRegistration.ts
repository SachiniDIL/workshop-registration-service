import { EMAIL_REGEX, isRecord, type ValidationResult } from "./types";

export interface CreateRegistrationInput {
  attendeeName: string;
  attendeeEmail: string;
}

export function validateCreateRegistration(
  input: unknown
): ValidationResult<CreateRegistrationInput> {
  const errors: string[] = [];

  if (!isRecord(input)) {
    return { valid: false, errors: ["Request body must be an object"] };
  }

  let attendeeName = "";
  if (typeof input.attendeeName !== "string" || input.attendeeName.trim().length === 0) {
    errors.push("attendeeName is required and must be a non-empty string");
  } else {
    attendeeName = input.attendeeName.trim();
  }

  let attendeeEmail = "";
  if (typeof input.attendeeEmail !== "string" || input.attendeeEmail.trim().length === 0) {
    errors.push("attendeeEmail is required and must be a non-empty string");
  } else {
    attendeeEmail = input.attendeeEmail.trim().toLowerCase();
    if (!EMAIL_REGEX.test(attendeeEmail)) {
      errors.push("attendeeEmail must be a valid email address");
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, data: { attendeeName, attendeeEmail } };
}
