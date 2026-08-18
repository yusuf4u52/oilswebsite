import { ApiError, withApi } from "@/lib/api-error";
import { streamImage } from "@/lib/services/uploads";

export const runtime = "nodejs";

export const GET = withApi(async (request, { params }) => {
  const { fileId } = await params;
  const result = await streamImage(fileId);
  if (!result) throw new ApiError(404, "Image not found");
  return new Response(result.buffer, {
    status: 200,
    headers: {
      "Content-Type": result.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
});
