import Image from "next/image";

import { ProductArt, type ArtProduct, type ArtTone } from "@/lib/product-art";

/**
 * The single place that decides between real photography and generated
 * artwork. Every grid, card and detail view goes through here, so when the
 * client's catalogue lands with images attached, the whole site switches over
 * without a component being touched.
 */

export type MediaProduct = ArtProduct & {
  name: string;
  images?: { url: string; alt: string }[];
};

export default function ProductMedia({
  product,
  tone = "plum",
  sizes = "(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw",
  priority = false,
  className = "",
}: {
  product: MediaProduct;
  tone?: ArtTone;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  const photo = product.images?.[0];

  if (photo) {
    return (
      <Image
        src={photo.url}
        alt={photo.alt || product.name}
        fill
        sizes={sizes}
        priority={priority}
        className={`object-cover ${className}`}
      />
    );
  }

  return (
    <ProductArt
      product={product}
      tone={tone}
      title={product.name}
      className={`h-full w-full object-cover ${className}`}
    />
  );
}
