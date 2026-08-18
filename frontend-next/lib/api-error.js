import { NextResponse } from "next/server";

// Mirrors FastAPI's HTTPException(status_code, detail) -> {"detail": "..."} JSON shape,
// which frontend-next/lib/api.js's error handling (err?.response?.data?.detail) depends on.
export class ApiError extends Error {
  constructor(status, detail) {
    super(detail);
    this.status = status;
    this.detail = detail;
  }
}

export function withApi(handler) {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (err) {
      if (err instanceof ApiError) {
        return NextResponse.json({ detail: err.detail }, { status: err.status });
      }
      console.error(err);
      return NextResponse.json({ detail: "Internal Server Error" }, { status: 500 });
    }
  };
}
