import nodemailer from "nodemailer";
import { EMAIL_MODE, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, EMAIL_FROM, ADMIN_EMAIL } from "@/lib/config/env";
import { SITE_URL } from "@/constants/seo";

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

// Brand tokens mirrored from app/globals.css (:root custom properties) -
// email clients can't load that stylesheet, so values are inlined here.
const BRAND = "#1B4332";
const AMBER = "#D97706";
const INK = "#1C1917";
const INK_2 = "#57534E";
const LINE = "#E7E5DF";
const BG = "#FDFBF7";
const BG_2 = "#F3EFE6";
const SERIF_FONT = "Georgia, 'Times New Roman', serif";
const SANS_FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

const ORDER_STATUS_EMAIL_SUBJECTS = {
  confirmed: "Your Premium Oils order is confirmed",
  shipped: "Your Premium Oils order has shipped",
  delivered: "Your Premium Oils order has been delivered",
  cancelled: "Your Premium Oils order has been cancelled",
};

const STATUS_BADGES = {
  confirmed: { label: "Confirmed", bg: "#EAF3EE", color: BRAND },
  shipped: { label: "Shipped", bg: "#FDF1E3", color: AMBER },
  delivered: { label: "Delivered", bg: "#EAF3EE", color: BRAND },
  cancelled: { label: "Cancelled", bg: "#FCEAEA", color: "#B91C1C" },
};

function escapeHtml(value) {
  const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  return String(value ?? "").replace(/[&<>"']/g, (c) => map[c]);
}

function formatInr(amount) {
  return `₹${new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount || 0)}`;
}

function orderRef(order) {
  return (order.id || "").slice(0, 8).toUpperCase();
}

function statusBadge(status) {
  const meta = STATUS_BADGES[status];
  if (!meta) return "";
  return `<span style="display:inline-block;padding:6px 14px;border-radius:9999px;background:${meta.bg};color:${meta.color};font-family:${SANS_FONT};font-size:12px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;">${escapeHtml(meta.label)}</span>`;
}

function ctaButton(href, label) {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 4px;">
      <tr>
        <td style="border-radius:9999px;background:${BRAND};">
          <a href="${href}" style="display:inline-block;padding:13px 30px;font-family:${SANS_FONT};font-size:14px;font-weight:600;color:${BG};text-decoration:none;border-radius:9999px;">${escapeHtml(label)}</a>
        </td>
      </tr>
    </table>`;
}

function summaryRow(label, value, emphasize) {
  const pad = emphasize ? "14px 0 0" : "4px 0";
  const size = emphasize ? "15px" : "13px";
  const color = emphasize ? INK : INK_2;
  const weight = emphasize ? "700" : "400";
  return `
    <tr>
      <td style="padding:${pad};font-family:${SANS_FONT};font-size:${size};color:${color};font-weight:${weight};">${label}</td>
      <td style="padding:${pad};font-family:${SANS_FONT};font-size:${size};color:${color};font-weight:${weight};text-align:right;">${value}</td>
    </tr>`;
}

function orderItemsTable(order) {
  const rows = (order.items || [])
    .map((item) => {
      const lineTotal = (item.price || 0) * (item.qty || 0);
      return `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid ${LINE};font-family:${SANS_FONT};font-size:14px;color:${INK};">
          ${escapeHtml(item.name)}
          <div style="font-size:12px;color:${INK_2};margin-top:2px;">${escapeHtml(item.size)} &times; ${item.qty || 0}</div>
        </td>
        <td style="padding:12px 0;border-bottom:1px solid ${LINE};font-family:${SANS_FONT};font-size:14px;color:${INK};text-align:right;white-space:nowrap;">${formatInr(lineTotal)}</td>
      </tr>`;
    })
    .join("");

  const hasBreakdown = order.subtotal != null && order.delivery_fee != null;
  const summaryRows = hasBreakdown
    ? summaryRow("Subtotal", formatInr(order.subtotal)) +
      summaryRow("Delivery", order.delivery_fee ? formatInr(order.delivery_fee) : "Free") +
      summaryRow("Total", formatInr(order.total), true)
    : summaryRow("Total", formatInr(order.total), true);

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">${rows}</table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;border-top:2px solid ${BRAND};margin-top:4px;">${summaryRows}</table>`;
}

function addressBlock(address) {
  if (!address) return "";
  const line2 = address.line2 ? `${escapeHtml(address.line2)}<br/>` : "";
  return `
    <p style="margin:0;font-family:${SANS_FONT};font-size:13px;color:${INK_2};line-height:1.6;">
      ${escapeHtml(address.name)}<br/>
      ${escapeHtml(address.line1)}<br/>
      ${line2}${escapeHtml(address.city)}, ${escapeHtml(address.state)} ${escapeHtml(address.pincode)}
    </p>`;
}

function emailShell({ preheader, heading, badgeHtml, bodyHtml, ctaHtml }) {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Premium Oils</title>
  </head>
  <body style="margin:0;padding:0;background:${BG_2};">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader || "")}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;background:${BG_2};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:${BG};border:1px solid ${LINE};border-radius:12px;overflow:hidden;">
            <tr>
              <td align="center" style="padding:32px 32px 20px;">
                <img src="${SITE_URL}/logo.png" width="160" alt="Premium Oils" style="display:block;width:160px;max-width:60%;height:auto;" />
              </td>
            </tr>
            <tr><td style="height:4px;line-height:4px;font-size:0;background:${AMBER};">&nbsp;</td></tr>
            <tr>
              <td style="padding:36px 32px 8px;">
                ${badgeHtml ? `<div style="margin-bottom:14px;">${badgeHtml}</div>` : ""}
                <h1 style="margin:0 0 12px;font-family:${SERIF_FONT};font-size:24px;font-weight:600;color:${INK};">${escapeHtml(heading)}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 36px;">
                ${bodyHtml}
                ${ctaHtml || ""}
              </td>
            </tr>
            <tr><td style="border-top:1px solid ${LINE};"></td></tr>
            <tr>
              <td style="padding:24px 32px;">
                <p style="margin:0;font-family:${SANS_FONT};font-size:12px;color:${INK_2};line-height:1.6;">
                  Premium Oils &middot; Cold-pressed &amp; wood-pressed edible oils<br/>
                  This is an automated email &mdash; please don't reply directly to this address.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export async function sendOrderConfirmationEmail(order) {
  const to = order.user_email || "";
  if (!to) return;
  const ref = orderRef(order);
  const subject = ORDER_STATUS_EMAIL_SUBJECTS.confirmed;
  const bodyHtml = `
    <p style="margin:0 0 20px;font-family:${SANS_FONT};font-size:14px;color:${INK_2};line-height:1.6;">
      Thank you for shopping with us. Order <strong style="color:${INK};">#${ref}</strong> is confirmed and being prepared. We'll email you again the moment it ships.
    </p>
    ${orderItemsTable(order)}`;
  const html = emailShell({
    preheader: `Order #${ref} is confirmed - thank you for your purchase!`,
    heading: "Thank you for your order!",
    badgeHtml: statusBadge("confirmed"),
    bodyHtml,
    ctaHtml: ctaButton(`${SITE_URL}/orders`, "View your order"),
  });
  if (!(await sendEmail(to, subject, html))) {
    console.error(`Order confirmation email failed: order=${order.id} email=${to}`);
  }
}

const ORDER_STATUS_INTRO = {
  shipped: "Good news — your order is on its way.",
  delivered: "Your order has been delivered. We hope you enjoy it!",
  cancelled: "This order has been cancelled.",
};

export async function sendOrderStatusEmail(order, status) {
  const to = order.user_email || "";
  const subject = ORDER_STATUS_EMAIL_SUBJECTS[status];
  if (!to || !subject) return;
  const ref = orderRef(order);
  const bodyHtml = `
    <p style="margin:0 0 20px;font-family:${SANS_FONT};font-size:14px;color:${INK_2};line-height:1.6;">
      ${ORDER_STATUS_INTRO[status] || ""} Order <strong style="color:${INK};">#${ref}</strong>.
    </p>
    ${orderItemsTable(order)}`;
  const html = emailShell({
    preheader: `Order #${ref} — ${subject}`,
    heading: subject,
    badgeHtml: statusBadge(status),
    bodyHtml,
    ctaHtml: ctaButton(`${SITE_URL}/orders`, "View your order"),
  });
  if (!(await sendEmail(to, subject, html))) {
    console.error(`Order status email failed: order=${order.id} status=${status} email=${to}`);
  }
}

export async function sendAdminNewOrderEmail(order) {
  if (!ADMIN_EMAIL) return;
  const ref = orderRef(order);
  const paymentLabel = order.payment_method === "cod" ? "Cash on Delivery" : "Prepaid (Razorpay)";
  const subject = `New order #${ref} — ${formatInr(order.total)}`;
  const bodyHtml = `
    <p style="margin:0 0 20px;font-family:${SANS_FONT};font-size:14px;color:${INK_2};line-height:1.6;">
      Payment method: <strong style="color:${INK};">${escapeHtml(paymentLabel)}</strong>
    </p>
    ${orderItemsTable(order)}
    <div style="margin-top:24px;padding-top:20px;border-top:1px solid ${LINE};">
      <div style="font-family:${SANS_FONT};font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:${INK_2};margin-bottom:8px;">Ship to</div>
      ${addressBlock(order.address)}
    </div>`;
  const html = emailShell({
    preheader: `New order #${ref} — ${formatInr(order.total)}`,
    heading: "New order received",
    badgeHtml: "",
    bodyHtml,
    ctaHtml: ctaButton(`${SITE_URL}/admin`, "Open admin dashboard"),
  });
  if (!(await sendEmail(ADMIN_EMAIL, subject, html))) {
    console.error(`Admin new-order email failed: order=${order.id}`);
  }
}
