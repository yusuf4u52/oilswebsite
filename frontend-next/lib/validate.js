import { ApiError } from "@/lib/api-error";

// Shared request-body checks for API routes that accept client input directly
// (addresses, products) — previously these rules only existed in client-side
// form validation and could be bypassed by calling the API directly.

export function assertRequiredString(value, field) {
  if (typeof value !== "string" || !value.trim()) {
    throw new ApiError(400, `${field} is required`);
  }
}

export function assertMobile(value) {
  if (typeof value !== "string" || !/^\d{10}$/.test(value)) {
    throw new ApiError(400, "Enter a valid 10-digit mobile number");
  }
}

export function assertPincode(value) {
  if (typeof value !== "string" || !/^\d{6}$/.test(value)) {
    throw new ApiError(400, "Enter a valid 6-digit pincode");
  }
}
