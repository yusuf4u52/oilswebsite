import { NextResponse } from "next/server";
import { ApiError, withApi } from "@/lib/api-error";
import { requireAdmin } from "@/lib/auth/session";
import { storeImage } from "@/lib/services/uploads";
import { ALLOWED_IMAGE_TYPES, MAX_UPLOAD_SIZE } from "@/lib/config/env";

export const runtime = "nodejs";

export const POST = withApi(async (request) => {
  await requireAdmin(request);
  const formData = await request.formData();
  const file = formData.get("file");
  if (!file || typeof file === "string") throw new ApiError(400, "Only JPEG, PNG, WEBP or GIF images are allowed");
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new ApiError(400, "Only JPEG, PNG, WEBP or GIF images are allowed");
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.length > MAX_UPLOAD_SIZE) {
    throw new ApiError(400, "Image must be smaller than 5MB");
  }
  const fileId = await storeImage(buffer, file.type, file.name || "upload");
  // Relative, not absolute: an absolute URL bakes in whatever domain served
  // this request, which breaks if the app is later reachable elsewhere (a
  // Render deployment, a Vercel preview, a domain swap) — see the
  // oilswebsite.onrender.com and localhost:8000 incidents. next/image
  // resolves a relative src same-origin with no remotePatterns needed.
  // Contexts that need an absolute URL (JSON-LD, OG tags) resolve it via
  // toAbsoluteUrl() at render time instead.
  return NextResponse.json({ url: `/api/uploads/${fileId}` });
});
