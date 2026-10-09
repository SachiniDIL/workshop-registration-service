import { WORKSHOP_STATUSES, isRecord, type WorkshopStatus, type ValidationResult } from "./types";

export interface UpdateWorkshopInput {
  code?: string;
  title?: string;
  instructor?: string;
  dateTime?: Date;
  capacity?: number;
  status?: WorkshopStatus;
  location?: string;
  description?: string;
}

const UPDATABLE_FIELDS = [
  "code",
  "title",
  "instructor",
  "dateTime",
  "capacity",
  "status",
  "location",
  "description",
] as const;

export function validateUpdateWorkshop(input: unknown): ValidationResult<UpdateWorkshopInput> {
  const errors: string[] = [];

  if (!isRecord(input)) {
    return { valid: false, errors: ["Request body must be an object"] };
  }

  const presentFields = UPDATABLE_FIELDS.filter((field) => input[field] !== undefined);
  if (presentFields.length === 0) {
    return {
      valid: false,
      errors: [`At least one field must be provided: ${UPDATABLE_FIELDS.join(", ")}`],
    };
  }

  const data: UpdateWorkshopInput = {};

  if (input.code !== undefined) {
    if (typeof input.code !== "string" || input.code.trim().length === 0) {
      errors.push("code must be a non-empty string");
    } else {
      data.code = input.code.trim();
    }
  }

  if (input.title !== undefined) {
    if (typeof input.title !== "string" || input.title.trim().length === 0) {
      errors.push("title must be a non-empty string");
    } else {
      data.title = input.title.trim();
    }
  }

  if (input.instructor !== undefined) {
    if (typeof input.instructor !== "string" || input.instructor.trim().length === 0) {
      errors.push("instructor must be a non-empty string");
    } else {
      data.instructor = input.instructor.trim();
    }
  }

  if (input.dateTime !== undefined) {
    if (typeof input.dateTime !== "string" && !(input.dateTime instanceof Date)) {
      errors.push("dateTime must be a valid date string");
    } else {
      const parsed = new Date(input.dateTime as string | Date);
      if (Number.isNaN(parsed.getTime())) {
        errors.push("dateTime must be a valid, parseable date string");
      } else {
        data.dateTime = parsed;
      }
    }
  }

  if (input.capacity !== undefined) {
    if (typeof input.capacity !== "number" && typeof input.capacity !== "string") {
      errors.push("capacity must be a number");
    } else {
      const parsedCapacity =
        typeof input.capacity === "number" ? input.capacity : Number(input.capacity.trim());
      if (!Number.isFinite(parsedCapacity) || !Number.isInteger(parsedCapacity)) {
        errors.push("capacity must be an integer");
      } else if (parsedCapacity <= 0) {
        errors.push("capacity must be greater than 0");
      } else {
        data.capacity = parsedCapacity;
      }
    }
  }

  if (input.status !== undefined) {
    if (
      typeof input.status !== "string" ||
      !WORKSHOP_STATUSES.includes(input.status as WorkshopStatus)
    ) {
      errors.push(`status must be one of: ${WORKSHOP_STATUSES.join(", ")}`);
    } else {
      data.status = input.status as WorkshopStatus;
    }
  }

  if (input.location !== undefined) {
    if (typeof input.location !== "string") {
      errors.push("location must be a string");
    } else {
      data.location = input.location.trim();
    }
  }

  if (input.description !== undefined) {
    if (typeof input.description !== "string") {
      errors.push("description must be a string");
    } else {
      data.description = input.description.trim();
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, data };
}
