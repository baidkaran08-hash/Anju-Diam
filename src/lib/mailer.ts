import "server-only";

import nodemailer, { type Transporter } from "nodemailer";

import { site } from "@/lib/site";
import { formatMoneyCompact } from "@/lib/money";
import { enquiryKindLabel, type EnquiryKind } from "@/lib/enums";

/**
 * Outbound mail.
 *
 * Configure with a Gmail account and an App Password (a normal Google password
 * will not work once 2FA is on):
 *
 *   SMTP_HOST=smtp.gmail.com
 *   SMTP_PORT=465
 *   SMTP_USER=enquiries@anjudiam.com
 *   SMTP_PASS=<16-character app password>
 *   ENQUIRY_INBOX=enquiries@anjudiam.com
 *
 * With SMTP_HOST unset — which is the default in development — every send is
 * logged to the console and reported as not delivered. Nothing throws, so the
 * enquiry flow is fully testable without credentials, and Enquiry.notified
 * honestly records that no alert went out.
 */

let cached: Transporter | null = null;

function transport(): Transporter | null {
  if (!process.env.SMTP_HOST) return null;
  if (cached) return cached;

  const port = Number(process.env.SMTP_PORT ?? 465);
  cached = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
  });
  return cached;
}

export const mailIsConfigured = () => Boolean(process.env.SMTP_HOST);

const houseInbox = () => process.env.ENQUIRY_INBOX ?? process.env.SMTP_USER ?? site.email;
const fromAddress = () => `"${site.name}" <${process.env.SMTP_USER ?? site.email}>`;

type SendResult = { delivered: boolean; reason?: string };

async function send(options: {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}): Promise<SendResult> {
  const mailer = transport();

  if (!mailer) {
    console.info(
      `[mail] SMTP not configured — would have sent "${options.subject}" to ${options.to}`,
    );
    return { delivered: false, reason: "SMTP not configured" };
  }

  try {
    await mailer.sendMail({ from: fromAddress(), ...options });
    return { delivered: true };
  } catch (error) {
    // A failed alert must never fail the customer's submission — the enquiry is
    // already committed to the database by the time we get here.
    console.error("[mail] send failed:", error);
    return { delivered: false, reason: error instanceof Error ? error.message : "unknown" };
  }
}

// ── Templates ───────────────────────────────────────────────────────────────

const PLUM = "#4F243C";
const GOLD = "#C8A46A";
const IVORY = "#F8F5F1";
const GRAPHITE = "#2D2B2C";

function shell(heading: string, body: string) {
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:${IVORY};font-family:Helvetica,Arial,sans-serif;color:${GRAPHITE}">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${IVORY};padding:32px 16px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#ffffff;border:1px solid #E7E0D8">
        <tr><td style="background:${PLUM};padding:28px 32px">
          <div style="color:${GOLD};font-size:11px;letter-spacing:.26em;text-transform:uppercase">${site.name}</div>
          <div style="color:${IVORY};font-size:22px;margin-top:10px;font-family:Georgia,serif">${heading}</div>
        </td></tr>
        <tr><td style="padding:32px">${body}</td></tr>
        <tr><td style="padding:20px 32px;border-top:1px solid #E7E0D8;font-size:11px;color:#8A827A">
          ${site.legalName} · ${site.city}, ${site.country}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function row(label: string, value: string) {
  return `<tr>
    <td style="padding:9px 0;width:150px;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#8A827A;vertical-align:top">${label}</td>
    <td style="padding:9px 0;font-size:14px;color:${GRAPHITE};vertical-align:top">${escapeHtml(value)}</td>
  </tr>`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ── Enquiries ───────────────────────────────────────────────────────────────

export type EnquiryPayload = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  kind: EnquiryKind;
  subject?: string | null;
  message: string;
  budget?: string | null;
};

/** Alert to the house inbox. Reply-To is the customer, so a reply just works. */
export async function sendEnquiryAlert(enquiry: EnquiryPayload): Promise<SendResult> {
  const rows = [
    row("Name", enquiry.name),
    row("Email", enquiry.email),
    enquiry.phone ? row("Phone", enquiry.phone) : "",
    row("Type", enquiryKindLabel[enquiry.kind]),
    enquiry.subject ? row("Regarding", enquiry.subject) : "",
    enquiry.budget ? row("Budget", enquiry.budget) : "",
    row("Reference", enquiry.id),
  ].join("");

  const html = shell(
    "New enquiry",
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
     <div style="margin-top:24px;padding-top:24px;border-top:1px solid #E7E0D8">
       <div style="font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#8A827A;margin-bottom:10px">Message</div>
       <div style="font-size:14px;line-height:1.7;white-space:pre-wrap">${escapeHtml(enquiry.message)}</div>
     </div>`,
  );

  return send({
    to: houseInbox(),
    replyTo: `"${enquiry.name}" <${enquiry.email}>`,
    subject: `New ${enquiryKindLabel[enquiry.kind].toLowerCase()} — ${enquiry.name}`,
    html,
    text: `${enquiry.name} <${enquiry.email}>\n${enquiry.phone ?? ""}\n\n${enquiry.message}`,
  });
}

/** Acknowledgement to the customer. */
export async function sendEnquiryAcknowledgement(enquiry: EnquiryPayload): Promise<SendResult> {
  const html = shell(
    "Thank you for writing to us",
    `<p style="font-size:15px;line-height:1.75;margin:0 0 18px">Dear ${escapeHtml(enquiry.name)},</p>
     <p style="font-size:15px;line-height:1.75;margin:0 0 18px">
       We have received your enquiry and a member of the house will respond personally within one business day.
     </p>
     <p style="font-size:15px;line-height:1.75;margin:0 0 26px">
       Every Anju Diam piece is handcrafted in 18-karat gold and set with natural diamonds of G colour or higher and VS clarity or above. If your enquiry concerns a bespoke commission, we will come back to you with sketches and a stone selection to consider.
     </p>
     <div style="padding:18px;background:${IVORY};border-left:2px solid ${GOLD}">
       <div style="font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#8A827A;margin-bottom:8px">Your message</div>
       <div style="font-size:14px;line-height:1.7;white-space:pre-wrap">${escapeHtml(enquiry.message)}</div>
     </div>
     <p style="font-size:13px;line-height:1.7;margin:26px 0 0;color:#8A827A">Reference ${enquiry.id}</p>`,
  );

  return send({
    to: enquiry.email,
    replyTo: houseInbox(),
    subject: `We have your enquiry — ${site.name}`,
    html,
    text: `Dear ${enquiry.name},\n\nWe have received your enquiry and will respond within one business day.\n\nReference ${enquiry.id}\n\n${site.legalName}`,
  });
}

// ── Orders ──────────────────────────────────────────────────────────────────

export type OrderPayload = {
  reference: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  totalMinor: number;
  currency: string;
  items: { name: string; quantity: number; unitPriceMinor: number; note?: string | null }[];
  shipping: { line1: string; city: string; post: string; country: string };
  message?: string | null;
};

function itemRows(order: OrderPayload) {
  return order.items
    .map(
      (item) => `<tr>
        <td style="padding:11px 0;border-bottom:1px solid #EFEAE3;font-size:14px">
          ${escapeHtml(item.name)}${item.note ? `<div style="font-size:12px;color:#8A827A;margin-top:4px">${escapeHtml(item.note)}</div>` : ""}
        </td>
        <td style="padding:11px 0;border-bottom:1px solid #EFEAE3;font-size:14px;text-align:center;width:44px">${item.quantity}</td>
        <td style="padding:11px 0;border-bottom:1px solid #EFEAE3;font-size:14px;text-align:right;width:120px">${formatMoneyCompact(item.unitPriceMinor * item.quantity, order.currency)}</td>
      </tr>`,
    )
    .join("");
}

export async function sendOrderAlert(order: OrderPayload): Promise<SendResult> {
  const html = shell(
    `Selection ${order.reference}`,
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
       ${row("Client", order.customerName)}
       ${row("Email", order.customerEmail)}
       ${order.customerPhone ? row("Phone", order.customerPhone) : ""}
       ${row("Ship to", `${order.shipping.line1}, ${order.shipping.city} ${order.shipping.post}, ${order.shipping.country}`)}
     </table>
     <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px">
       ${itemRows(order)}
       <tr>
         <td style="padding:14px 0;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#8A827A">Total</td>
         <td></td>
         <td style="padding:14px 0;font-size:16px;text-align:right;color:${PLUM}">${formatMoneyCompact(order.totalMinor, order.currency)}</td>
       </tr>
     </table>
     ${
       order.message
         ? `<div style="margin-top:18px;padding:16px;background:${IVORY}">
              <div style="font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#8A827A;margin-bottom:8px">Client note</div>
              <div style="font-size:14px;line-height:1.7;white-space:pre-wrap">${escapeHtml(order.message)}</div>
            </div>`
         : ""
     }`,
  );

  return send({
    to: houseInbox(),
    replyTo: `"${order.customerName}" <${order.customerEmail}>`,
    subject: `Selection ${order.reference} — ${order.customerName}`,
    html,
    text: `Selection ${order.reference}\n${order.customerName} <${order.customerEmail}>\nTotal ${formatMoneyCompact(order.totalMinor, order.currency)}`,
  });
}

export async function sendOrderAcknowledgement(order: OrderPayload): Promise<SendResult> {
  const html = shell(
    "Your selection is with us",
    `<p style="font-size:15px;line-height:1.75;margin:0 0 18px">Dear ${escapeHtml(order.customerName)},</p>
     <p style="font-size:15px;line-height:1.75;margin:0 0 18px">
       Thank you for your selection. Reference <strong>${order.reference}</strong>.
     </p>
     <p style="font-size:15px;line-height:1.75;margin:0 0 26px">
       Because each piece is made to order, we confirm stone availability and final sizing with you before any payment is taken. A member of the house will be in touch within one business day to complete the details.
     </p>
     <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
       ${itemRows(order)}
       <tr>
         <td style="padding:14px 0;font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#8A827A">Indicative total</td>
         <td></td>
         <td style="padding:14px 0;font-size:16px;text-align:right;color:${PLUM}">${formatMoneyCompact(order.totalMinor, order.currency)}</td>
       </tr>
     </table>`,
  );

  return send({
    to: order.customerEmail,
    replyTo: houseInbox(),
    subject: `Your selection ${order.reference} — ${site.name}`,
    html,
    text: `Dear ${order.customerName},\n\nThank you for your selection, reference ${order.reference}. We will confirm stone availability and sizing before any payment is taken.\n\n${site.legalName}`,
  });
}
