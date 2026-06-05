import type { AxiosError } from "axios";

type ApiErrorBody = {
  message?: string;
  errors?: Record<string, unknown>;
};

const DUPLICATE_EMAIL_HINTS = ["already registered", "already exists", "user with this email"];

function isDuplicateEmailMessage(message: string): boolean {
  const lower = message.toLowerCase();
  return DUPLICATE_EMAIL_HINTS.some((hint) => lower.includes(hint));
}

function fieldError(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && value.length > 0) return fieldError(value[0]);
  if (value && typeof value === "object" && "message" in value) {
    const msg = (value as { message?: string }).message;
    if (typeof msg === "string") return msg;
  }
  return undefined;
}

function pickMessage(data: ApiErrorBody): string | undefined {
  if (typeof data.message === "string" && data.message && data.message !== "An error occurred") {
    return data.message;
  }

  if (data.errors && typeof data.errors === "object") {
    for (const key of ["email", "password", "password_confirm", "non_field_errors", "detail"]) {
      const msg = fieldError(data.errors[key]);
      if (msg) return msg;
    }
    for (const value of Object.values(data.errors)) {
      const msg = fieldError(value);
      if (msg) return msg;
    }
  }

  if (typeof data.message === "string" && data.message) {
    return data.message;
  }
  return undefined;
}

export function isDuplicateEmailError(error: unknown): boolean {
  return isDuplicateEmailMessage(getApiErrorMessage(error, ""));
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  const data = (error as AxiosError<ApiErrorBody>).response?.data;
  if (!data) return fallback;

  const message = pickMessage(data);
  if (!message) return fallback;

  return isDuplicateEmailMessage(message) ? "This account is already registered." : message;
}
