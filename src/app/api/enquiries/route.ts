import { prisma } from "@/lib/prisma";
import { enquirySchema } from "@/lib/validation";
import { fail, ok, readJson, route } from "@/lib/api";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { sendEnquiryAcknowledgement, sendEnquiryAlert } from "@/lib/mailer";
import type { EnquiryKind } from "@/lib/enums";

export const POST = route(async (request: Request) => {
  const limit = rateLimit(`enquiry:${clientIp(request)}`, 5, 60 * 60 * 1000);
  if (!limit.ok) {
    return fail("We already have your message. Please give us a little time to reply.", 429);
  }

  const input = enquirySchema.parse(await readJson(request));

  // Honeypot: a filled `company` field means a bot. Answer 201 so the bot
  // records a success and does not retry with a different shape.
  if (input.company) return ok({ ok: true }, { status: 201 });

  const enquiry = await prisma.enquiry.create({
    data: {
      name: input.name,
      email: input.email,
      phone: input.phone || null,
      kind: input.kind,
      subject: input.subject || null,
      message: input.message,
      budget: input.budget || null,
    },
  });

  // The enquiry is already safe in the database, so mail is best-effort: a
  // dead SMTP host must never cost the house a lead.
  const payload = { ...enquiry, kind: enquiry.kind as EnquiryKind };
  const [alert] = await Promise.all([
    sendEnquiryAlert(payload),
    sendEnquiryAcknowledgement(payload),
  ]);

  if (alert.delivered) {
    await prisma.enquiry.update({ where: { id: enquiry.id }, data: { notified: true } });
  }

  return ok({ ok: true, reference: enquiry.id, notified: alert.delivered }, { status: 201 });
});
