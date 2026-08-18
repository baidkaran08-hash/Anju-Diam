import type { Metadata } from "next";

import CartView from "@/components/CartView";

export const metadata: Metadata = {
  title: "Your Selection",
  robots: { index: false, follow: false },
};

export default function CartPage() {
  return (
    <section className="bg-ivory pb-28 pt-36 md:pb-40 md:pt-44">
      <div className="shell">
        <p className="label mb-5 text-wine">Your Selection</p>
        <h1 className="display-lg mb-14 text-plum">The pieces you are considering.</h1>
        <CartView />
      </div>
    </section>
  );
}
