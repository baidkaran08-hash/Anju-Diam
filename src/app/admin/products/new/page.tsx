import type { Metadata } from "next";
import Link from "next/link";

import ProductForm from "@/components/admin/ProductForm";

export const metadata: Metadata = { title: "Add a piece", robots: { index: false } };

export default function NewProductPage() {
  return (
    <>
      <div className="mb-10">
        <Link href="/admin/products" className="label-sm text-graphite/45 hover:text-plum">
          ← Catalogue
        </Link>
        <h2 className="display-md mt-4 text-plum">Add a piece</h2>
      </div>

      <ProductForm />
    </>
  );
}
