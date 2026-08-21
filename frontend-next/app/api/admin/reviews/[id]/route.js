import { NextResponse } from "next/server";
import { withApi } from "@/lib/api-error";
import { requireAdmin } from "@/lib/auth/session";
import { deleteReview } from "@/lib/services/reviews";

export const runtime = "nodejs";

export const DELETE = withApi(async (request, { params }) => {
  await requireAdmin(request);
  const { id } = await params;
  const deleted = await deleteReview(id);
  return NextResponse.json({ deleted });
});
