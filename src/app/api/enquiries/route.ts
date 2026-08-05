import { prisma } from "@/lib/prisma";
import { ok, fail, fromZod } from "@/lib/api";
import { enquirySchema } from "@/lib/validation";

/**
 * POST /api/enquiries — the contact and custom-commission form.
 * This is the lead-generation path named in the PRD's success metrics.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("Send the enquiry as JSON.");
  }

  const parsed = enquirySchema.safeParse(body);
  if (!parsed.success) return fromZod(parsed.error);

  const enquiry = await prisma.enquiry.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      category: parsed.data.category || null,
      message: parsed.data.message || "",
    },
    select: { id: true, createdAt: true },
  });

  // Hook a transactional email or WhatsApp notification in here when the
  // client picks a provider. Deliberately left out so the form never fails
  // for the customer because of a third-party outage.

  return ok({ id: enquiry.id, message: "Enquiry received." }, 201);
}
