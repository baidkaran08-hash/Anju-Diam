"use client";

import { useRef, useState } from "react";

export type GalleryImage = {
  id?: string;
  url: string;
  alt: string;
  position: number;
};

/**
 * Photograph gallery for a piece.
 *
 * The first image is the lead — it is what the grid, the cart line and the
 * product page all show — so ordering is the important interaction here, not
 * a decorative one. Reordering is by explicit buttons rather than drag: drag
 * is fiddly on a trackpad, unusable on touch, and invisible to a keyboard.
 */
export default function ImageManager({
  productId,
  images,
  onChange,
}: {
  productId: string;
  images: GalleryImage[];
  onChange: (images: GalleryImage[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  async function persist(next: GalleryImage[]) {
    onChange(next);
    await fetch(`/api/admin/products/${productId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        images: next.map((image, index) => ({
          url: image.url,
          alt: image.alt,
          position: index,
        })),
      }),
    });
  }

  async function upload(files: FileList | File[]) {
    setError(null);
    setNote(null);
    setBusy(true);

    const added: GalleryImage[] = [];

    for (const file of Array.from(files)) {
      const body = new FormData();
      body.append("productId", productId);
      body.append("file", file);

      try {
        const response = await fetch("/api/admin/upload", { method: "POST", body });
        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          setError(payload.error ?? `${file.name} could not be uploaded.`);
          break;
        }

        added.push(payload.image);

        // Tell the studio when a file was too small to be worth much — better
        // to know now than to find out on a 5K display.
        if (payload.stored?.width && payload.source?.width < 1600) {
          setNote(
            `${file.name} is only ${payload.source.width}px wide. Anything under about 1600px will look soft on a large screen.`,
          );
        }
      } catch {
        setError(`${file.name} could not be uploaded.`);
        break;
      }
    }

    if (added.length) onChange([...images, ...added]);
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  const move = (from: number, to: number) => {
    if (to < 0 || to >= images.length) return;
    const next = [...images];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item!);
    void persist(next);
  };

  const remove = (index: number) => {
    void persist(images.filter((_, i) => i !== index));
  };

  const setAlt = (index: number, alt: string) => {
    onChange(images.map((image, i) => (i === index ? { ...image, alt } : image)));
  };

  return (
    <div>
      <h2 className="label mb-4 text-wine">Photographs</h2>

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          if (event.dataTransfer.files.length) void upload(event.dataTransfer.files);
        }}
        className={`border border-dashed p-6 text-center transition-colors ${
          dragOver ? "border-gold bg-gold/8" : "border-graphite/25"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif,image/tiff"
          multiple
          onChange={(event) => event.target.files && void upload(event.target.files)}
          className="sr-only"
          id="product-photos"
        />
        <label htmlFor="product-photos" className="btn-outline cursor-pointer text-plum">
          {busy ? "Uploading…" : "Choose photographs"}
        </label>
        <p className="mt-4 text-xs font-light leading-relaxed text-graphite/50">
          Or drop them here. JPEG, PNG, WebP, AVIF or TIFF, up to 12 MB each.
          <br />
          Supply the largest files you have — they are resized down to 2600px and converted to
          WebP on upload.
        </p>
      </div>

      {error && (
        <p className="mt-4 text-xs text-[#B4485F]" role="alert">
          {error}
        </p>
      )}
      {note && <p className="mt-4 text-xs font-light text-graphite/60">{note}</p>}

      {images.length > 0 && (
        <ul className="mt-6 space-y-3">
          {images.map((image, index) => (
            <li key={image.url} className="flex gap-3 border border-graphite/12 bg-ivory p-3">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden bg-plum">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.url} alt="" className="h-full w-full object-cover" />
              </div>

              <div className="min-w-0 flex-1">
                {index === 0 && <span className="label-sm text-gold-deep">Lead image</span>}
                <input
                  value={image.alt}
                  onChange={(event) => setAlt(index, event.target.value)}
                  onBlur={() => void persist(images)}
                  placeholder="Describe the photograph"
                  aria-label={`Alt text for photograph ${index + 1}`}
                  className="field mt-1 py-1 text-xs"
                />
              </div>

              <div className="flex shrink-0 flex-col justify-center gap-1">
                <button
                  type="button"
                  onClick={() => move(index, index - 1)}
                  disabled={index === 0}
                  aria-label="Move earlier"
                  className="h-6 w-6 text-graphite/50 hover:text-plum disabled:opacity-25"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(index, index + 1)}
                  disabled={index === images.length - 1}
                  aria-label="Move later"
                  className="h-6 w-6 text-graphite/50 hover:text-plum disabled:opacity-25"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  aria-label="Remove photograph"
                  className="h-6 w-6 text-graphite/40 hover:text-[#B4485F]"
                >
                  ×
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
