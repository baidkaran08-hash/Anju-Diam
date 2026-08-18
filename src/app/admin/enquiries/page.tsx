import type { Metadata } from "next";

import AdminBoard from "@/components/AdminBoard";
import { prisma } from "@/lib/prisma";
import { mailIsConfigured } from "@/lib/mailer";

export const metadata: Metadata = { title: "Enquiries", robots: { index: false } };

export default async function AdminEnquiriesPage() {
  const [enquiries, orders] = await Promise.all([
    prisma.enquiry.findMany({ orderBy: { createdAt: "desc" }, take: 200 }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { items: { include: { product: { select: { name: true, slug: true } } } } },
    }),
  ]);

  return (
    <AdminBoard
      initialTab="enquiries"
      mailConfigured={mailIsConfigured()}
      enquiries={enquiries.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() }))}
      orders={orders.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() }))}
    />
  );
}
