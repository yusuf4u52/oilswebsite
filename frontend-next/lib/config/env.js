// Single source of truth for server-side env vars, mirroring backend/server.py's config block.

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export const MONGO_URL = required("MONGO_URL");
export const DB_NAME = required("DB_NAME");
export const JWT_SECRET = required("JWT_SECRET");
export const JWT_ALG = process.env.JWT_ALGORITHM || "HS256";
export const ADMIN_EMAIL = required("ADMIN_EMAIL");
export const ADMIN_PASSWORD = required("ADMIN_PASSWORD");

export const GOOGLE_MODE = process.env.GOOGLE_MODE || "mock";
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";

export const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY || "";
export const ORDER_STATUS_TEMPLATES = {
  confirmed: process.env.MSG91_ORDER_CONFIRMED_TEMPLATE_ID || "",
  shipped: process.env.MSG91_ORDER_SHIPPED_TEMPLATE_ID || "",
  delivered: process.env.MSG91_ORDER_DELIVERED_TEMPLATE_ID || "",
  cancelled: process.env.MSG91_ORDER_CANCELLED_TEMPLATE_ID || "",
};

export const RAZORPAY_MODE = process.env.RAZORPAY_MODE || "mock";
export const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "";
export const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";
export const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || "";

export const EMAIL_MODE = process.env.EMAIL_MODE || "mock";
export const SMTP_HOST = process.env.SMTP_HOST || "";
export const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587", 10);
export const SMTP_USER = process.env.SMTP_USER || "";
export const SMTP_PASSWORD = process.env.SMTP_PASSWORD || "";
export const EMAIL_FROM = process.env.EMAIL_FROM || "";

export const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
export const MAX_UPLOAD_SIZE = 5 * 1024 * 1024; // 5MB
