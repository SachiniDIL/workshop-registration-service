import { EMAIL_REGEX, USER_ROLES, isRecord, type UserRole, type ValidationResult } from "./types";

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export function validateCreateUser(input: unknown): ValidationResult<CreateUserInput> {
  const errors: string[] = [];

  if (!isRecord(input)) {
    return { valid: false, errors: ["Request body must be an object"] };
  }

  let name = "";
  if (typeof input.name !== "string" || input.name.trim().length === 0) {
    errors.push("name is required and must be a non-empty string");
  } else {
    name = input.name.trim();
  }

  let email = "";
  if (typeof input.email !== "string" || input.email.trim().length === 0) {
    errors.push("email is required and must be a non-empty string");
  } else {
    email = input.email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(email)) {
      errors.push("email must be a valid email address");
    }
  }

  let password = "";
  if (typeof input.password !== "string" || input.password.length === 0) {
    errors.push("password is required and must be a string");
  } else {
    password = input.password;
    if (password.length < 8) {
      errors.push("password must be at least 8 characters long");
    }
  }

  let role: UserRole | null = null;
  if (typeof input.role !== "string" || !USER_ROLES.includes(input.role as UserRole)) {
    errors.push(`role is required and must be one of: ${USER_ROLES.join(", ")}`);
  } else {
    role = input.role as UserRole;
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: { name, email, password, role: role as UserRole },
  };
}
