export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function friendlyApiMessage(status: number, raw: string): string {
  if (raw) return raw;
  if (status === 401) return "Invalid email or password.";
  if (status === 409) return "This email is already registered.";
  if (status >= 500) return "Server error. Please try again later.";
  return "Something went wrong. Please try again.";
}
