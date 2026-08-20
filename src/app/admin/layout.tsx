import Link from "next/link";

import { getSessionUser } from "@/lib/auth";
import AdminNav from "@/components/admin/AdminNav";

export const dynamic = "force-dynamic";

/**
 * Studio shell.
 *
 * The auth gate lives here so every page below it inherits it — a page added
 * later cannot accidentally ship unprotected. The API routes check
 * independently via requireAdmin(); this is the UI half, not the security
 * boundary.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();

  if (!user || user.role !== "ADMIN") {
    return (
      <section className="bg-champagne pb-28 pt-36 md:pb-40 md:pt-44">
        <div className="shell-narrow">
          <p className="label mb-5 text-wine">Studio</p>
          <h1 className="display-lg text-plum">Administrators only.</h1>
          <p className="measure mt-6 body-lg text-graphite/70">
            {user
              ? "This account does not have studio access."
              : "Sign in with a studio account to manage the catalogue, enquiries and orders."}
          </p>
          <Link href="/account" className="btn-gold mt-10 inline-flex">
            {user ? "Switch account" : "Sign in"}
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div className="min-h-screen bg-champagne pb-28 pt-28 md:pt-32">
      <div className="shell">
        <AdminNav name={user.name} />
        {children}
      </div>
    </div>
  );
}
