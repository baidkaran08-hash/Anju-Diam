"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import ImageManager, { type GalleryImage } from "@/components/admin/ImageManager";
import { ProductArt } from "@/lib/product-art";
import {
  CATEGORIES,
  METALS,
  PRODUCT_STATUSES,
  STONE_SHAPES,
  metalLabel,
  stoneShapeLabel,
  type Category,
  type Metal,
  type StoneShape,
} from "@/lib/enums";
import { formatMoney } from "@/lib/money";

export type ProductRecord = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  status: string;
  priceMinor: number;
  currency: string;
  grossWeightG: number;
  metal: string;
  metalPurity: string;
  diamondCount: number;
  diamondCaratW: number;
  diamondColour: string;
  diamondClarity: string;
  stoneShape: string;
  illusionSet: boolean;
  videoUrl: string | null;
  isFeatured: boolean;
  rank: number;
  images: GalleryImage[];
};

const BLANK = {
  slug: "",
  name: "",
  description: "",
  category: "RINGS",
  status: "DRAFT",
  price: "",
  currency: "THB",
  grossWeightG: "",
  metal: "YELLOW_GOLD_18K",
  metalPurity: "18K",
  diamondCount: "",
  diamondCaratW: "",
  diamondColour: "G",
  diamondClarity: "VS",
  stoneShape: "ROUND",
  illusionSet: false,
  videoUrl: "",
  isFeatured: false,
  rank: "500",
};

type FormState = typeof BLANK;

function toForm(product: ProductRecord): FormState {
  return {
    slug: product.slug,
    name: product.name,
    description: product.description,
    category: product.category,
    status: product.status,
    price: String(product.priceMinor / 100),
    currency: product.currency,
    grossWeightG: String(product.grossWeightG),
    metal: product.metal,
    metalPurity: product.metalPurity,
    diamondCount: String(product.diamondCount),
    diamondCaratW: String(product.diamondCaratW),
    diamondColour: product.diamondColour,
    diamondClarity: product.diamondClarity,
    stoneShape: product.stoneShape,
    illusionSet: product.illusionSet,
    videoUrl: product.videoUrl ?? "",
    isFeatured: product.isFeatured,
    rank: String(product.rank),
  };
}

export default function ProductForm({ product }: { product?: ProductRecord }) {
  const router = useRouter();
  const editing = Boolean(product);

  const [form, setForm] = useState<FormState>(product ? toForm(product) : BLANK);
  const [images, setImages] = useState<GalleryImage[]>(product?.images ?? []);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setSaved(false);
  };

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setErrors({});
    setFormError(null);

    try {
      const response = await fetch(
        editing ? `/api/admin/products/${product!.id}` : "/api/admin/products",
        {
          method: editing ? "PATCH" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(form),
        },
      );
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setErrors(payload.fields ?? {});
        setFormError(payload.error ?? "That did not save. Please check the fields.");
        return;
      }

      setSaved(true);
      if (!editing) {
        router.push(`/admin/products/${payload.product.id}`);
        return;
      }
      router.refresh();
    } catch {
      setFormError("We could not reach the server. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!product) return;
    if (!confirm(`Delete “${product.name}”? This cannot be undone.`)) return;

    setSaving(true);
    const response = await fetch(`/api/admin/products/${product.id}`, { method: "DELETE" });
    const payload = await response.json().catch(() => ({}));
    setSaving(false);

    if (!response.ok) {
      setFormError(payload.error ?? "That could not be deleted.");
      return;
    }
    if (payload.archived) {
      alert(`This piece was archived rather than deleted. ${payload.reason}`);
    }
    router.push("/admin/products");
  }

  // Live preview of the generated artwork, so the studio can see what a piece
  // will look like before any photography exists for it.
  const artPreview = {
    slug: form.slug || "preview",
    category: form.category,
    metal: form.metal,
    stoneShape: form.stoneShape,
    diamondCount: Number(form.diamondCount) || 1,
    illusionSet: form.illusionSet,
    diamondColour: form.diamondColour,
    diamondClarity: form.diamondClarity,
  };

  const priceNumber = Number(form.price);

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-12 lg:grid-cols-[1.7fr_1fr]">
      <div className="space-y-12">
        {/* ── Essentials ────────────────────────────────────────────────── */}
        <Section title="The piece">
          <Row>
            <Field label="Name" error={errors.name} className="sm:col-span-2">
              <input
                value={form.name}
                onChange={(event) => set("name", event.target.value)}
                required
                className="field"
                placeholder="Aurelia Solitaire Ring"
              />
            </Field>

            <Field
              label="Web address"
              hint={editing ? undefined : "Left blank, this is made from the name."}
              error={errors.slug}
              className="sm:col-span-2"
            >
              <div className="flex items-baseline gap-1">
                <span className="text-sm text-graphite/35">/products/</span>
                <input
                  value={form.slug}
                  onChange={(event) => set("slug", event.target.value)}
                  className="field"
                  placeholder="aurelia-solitaire-ring"
                />
              </div>
            </Field>

            <Field label="Description" error={errors.description} className="sm:col-span-2">
              <textarea
                value={form.description}
                onChange={(event) => set("description", event.target.value)}
                required
                rows={5}
                className="field resize-y"
                placeholder="What the piece is, how it is made, and who it is for."
              />
            </Field>

            <Field label="Collection" error={errors.category}>
              <select
                value={form.category}
                onChange={(event) => set("category", event.target.value)}
                className="field"
              >
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category.charAt(0) + category.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Status" error={errors.status} hint="Only Active pieces appear on the site.">
              <select
                value={form.status}
                onChange={(event) => set("status", event.target.value)}
                className="field"
              >
                {PRODUCT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0) + status.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </Field>
          </Row>
        </Section>

        {/* ── Price ─────────────────────────────────────────────────────── */}
        <Section title="Price">
          <Row>
            <Field
              label="Price"
              error={errors.price}
              hint={
                Number.isFinite(priceNumber) && priceNumber > 0
                  ? `Shows as ${formatMoney(Math.round(priceNumber * 100), form.currency)}`
                  : "In whole baht — no decimals, no commas."
              }
            >
              <input
                value={form.price}
                onChange={(event) => set("price", event.target.value)}
                inputMode="decimal"
                required
                className="field"
                placeholder="148000"
              />
            </Field>

            <Field label="Currency" error={errors.currency}>
              <input
                value={form.currency}
                onChange={(event) => set("currency", event.target.value.toUpperCase())}
                maxLength={3}
                className="field"
              />
            </Field>
          </Row>
        </Section>

        {/* ── Specification ─────────────────────────────────────────────── */}
        <Section title="Specification">
          <Row>
            <Field label="Metal" error={errors.metal}>
              <select
                value={form.metal}
                onChange={(event) => set("metal", event.target.value)}
                className="field"
              >
                {METALS.map((metal) => (
                  <option key={metal} value={metal}>
                    {metalLabel[metal]}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Purity" error={errors.metalPurity}>
              <input
                value={form.metalPurity}
                onChange={(event) => set("metalPurity", event.target.value)}
                className="field"
              />
            </Field>

            <Field label="Gross weight (g)" error={errors.grossWeightG}>
              <input
                value={form.grossWeightG}
                onChange={(event) => set("grossWeightG", event.target.value)}
                inputMode="decimal"
                required
                className="field"
                placeholder="4.20"
              />
            </Field>

            <Field label="Stone shape" error={errors.stoneShape} hint="Drives the generated artwork.">
              <select
                value={form.stoneShape}
                onChange={(event) => set("stoneShape", event.target.value)}
                className="field"
              >
                {STONE_SHAPES.map((shape) => (
                  <option key={shape} value={shape}>
                    {stoneShapeLabel[shape]}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Number of diamonds" error={errors.diamondCount}>
              <input
                value={form.diamondCount}
                onChange={(event) => set("diamondCount", event.target.value)}
                inputMode="numeric"
                required
                className="field"
                placeholder="1"
              />
            </Field>

            <Field label="Total carat weight" error={errors.diamondCaratW}>
              <input
                value={form.diamondCaratW}
                onChange={(event) => set("diamondCaratW", event.target.value)}
                inputMode="decimal"
                required
                className="field"
                placeholder="0.72"
              />
            </Field>

            <Field label="Colour" error={errors.diamondColour} hint="House standard is G or higher.">
              <input
                value={form.diamondColour}
                onChange={(event) => set("diamondColour", event.target.value.toUpperCase())}
                className="field"
              />
            </Field>

            <Field label="Clarity" error={errors.diamondClarity} hint="House standard is VS or above.">
              <input
                value={form.diamondClarity}
                onChange={(event) => set("diamondClarity", event.target.value.toUpperCase())}
                className="field"
              />
            </Field>
          </Row>

          <div className="mt-8 flex flex-wrap gap-8">
            <Toggle
              checked={form.illusionSet}
              onChange={(value) => set("illusionSet", value)}
              label="Illusion set"
              hint="The house speciality. Badged on the card."
            />
            <Toggle
              checked={form.isFeatured}
              onChange={(value) => set("isFeatured", value)}
              label="Featured"
              hint="Appears in the featured row on the home page."
            />
          </div>
        </Section>

        {/* ── Extras ────────────────────────────────────────────────────── */}
        <Section title="Merchandising">
          <Row>
            <Field label="Sort weight" error={errors.rank} hint="Lower sorts first under “Featured”.">
              <input
                value={form.rank}
                onChange={(event) => set("rank", event.target.value)}
                inputMode="numeric"
                className="field"
              />
            </Field>

            <Field label="Video URL" error={errors.videoUrl} hint="Optional.">
              <input
                value={form.videoUrl}
                onChange={(event) => set("videoUrl", event.target.value)}
                className="field"
                placeholder="https://…"
              />
            </Field>
          </Row>
        </Section>

        {formError && (
          <p className="text-sm text-[#B4485F]" role="alert">
            {formError}
          </p>
        )}

        <div className="sticky bottom-0 -mx-6 flex flex-wrap items-center gap-4 border-t border-graphite/12 bg-ivory/95 px-6 py-5 backdrop-blur-md">
          <button type="submit" disabled={saving} className="btn-gold">
            {saving ? "Saving…" : editing ? "Save changes" : "Create piece"}
          </button>

          {editing && (
            <>
              <Link href={`/products/${product!.slug}`} className="btn-outline text-plum" target="_blank">
                View on site ↗
              </Link>
              <button
                type="button"
                onClick={onDelete}
                disabled={saving}
                className="label-sm ml-auto text-[#B4485F] underline underline-offset-4"
              >
                Delete this piece
              </button>
            </>
          )}

          <span aria-live="polite" className="label-sm text-graphite/45">
            {saved && "Saved"}
          </span>
        </div>
      </div>

      {/* ── Side: artwork preview and gallery ───────────────────────────── */}
      <aside className="space-y-10 lg:sticky lg:top-28 lg:self-start">
        <div>
          <h2 className="label mb-4 text-wine">Preview</h2>
          <div className="relative aspect-[4/5] overflow-hidden border border-graphite/12 bg-plum">
            {images[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={images[0].url} alt="" className="h-full w-full object-cover" />
            ) : (
              <ProductArt product={artPreview} tone="plum" className="h-full w-full" />
            )}
          </div>
          <p className="mt-3 text-xs font-light leading-relaxed text-graphite/50">
            {images.length > 0
              ? "Showing your photograph. It replaces the generated artwork everywhere."
              : "Generated from the specification. Upload a photograph to replace it."}
          </p>
        </div>

        {editing ? (
          <ImageManager productId={product!.id} images={images} onChange={setImages} />
        ) : (
          <div className="border border-dashed border-graphite/20 p-6">
            <h2 className="label mb-3 text-wine">Photographs</h2>
            <p className="text-xs font-light leading-relaxed text-graphite/55">
              Save the piece first, then you can upload photographs to it.
            </p>
          </div>
        )}
      </aside>
    </form>
  );
}

// ── Layout helpers ──────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="label mb-7 text-wine">{title}</h2>
      {children}
    </section>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-7 sm:grid-cols-2">{children}</div>;
}

function Field({
  label,
  hint,
  error,
  className = "",
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="label-sm mb-1.5 block text-graphite/45">{label}</span>
      {children}
      {error ? (
        <span className="mt-2 block text-xs text-[#B4485F]" role="alert">
          {error}
        </span>
      ) : (
        hint && <span className="mt-2 block text-xs font-light text-graphite/40">{hint}</span>
      )}
    </label>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-4 w-4 accent-[#C8A46A]"
      />
      <span>
        <span className="label-sm block text-plum">{label}</span>
        {hint && <span className="mt-1 block text-xs font-light text-graphite/45">{hint}</span>}
      </span>
    </label>
  );
}
