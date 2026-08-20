"use client";

import Link from "next/link";
import { useState } from "react";

import { formatMoney } from "@/lib/money";
import {
  ENQUIRY_STATUSES,
  ORDER_STATUSES,
  enquiryKindLabel,
  orderStatusLabel,
  type EnquiryKind,
  type EnquiryStatus,
  type OrderStatus,
} from "@/lib/enums";

type Enquiry = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  kind: string;
  subject: string | null;
  message: string;
  budget: string | null;
  status: string;
  notified: boolean;
  createdAt: string;
};

type Order = {
  id: string;
  reference: string;
  status: string;
  totalMinor: number;
  currency: string;
  customerName: string;
  customerEmail: string;
  createdAt: string;
  items: { id: string; quantity: number; product: { name: string; slug: string } }[];
};

/**
 * The studio queue.
 *
 * Deliberately plain — this is a working tool for the house, not a showpiece.
 * Status changes write straight through and the row updates optimistically,
 * because the alternative is a spinner on every dropdown.
 */
export default function AdminBoard({
  enquiries: initialEnquiries,
  orders: initialOrders,
  mailConfigured,
  initialTab = "enquiries",
}: {
  enquiries: Enquiry[];
  orders: Order[];
  mailConfigured: boolean;
  initialTab?: "enquiries" | "orders";
}) {
  const [tab, setTab] = useState<"enquiries" | "orders">(initialTab);
  const [enquiries, setEnquiries] = useState(initialEnquiries);
  const [orders, setOrders] = useState(initialOrders);
  const [open, setOpen] = useState<string | null>(null);

  async function setEnquiryStatus(id: string, status: EnquiryStatus) {
    setEnquiries((rows) => rows.map((row) => (row.id === id ? { ...row, status } : row)));
    await fetch("/api/admin/enquiries", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
  }

  async function setOrderStatus(id: string, status: OrderStatus) {
    setOrders((rows) => rows.map((row) => (row.id === id ? { ...row, status } : row)));
    await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
  }

  const newCount = enquiries.filter((row) => row.status === "NEW").length;
  const pendingCount = orders.filter((row) => row.status === "PENDING").length;

  return (
    <div>
      {!mailConfigured && (
        <p className="mb-10 border-l-2 border-gold bg-ivory px-5 py-4 text-sm font-light text-graphite/75">
          <strong className="font-medium">Email alerts are off.</strong> SMTP is not configured, so
          enquiries are being stored here but no notification is leaving the server. Set{" "}
          <code className="text-xs">SMTP_HOST</code>, <code className="text-xs">SMTP_USER</code> and{" "}
          <code className="text-xs">SMTP_PASS</code> to switch them on.
        </p>
      )}

      <div className="mb-10 flex gap-8 border-b border-graphite/12">
        {(
          [
            ["enquiries", `Enquiries${newCount ? ` (${newCount} new)` : ""}`],
            ["orders", `Selections${pendingCount ? ` (${pendingCount} pending)` : ""}`],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            aria-pressed={tab === value}
            className={`label -mb-px border-b pb-4 transition-colors ${
              tab === value ? "border-gold text-plum" : "border-transparent text-graphite/40 hover:text-plum"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "enquiries" ? (
        enquiries.length === 0 ? (
          <Empty>No enquiries yet.</Empty>
        ) : (
          <ul className="divide-y divide-graphite/12 border-y border-graphite/12">
            {enquiries.map((row) => (
              <li key={row.id} className="py-6">
                <div className="flex flex-wrap items-start justify-between gap-5">
                  <button
                    type="button"
                    onClick={() => setOpen(open === row.id ? null : row.id)}
                    aria-expanded={open === row.id}
                    className="min-w-0 flex-1 text-left"
                  >
                    <div className="flex flex-wrap items-baseline gap-3">
                      <span className="display-sm text-plum">{row.name}</span>
                      <span className="label-sm text-gold-deep">
                        {enquiryKindLabel[row.kind as EnquiryKind] ?? row.kind}
                      </span>
                      {!row.notified && (
                        <span className="label-sm text-graphite/35">not emailed</span>
                      )}
                    </div>
                    <p className="mt-2 text-sm font-light text-graphite/55">
                      {row.email}
                      {row.phone && ` · ${row.phone}`}
                      {row.subject && ` · ${row.subject}`}
                    </p>
                    <p className="mt-1 text-xs font-light text-graphite/40">
                      {new Date(row.createdAt).toLocaleString("en-GB")}
                    </p>
                  </button>

                  <select
                    value={row.status}
                    onChange={(event) =>
                      void setEnquiryStatus(row.id, event.target.value as EnquiryStatus)
                    }
                    aria-label={`Status for ${row.name}'s enquiry`}
                    className="label-sm border border-graphite/20 bg-transparent px-3 py-2.5 text-plum"
                  >
                    {ENQUIRY_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                </div>

                {open === row.id && (
                  <div className="mt-5 border-l-2 border-gold/50 pl-5">
                    {row.budget && (
                      <p className="label-sm mb-3 text-graphite/45">Budget · {row.budget}</p>
                    )}
                    <p className="whitespace-pre-wrap text-sm font-light leading-relaxed text-graphite/75">
                      {row.message}
                    </p>
                    <a
                      href={`mailto:${row.email}?subject=${encodeURIComponent(`Re: your enquiry — Anju Diam`)}`}
                      className="label link-rule mt-5 inline-block text-plum"
                    >
                      Reply by email
                    </a>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )
      ) : orders.length === 0 ? (
        <Empty>No selections yet.</Empty>
      ) : (
        <ul className="divide-y divide-graphite/12 border-y border-graphite/12">
          {orders.map((row) => (
            <li key={row.id} className="py-6">
              <div className="flex flex-wrap items-start justify-between gap-5">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-3">
                    <span className="label text-plum">{row.reference}</span>
                    <span className="text-sm tabular-nums text-graphite/70">
                      {formatMoney(row.totalMinor, row.currency)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-light text-graphite/55">
                    {row.customerName} · {row.customerEmail}
                  </p>
                  <ul className="mt-3 space-y-1">
                    {row.items.map((item) => (
                      <li key={item.id} className="text-sm font-light text-graphite/65">
                        <Link href={`/products/${item.product.slug}`} className="hover:text-plum">
                          {item.product.name}
                        </Link>
                        {item.quantity > 1 && ` × ${item.quantity}`}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-xs font-light text-graphite/40">
                    {new Date(row.createdAt).toLocaleString("en-GB")}
                  </p>
                </div>

                <select
                  value={row.status}
                  onChange={(event) => void setOrderStatus(row.id, event.target.value as OrderStatus)}
                  aria-label={`Status for ${row.reference}`}
                  className="label-sm border border-graphite/20 bg-transparent px-3 py-2.5 text-plum"
                >
                  {ORDER_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {orderStatusLabel[status]}
                    </option>
                  ))}
                </select>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="border border-graphite/12 py-20 text-center">
      <p className="display-sm text-plum">{children}</p>
    </div>
  );
}
