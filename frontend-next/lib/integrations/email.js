import nodemailer from "nodemailer";
import { EMAIL_MODE, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, EMAIL_FROM, ADMIN_EMAIL } from "@/lib/config/env";

// Best-effort send - never throws into the caller. Mirrors backend/server.py's _send_email.
async function sendEmail(toEmail, subject, htmlBody) {
  if (!toEmail) return false;
  if (EMAIL_MODE !== "live") {
    console.info(`Email (mock): to=${toEmail} subject=${subject}`);
    return true;
  }
  if (!(SMTP_HOST && SMTP_USER && SMTP_PASSWORD && EMAIL_FROM)) {
    console.error(`Email send skipped - SMTP not configured: to=${toEmail} subject=${subject}`);
    return false;
  }
  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
      connectionTimeout: 10000,
    });
    await transporter.sendMail({ from: EMAIL_FROM, to: toEmail, subject, html: htmlBody });
    return true;
  } catch (err) {
    console.error(`SMTP send failed: to=${toEmail} subject=${subject}`, err);
    return false;
  }
}

const ORDER_STATUS_EMAIL_SUBJECTS = {
  confirmed: "Your Premium Oils order is confirmed",
  shipped: "Your Premium Oils order has shipped",
  delivered: "Your Premium Oils order has been delivered",
  cancelled: "Your Premium Oils order has been cancelled",
};

function orderItemsHtml(order) {
  const rows = (order.items || [])
    .map((i) => {
      const lineTotal = ((i.price || 0) * (i.qty || 0)).toFixed(2);
      return `<tr><td style='padding:4px 8px;'>${i.name || ""} (${i.size || ""}) x${i.qty || 0}</td><td style='padding:4px 8px;text-align:right;'>₹${lineTotal}</td></tr>`;
    })
    .join("");
  return `<table style='width:100%;border-collapse:collapse;'>${rows}</table>`;
}

export async function sendOrderConfirmationEmail(order) {
  const to = order.user_email || "";
  if (!to) return;
  const orderId = order.id || "";
  const subject = ORDER_STATUS_EMAIL_SUBJECTS.confirmed;
  const body =
    "<div style='font-family:sans-serif;max-width:520px;margin:auto;'>" +
    "<h2>Thank you for your order!</h2>" +
    `<p>Order <strong>#${orderId.slice(0, 8)}</strong> is confirmed.</p>` +
    orderItemsHtml(order) +
    `<p style='text-align:right;font-weight:bold;'>Total: ₹${(order.total || 0).toFixed(2)}</p>` +
    "<p>We'll email you again once your order ships.</p>" +
    "</div>";
  if (!(await sendEmail(to, subject, body))) {
    console.error(`Order confirmation email failed: order=${orderId} email=${to}`);
  }
}

export async function sendOrderStatusEmail(order, status) {
  const to = order.user_email || "";
  const subject = ORDER_STATUS_EMAIL_SUBJECTS[status];
  if (!to || !subject) return;
  const orderId = order.id || "";
  const body =
    "<div style='font-family:sans-serif;max-width:520px;margin:auto;'>" +
    `<h2>${subject}</h2>` +
    `<p>Order <strong>#${orderId.slice(0, 8)}</strong> status: <strong>${status.charAt(0).toUpperCase()}${status.slice(1)}</strong></p>` +
    orderItemsHtml(order) +
    "</div>";
  if (!(await sendEmail(to, subject, body))) {
    console.error(`Order status email failed: order=${orderId} status=${status} email=${to}`);
  }
}

export async function sendAdminNewOrderEmail(order) {
  if (!ADMIN_EMAIL) return;
  const orderId = order.id || "";
  const address = order.address || {};
  const subject = `New order #${orderId.slice(0, 8)} - ₹${(order.total || 0).toFixed(2)}`;
  const body =
    "<div style='font-family:sans-serif;max-width:520px;margin:auto;'>" +
    "<h2>New order received</h2>" +
    `<p>Order <strong>#${orderId.slice(0, 8)}</strong> &mdash; ${order.payment_method || ""}</p>` +
    orderItemsHtml(order) +
    `<p style='text-align:right;font-weight:bold;'>Total: ₹${(order.total || 0).toFixed(2)}</p>` +
    `<p>Ship to: ${address.name || ""}, ${address.line1 || ""}, ${address.city || ""} ${address.pincode || ""}</p>` +
    "</div>";
  if (!(await sendEmail(ADMIN_EMAIL, subject, body))) {
    console.error(`Admin new-order email failed: order=${orderId}`);
  }
}
