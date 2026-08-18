import { OAuth2Client } from "google-auth-library";
import { ApiError } from "@/lib/api-error";
import { GOOGLE_MODE, GOOGLE_CLIENT_ID } from "@/lib/config/env";

// Live mode: verify a real Google ID token.
async function verifyLiveCredential(credential) {
  if (!GOOGLE_CLIENT_ID) throw new ApiError(502, "Google sign-in is not configured");
  const client = new OAuth2Client();
  let ticket;
  try {
    ticket = await client.verifyIdToken({ idToken: credential, audience: GOOGLE_CLIENT_ID });
  } catch {
    throw new ApiError(401, "Invalid Google credential");
  }
  const payload = ticket.getPayload();
  if (!payload?.email_verified) throw new ApiError(401, "Google email not verified");
  return {
    googleId: payload.sub,
    email: payload.email || "",
    name: payload.name || "",
    picture: payload.picture || "",
  };
}

// Mock mode (GOOGLE_MODE != "live"): `credential` is a JSON string standing in for a
// verified Google profile, so local dev/tests can exercise this flow without hitting Google.
function parseMockCredential(credential) {
  let profile;
  try {
    profile = JSON.parse(credential);
  } catch {
    throw new ApiError(400, "Invalid mock credential");
  }
  const googleId = profile.sub || profile.email || "";
  if (!googleId) throw new ApiError(400, "Mock credential needs a sub or email");
  return {
    googleId,
    email: profile.email || "",
    name: profile.name || "",
    picture: profile.picture || "",
  };
}

export async function resolveGoogleCredential(credential) {
  if (GOOGLE_MODE === "live") return verifyLiveCredential(credential);
  return parseMockCredential(credential);
}
