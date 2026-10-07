import type { Metadata } from "next";
import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { studioSummary } from "@/lib/admin-products";
import { mailIsConfigured } from "@/lib/mailer";
import { formatMoneyCompact } from "@/lib/money";
import { enquiryKindLabel, type EnquiryKind } from "@/lib/enums";
import { LOW_STOCK_AT } from "@/lib/stock";

export const metadata: Metadata = { title: "Studio", robots: { index: false } };

export default async function StudioOverview() {
  const [summary, recentEnquiries, recentOrders] = await Promise.all([
    studioSummary(),
    prisma.enquiry.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
  ]);

  const photoShare =
    summary.products > 0 ? Math.round((summary.withPhotos / summary.products) * 100) : 0;

  const attention =
    summary.outOfStock + summary.lowStock + summary.unpriced + summary.missingPhotos;

  return (
    <div className="space-y-14">
      {!mailIsConfigured() && (
        <p className="border-l-2 border-gold bg-ivory px-5 py-4 text-sm font-light text-graphite/75">
          <strong className="font-medium">Email alerts are off.</strong> Enquiries are being stored
          here, but nothing is leaving the server. Set <code className="text-xs">SMTP_HOST</code>,{" "}
          <code className="text-xs">SMTP_USER</code> and <code className="text-xs">SMTP_PASS</code>{" "}
          to switch them on.
        </p>
      )}

      <section>
        <h2 className="label mb-6 text-wine">Catalogue</h2>
        <div className="grid gap-px overflow-hidden border border-graphite/12 bg-graphite/12 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Pieces" value={String(summary.products)} href="/admin/products" />
          <Stat
            label="Live on the site"
            value={String(summary.active)}
            href="/admin/products?status=ACTIVE"
          />
          <Stat label="Drafts" value={String(summary.draft)} href="/admin/products?status=DRAFT" />
          <Stat
            label="Archived"
            value={String(summary.archived)}
            href="/admin/products?status=ARCHIVED"
          />
        </div>

        <div className="mt-5 border border-graphite/12 bg-ivory p-6">
          <div className="flex items-baseline justify-between gap-4">
            <p className="label-sm text-graphite/45">Pieces with real photography</p>
            <p className="text-sm tabular-nums text-plum">
              {summary.withPhotos} of {summary.products} · {photoShare}%
            </p>
          </div>
          <div className="mt-4 h-1 w-full overflow-hidden bg-graphite/10">
            <div className="h-full bg-gold" style={{ width: `${photoShare}%` }} />
          </div>
          <p className="mt-4 text-xs font-light leading-relaxed text-graphite/55">
            Everything without a photograph falls back to generated artwork. Open a piece and
            upload photographs to replace it — nothing else needs changing.
          </p>
        </div>
      </section>

      {/* ── Needs attention ─────────────────────────────────────────────
          Every tile is a link to the list behind it. A dashboard that only
          shows a number leaves the reader to work out which pieces it meant. */}
      <section>
        <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="label text-wine">Needs attention</h2>
          {attention === 0 && (
            <p className="label-sm text-graphite/40">Nothing outstanding</p>
          )}
        </div>

        <div className="grid gap-px overflow-hidden border border-graphite/12 bg-graphite/12 sm:grid-cols-2 lg:grid-cols-4">
          <Alert
            label="Spoken for"
            value={summary.outOfStock}
            href="/admin/products?attention=out-of-stock"
            note="Live, counted, nothing left"
            tone="critical"
          />
          <Alert
            label="Running low"
            value={summary.lowStock}
            href="/admin/products?attention=low-stock"
            note={`2 to ${LOW_STOCK_AT} left of a repeatable line`}
            tone="warning"
          />
          <Alert
            label="Live without a price"
            value={summary.unpriced}
            href="/admin/products?attention=unpriced"
            note="Showing ฿0 to customers"
            tone="critical"
          />
          <Alert
            label="No photograph"
            value={summary.missingPhotos}
            href="/admin/products?attention=no-photo"
            note="Falling back to artwork"
            tone="warning"
          />
        </div>
      </section>

      <section>
        <h2 className="label mb-6 text-wine">Coming in</h2>
        <div className="grid gap-px overflow-hidden border border-graphite/12 bg-graphite/12 sm:grid-cols-3">
          <Stat label="New enquiries" value={String(summary.enquiriesNew)} href="/admin/enquiries" />
          <Stat label="Pending selections" value={String(summary.ordersPending)} href="/admin/orders" />
          <Stat label="Selection value" value={formatMoneyCompact(summary.orderValueMinor)} href="/admin/orders" />
        </div>
      </section>

      <div className="grid gap-10 lg:grid-cols-2">
        <section>
          <div className="mb-5 flex items-baseline justify-between">
            <h2 className="label text-wine">Latest enquiries</h2>
            <Link href="/admin/enquiries" className="label-sm text-plum hover:text-wine">
              All →
            </Link>
          </div>

          {recentEnquiries.length === 0 ? (
            <Empty>No enquiries yet.</Empty>
          ) : (
            <ul className="divide-y divide-graphite/10 border-y border-graphite/12 bg-ivory">
              {recentEnquiries.map((row) => (
                <li key={row.id} className="flex items-baseline justify-between gap-4 p-4">
                  <div className="min-w-0">
                    <p className="text-sm text-plum">{row.name}</p>
                    <p className="label-sm mt-1.5 text-graphite/40">
                      {enquiryKindLabel[row.kind as EnquiryKind] ?? row.kind}
                    </p>
                  </div>
                  <span className="label-sm shrink-0 text-gold-deep">{row.status.replace("_", " ")}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <div className="mb-5 flex items-baseline justify-between">
            <h2 className="label text-wine">Latest selections</h2>
            <Link href="/admin/orders" className="label-sm text-plum hover:text-wine">
              All →
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <Empty>No selections yet.</Empty>
          ) : (
            <ul className="divide-y divide-graphite/10 border-y border-graphite/12 bg-ivory">
              {recentOrders.map((row) => (
                <li key={row.id} className="flex items-baseline justify-between gap-4 p-4">
                  <div className="min-w-0">
                    <p className="text-sm text-plum">{row.reference}</p>
                    <p className="label-sm mt-1.5 text-graphite/40">{row.customerName}</p>
                  </div>
                  <span className="shrink-0 text-sm tabular-nums text-graphite">
                    {formatMoneyCompact(row.totalMinor, row.currency)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value, href }: { label: string; value: string; href: string }) {
  return (
    <Link href={href} className="bg-ivory p-7 transition-colors hover:bg-sand/50">
      <p className="display-md text-plum">{value}</p>
      <p className="label-sm mt-3 text-graphite/45">{label}</p>
    </Link>
  );
}

/**
 * A count that reads as urgent only when it is. At zero the tile goes quiet —
 * a board where everything shouts is a board nobody reads.
 */
function Alert({
  label,
  value,
  href,
  note,
  tone,
}: {
  label: string;
  value: number;
  href: string;
  note: string;
  tone: "critical" | "warning";
}) {
  const quiet = value === 0;
  const accent = quiet
    ? "text-graphite/25"
    : tone === "critical"
      ? "text-[#B4485F]"
      : "text-gold-deep";

  return (
    <Link
      href={href}
      className="group bg-ivory p-7 transition-colors hover:bg-sand/50"
      aria-label={`${value} ${label}`}
    >
      <p className={`display-md tabular-nums ${accent}`}>{value}</p>
      <p className="label-sm mt-3 text-graphite/45">{label}</p>
      <p className="mt-2 text-xs font-light text-graphite/40">{quiet ? "All clear" : note}</p>
    </Link>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="border border-graphite/12 bg-ivory py-14 text-center">
      <p className="text-sm text-graphite/50">{children}</p>
    </div>
  );
}
