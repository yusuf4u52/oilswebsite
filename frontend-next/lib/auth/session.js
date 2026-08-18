import { ApiError } from "@/lib/api-error";
import { decodeToken } from "@/lib/auth/jwt";
import { getDb } from "@/lib/db/connect";

function bearerToken(request) {
  const header = request.headers.get("authorization") || "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) return null;
  return token;
}

// Direct port of get_current_user in backend/server.py.
export async function getAuthUser(request) {
  const token = bearerToken(request);
  if (!token) throw new ApiError(401, "Not authenticated");
  let data;
  try {
    data = decodeToken(token);
  } catch {
    throw new ApiError(401, "Invalid token");
  }
  if (data.role === "admin") {
    return { id: data.sub, role: "admin", email: data.email };
  }
  const db = await getDb();
  const user = await db.collection("users").findOne({ id: data.sub }, { projection: { _id: 0 } });
  if (!user) throw new ApiError(401, "User not found");
  return user;
}

// Direct port of get_admin.
export async function requireAdmin(request) {
  const user = await getAuthUser(request);
  if (user.role !== "admin") throw new ApiError(403, "Admin only");
  return user;
}
