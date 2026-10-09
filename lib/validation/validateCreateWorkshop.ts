import { WORKSHOP_STATUSES, isRecord, type WorkshopStatus, type ValidationResult } from "./types";

export interface CreateWorkshopInput {
  code: string;
  title: string;
  instructor: string;
  dateTime: Date;
  capacity: number;
  status: WorkshopStatus;
  location?: string;
  description?: string;
}

export function validateCreateWorkshop(input: unknown): ValidationResult<CreateWorkshopInput> {
  const errors: string[] = [];

  if (!isRecord(input)) {
    return { valid: false, errors: ["Request body must be an object"] };
  }

  let code = "";
  if (typeof input.code !== "string" || input.code.trim().length === 0) {
    errors.push("code is required and must be a non-empty string");
  } else {
    code = input.code.trim();
  }

  let title = "";
  if (typeof input.title !== "string" || input.title.trim().length === 0) {
    errors.push("title is required and must be a non-empty string");
  } else {
    title = input.title.trim();
  }

  let instructor = "";
  if (typeof input.instructor !== "string" || input.instructor.trim().length === 0) {
    errors.push("instructor is required and must be a non-empty string");
  } else {
    instructor = input.instructor.trim();
  }

  let dateTime: Date | null = null;
  if (typeof input.dateTime !== "string" && !(input.dateTime instanceof Date)) {
    errors.push("dateTime is required and must be a valid date string");
  } else {
    const parsed = new Date(input.dateTime as string | Date);
    if (Number.isNaN(parsed.getTime())) {
      errors.push("dateTime must be a valid, parseable date string");
    } else {
      dateTime = parsed;
    }
  }

  let capacity = 0;
  if (typeof input.capacity !== "number" && typeof input.capacity !== "string") {
    errors.push("capacity is required and must be a number");
  } else {
    const parsedCapacity =
      typeof input.capacity === "number" ? input.capacity : Number(input.capacity.trim());
    if (!Number.isFinite(parsedCapacity) || !Number.isInteger(parsedCapacity)) {
      errors.push("capacity must be an integer");
    } else if (parsedCapacity <= 0) {
      errors.push("capacity must be greater than 0");
    } else {
      capacity = parsedCapacity;
    }
  }

  let status: WorkshopStatus = "scheduled";
  if (input.status !== undefined) {
    if (
      typeof input.status !== "string" ||
      !WORKSHOP_STATUSES.includes(input.status as WorkshopStatus)
    ) {
      errors.push(`status must be one of: ${WORKSHOP_STATUSES.join(", ")}`);
    } else {
      status = input.status as WorkshopStatus;
    }
  }

  let location: string | undefined;
  if (input.location !== undefined) {
    if (typeof input.location !== "string") {
      errors.push("location must be a string");
    } else {
      location = input.location.trim();
    }
  }

  let description: string | undefined;
  if (input.description !== undefined) {
    if (typeof input.description !== "string") {
      errors.push("description must be a string");
    } else {
      description = input.description.trim();
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: {
      code,
      title,
      instructor,
      dateTime: dateTime as Date,
      capacity,
      status,
      location,
      description,
    },
  };
}
