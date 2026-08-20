import type { Metadata } from "next";

import CheckoutForm from "@/components/CheckoutForm";

export const metadata: Metadata = {
  title: "Request Your Selection",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <section className="bg-champagne pb-28 pt-36 md:pb-40 md:pt-44">
      <div className="shell">
        <p className="label mb-5 text-wine">Almost There</p>
        <h1 className="display-lg text-plum">Where should we send it?</h1>
        <p className="measure mt-6 body-lg text-graphite/70">
          Everything is made to order, so this sends your selection to the atelier rather than
          charging a card. We confirm stones and sizing with you first.
        </p>

        <div className="mt-16">
          <CheckoutForm />
        </div>
      </div>
    </section>
  );
}
