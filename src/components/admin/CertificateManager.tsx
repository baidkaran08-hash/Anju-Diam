"use client";

import { useRef, useState } from "react";

import { CERT_LABS, certLabLabel, type CertLab } from "@/lib/enums";

export type CertificateRow = {
  id?: string;
  lab: string;
  number: string;
  documentUrl: string;
  caratW: string;
  colour: string;
  clarity: string;
  cut: string;
  /** yyyy-mm-dd, as a date input gives it. */
  issuedOn: string;
};

const BLANK: CertificateRow = {
  lab: "GIA",
  number: "",
  documentUrl: "",
  caratW: "",
  colour: "",
  clarity: "",
  cut: "",
  issuedOn: "",
};

/**
 * Grading reports for a piece.
 *
 * The scan uploads immediately — a file is not something to hold in browser
 * memory waiting for a save — but the typed fields save on the button, for the
 * same reason as the options editor next door.
 */
export default function CertificateManager({
  productId,
  certificates,
  onChange,
}: {
  productId: string;
  certificates: CertificateRow[];
  onChange: (certificates: CertificateRow[]) => void;
}) {
  const inputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState<number | null>(null);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  function update(next: CertificateRow[]) {
    onChange(next);
    setDirty(true);
    setNote(null);
    setError(null);
  }

  const setField = (index: number, key: keyof CertificateRow, value: string) =>
    update(certificates.map((row, i) => (i === index ? { ...row, [key]: value } : row)));

  async function uploadScan(index: number, file: File) {
    setUploading(index);
    setError(null);

    try {
      const body = new FormData();
      body.append("productId", productId);
      body.append("file", file);

      const response = await fetch("/api/admin/certificates/upload", { method: "POST", body });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(payload.error ?? "That report did not upload.");
        return;
      }

      // Straight into the row. It still needs the save button to be attached
      // to the record — until then it is an orphaned file, which is harmless.
      setField(index, "documentUrl", payload.url);
    } catch {
      setError("We could not reach the server.");
    } finally {
      setUploading(null);
    }
  }

  async function save() {
    setBusy(true);
    setError(null);
    setNote(null);

    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          certificates: certificates
            .filter((row) => row.number.trim() !== "")
            .map((row, index) => ({
              lab: row.lab,
              number: row.number.trim(),
              documentUrl: row.documentUrl,
              caratW: row.caratW.trim(),
              colour: row.colour.trim(),
              clarity: row.clarity.trim(),
              cut: row.cut.trim(),
              issuedOn: row.issuedOn || null,
              position: index,
            })),
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(payload.error ?? "Those reports did not save.");
        return;
      }

      const saved: CertificateRow[] = (payload.product?.certificates ?? []).map(
        (certificate: {
          id: string;
          lab: string;
          number: string;
          documentUrl: string | null;
          caratW: number | null;
          colour: string | null;
          clarity: string | null;
          cut: string | null;
          issuedOn: string | null;
        }) => ({
          id: certificate.id,
          lab: certificate.lab,
          number: certificate.number,
          documentUrl: certificate.documentUrl ?? "",
          caratW: certificate.caratW == null ? "" : String(certificate.caratW),
          colour: certificate.colour ?? "",
          clarity: certificate.clarity ?? "",
          cut: certificate.cut ?? "",
          issuedOn: certificate.issuedOn ? certificate.issuedOn.slice(0, 10) : "",
        }),
      );

      onChange(saved);
      setDirty(false);
      setNote("Reports saved.");
    } catch {
      setError("We could not reach the server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="label text-wine">Grading reports</h2>
        {certificates.length > 0 && (
          <span className="label-sm text-graphite/40">
            {certificates.length} on file
          </span>
        )}
      </div>

      {certificates.length === 0 && (
        <p className="mb-5 text-xs font-light leading-relaxed text-graphite/55">
          None on file. Add the GIA or IGI report and it appears on the product page, with the
          scan linked for the customer to open.
        </p>
      )}

      <ul className="mb-5 space-y-3">
        {certificates.map((row, index) => (
          <li key={row.id ?? `new-${index}`} className="border border-graphite/12 p-4">
            <div className="grid gap-3 sm:grid-cols-6">
              <label className="block sm:col-span-2">
                <span className="label-sm mb-1.5 block text-graphite/45">Laboratory</span>
                <select
                  value={row.lab}
                  onChange={(event) => setField(index, "lab", event.target.value)}
                  className="field text-sm"
                >
                  {CERT_LABS.map((lab) => (
                    <option key={lab} value={lab}>
                      {certLabLabel[lab as CertLab]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block sm:col-span-4">
                <span className="label-sm mb-1.5 block text-graphite/45">Report number</span>
                <input
                  value={row.number}
                  onChange={(event) => setField(index, "number", event.target.value)}
                  placeholder="2141438171"
                  className="field text-sm"
                />
              </label>

              <label className="block sm:col-span-1">
                <span className="label-sm mb-1.5 block text-graphite/45">Carat</span>
                <input
                  value={row.caratW}
                  onChange={(event) => setField(index, "caratW", event.target.value)}
                  inputMode="decimal"
                  placeholder="0.72"
                  className="field text-sm"
                />
              </label>

              <label className="block sm:col-span-1">
                <span className="label-sm mb-1.5 block text-graphite/45">Colour</span>
                <input
                  value={row.colour}
                  onChange={(event) => setField(index, "colour", event.target.value)}
                  placeholder="G"
                  className="field text-sm"
                />
              </label>

              <label className="block sm:col-span-1">
                <span className="label-sm mb-1.5 block text-graphite/45">Clarity</span>
                <input
                  value={row.clarity}
                  onChange={(event) => setField(index, "clarity", event.target.value)}
                  placeholder="VS1"
                  className="field text-sm"
                />
              </label>

              <label className="block sm:col-span-1">
                <span className="label-sm mb-1.5 block text-graphite/45">Cut</span>
                <input
                  value={row.cut}
                  onChange={(event) => setField(index, "cut", event.target.value)}
                  placeholder="Excellent"
                  className="field text-sm"
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="label-sm mb-1.5 block text-graphite/45">Issued</span>
                <input
                  type="date"
                  value={row.issuedOn}
                  onChange={(event) => setField(index, "issuedOn", event.target.value)}
                  className="field text-sm"
                />
              </label>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-graphite/10 pt-4">
              <input
                ref={(element) => {
                  inputRefs.current[index] = element;
                }}
                type="file"
                accept="application/pdf,image/jpeg,image/png,image/webp,image/tiff"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void uploadScan(index, file);
                  event.target.value = "";
                }}
              />

              <button
                type="button"
                onClick={() => inputRefs.current[index]?.click()}
                disabled={uploading === index}
                className="btn-outline text-sm text-plum"
              >
                {uploading === index
                  ? "Uploading…"
                  : row.documentUrl
                    ? "Replace the scan"
                    : "Attach the scan"}
              </button>

              {row.documentUrl && (
                <a
                  href={row.documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-rule text-sm text-plum"
                >
                  View
                </a>
              )}

              <button
                type="button"
                onClick={() => update(certificates.filter((_, i) => i !== index))}
                className="label-sm ml-auto text-graphite/40 underline underline-offset-4 transition-colors hover:text-[#B4485F]"
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => update([...certificates, { ...BLANK }])}
          className="btn-outline text-sm text-plum"
        >
          Add a report
        </button>

        <button
          type="button"
          onClick={save}
          disabled={busy || !dirty}
          className="btn-gold ml-auto text-sm disabled:opacity-40"
        >
          {busy ? "Saving…" : dirty ? "Save reports" : "Saved"}
        </button>
      </div>

      <div aria-live="polite" className="min-h-5">
        {error && (
          <p className="mt-3 text-xs text-[#B4485F]" role="alert">
            {error}
          </p>
        )}
        {note && <p className="mt-3 text-xs font-light text-graphite/55">{note}</p>}
      </div>
    </div>
  );
}
