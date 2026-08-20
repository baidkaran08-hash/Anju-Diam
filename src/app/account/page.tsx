import type { Metadata } from "next";

import AccountPanel from "@/components/AccountPanel";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "My Account",
  robots: { index: false, follow: false },
};

// Session state must never be served from a cache.
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await getSessionUser();

  const orders = user
    ? await prisma.order.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        include: { items: { include: { product: { select: { name: true, slug: true } } } } },
      })
    : [];

  return (
    <section className="bg-champagne pb-28 pt-36 md:pb-40 md:pt-44">
      <div className="shell">
        <p className="label mb-5 text-wine">Account</p>
        <h1 className="display-lg mb-14 text-plum">
          {user ? "Your file with the house." : "Sign in."}
        </h1>

        <AccountPanel
          user={user}
          orders={orders.map((order) => ({
            ...order,
            createdAt: order.createdAt.toISOString(),
          }))}
        />
      </div>
    </section>
  );
}
