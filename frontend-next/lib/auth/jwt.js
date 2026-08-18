import jwt from "jsonwebtoken";
import { JWT_SECRET, JWT_ALG } from "@/lib/config/env";

export function makeToken(payload, hours = 24 * 30) {
  const exp = Math.floor(Date.now() / 1000) + hours * 3600;
  return jwt.sign({ ...payload, exp }, JWT_SECRET, { algorithm: JWT_ALG, noTimestamp: true });
}

export function decodeToken(token) {
  return jwt.verify(token, JWT_SECRET, { algorithms: [JWT_ALG] });
}
