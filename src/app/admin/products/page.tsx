import type { Metadata } from "next";
import { Suspense } from "react";

import ProductTable from "@/components/admin/ProductTable";
import { listProductsForAdmin } from "@/lib/admin-products";

export const metadata: Metadata = { title: "Catalogue", robots: { index: false } };

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const str = (key: string) => (typeof raw[key] === "string" ? (raw[key] as string) : undefined);

  const result = await listProductsForAdmin({
    q: str("q"),
    category: str("category"),
    status: str("status"),
    attention: str("attention"),
    page: str("page") ? Number(str("page")) : 1,
    perPage: 25,
  });

  return (
    <Suspense fallback={<div className="h-96 shimmering" />}>
      <ProductTable
        rows={result.items.map((row) => ({ ...row, updatedAt: row.updatedAt.toISOString() }))}
        total={result.total}
        page={result.page}
        pages={result.pages}
        statusCounts={result.statusCounts}
      />
    </Suspense>
  );
}
