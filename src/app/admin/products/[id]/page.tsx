import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import ProductForm from "@/components/admin/ProductForm";
import { getProductForEdit } from "@/lib/admin-products";

export const metadata: Metadata = { title: "Edit piece", robots: { index: false } };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProductForEdit(id);
  if (!product) notFound();

  return (
    <>
      <div className="mb-10">
        <Link href="/admin/products" className="label-sm text-graphite/45 hover:text-plum">
          ← Catalogue
        </Link>
        <h2 className="display-md mt-4 text-plum">{product.name}</h2>
        <p className="label-sm mt-3 text-graphite/40">
          /products/{product.slug} · last saved{" "}
          {product.updatedAt.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
        </p>
      </div>

      <ProductForm
        product={{
          ...product,
          // Dates do not survive the server-to-client boundary as Dates, and
          // the date input wants yyyy-mm-dd anyway.
          certificates: product.certificates.map((certificate) => ({
            ...certificate,
            issuedOn: certificate.issuedOn
              ? certificate.issuedOn.toISOString().slice(0, 10)
              : null,
          })),
        }}
      />
    </>
  );
}
