import type { Metadata } from "next";

import ChangePasswordForm from "@/components/admin/ChangePasswordForm";
import { getSessionUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Password", robots: { index: false } };

export default async function AdminAccountPage() {
  // The layout already gates /admin; this only needs the address to show.
  const user = await getSessionUser();

  return (
    <section>
      <h2 className="display-sm mb-3 text-plum">Change password</h2>
      <p className="measure mb-10 text-graphite/60">
        Pick something you will not forget, or keep it in a password manager. You will be asked for the
        current password first.
      </p>
      <ChangePasswordForm email={user?.email ?? ""} />
    </section>
  );
}
