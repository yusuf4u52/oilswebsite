import { NextResponse } from "next/server";
import { ApiError, withApi } from "@/lib/api-error";
import { requireAdmin } from "@/lib/auth/session";
import { storeImage } from "@/lib/services/uploads";
import { ALLOWED_IMAGE_TYPES, MAX_UPLOAD_SIZE } from "@/lib/config/env";
import { SITE_URL } from "@/constants/seo";

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
  // Use the canonical site origin, not the request's host: whatever domain
  // happens to serve this request (a Render deployment, a Vercel preview
  // URL, a custom domain) can change or disappear later, stranding the
  // stored URL. Dev still uses the request origin so localhost uploads
  // stay previewable without needing SITE_URL overridden locally.
  const origin = process.env.NODE_ENV === "production" ? SITE_URL : new URL(request.url).origin;
  return NextResponse.json({ url: `${origin}/api/uploads/${fileId}` });
});
