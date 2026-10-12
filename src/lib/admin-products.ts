import "server-only";

import type { Prisma } from "@prisma/client";
import type { z } from "zod";

import { prisma } from "@/lib/prisma";
import { LOW_STOCK_AT } from "@/lib/stock";
import type {
  certificateSchema,
  productVariantSchema,
  productWriteSchema,
} from "@/lib/validation";

/**
 * Studio-side product operations.
 *
 * Separate from src/lib/catalogue.ts on purpose: that module only ever returns
 * ACTIVE rows, because it backs the storefront. The studio has to see drafts
 * and archived pieces too, and mixing the two would make it far too easy to
 * leak an unpublished piece onto the shop.
 */

export type ProductWrite = z.infer<typeof productWriteSchema>;
export type VariantWrite = z.infer<typeof productVariantSchema>;
export type CertificateWrite = z.infer<typeof certificateSchema>;

/**
 * The full studio-side shape. Named `withImages` historically; it now carries
 * the options and reports too, because every studio screen that wants one
 * wants all three, and a second include shape would only invite a screen that
 * quietly renders a piece as one-of-one because it forgot to ask for variants.
 */
const withImages = {
  images: { orderBy: { position: "asc" as const } },
  variants: { orderBy: { position: "asc" as const } },
  certificates: { orderBy: { position: "asc" as const } },
} as const;

export function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}

/** Appends -2, -3 … until the slug is free. Ignores the row being edited. */
export async function uniqueSlug(base: string, exceptId?: string) {
  const root = slugify(base) || "piece";
  let candidate = root;

  for (let n = 2; n < 500; n += 1) {
    const clash = await prisma.product.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!clash || clash.id === exceptId) return candidate;
    candidate = `${root}-${n}`;
  }

  return `${root}-${Date.now()}`;
}

/** Maps the form's shape onto the row's shape. Baht in, satang out. */
function toRow(input: ProductWrite, slug: string) {
  return {
    slug,
    name: input.name,
    description: input.description,
    category: input.category,
    status: input.status,
    priceMinor: Math.round(input.price * 100),
    currency: input.currency.toUpperCase(),
    priceOnEnquiry: input.priceOnEnquiry,
    grossWeightG: input.grossWeightG,
    metal: input.metal,
    metalPurity: input.metalPurity,
    diamondCount: input.diamondCount,
    diamondCaratW: input.diamondCaratW,
    diamondColour: input.diamondColour.toUpperCase(),
    diamondClarity: input.diamondClarity.toUpperCase(),
    stoneShape: input.stoneShape,
    illusionSet: input.illusionSet,
    videoUrl: input.videoUrl || null,
    isFeatured: input.isFeatured,
    rank: input.rank,
    madeToOrder: input.madeToOrder,
    soldOut: input.soldOut,
    stock: input.stock,
    variantAxis: input.variantAxis || null,
  };
}

export async function createProduct(input: ProductWrite) {
  const slug = await uniqueSlug(input.slug || input.name);
  return prisma.product.create({ data: toRow(input, slug), include: withImages });
}

export async function updateProduct(id: string, input: ProductWrite) {
  const slug = await uniqueSlug(input.slug || input.name, id);
  return prisma.product.update({ where: { id }, data: toRow(input, slug), include: withImages });
}

export async function getProductForEdit(id: string) {
  return prisma.product.findUnique({ where: { id }, include: withImages });
}

/** The studio's sold-out switch. Touches nothing else on the piece. */
export async function setSoldOut(id: string, soldOut: boolean) {
  return prisma.product.update({ where: { id }, data: { soldOut }, include: withImages });
}

/**
 * The saved views behind the overview's "Needs attention" tiles. Each one is a
 * question the studio actually asks — what has sold out, what is nearly gone,
 * what is live without a price, what is still showing generated artwork — and
 * each tile links straight to its list rather than leaving a number to act on.
 */
export const ATTENTION_VIEWS = ["out-of-stock", "low-stock", "unpriced", "no-photo"] as const;
export type AttentionView = (typeof ATTENTION_VIEWS)[number];

export type AdminListQuery = {
  q?: string;
  category?: string;
  status?: string;
  attention?: string;
  /** "sold" | "available" — filters on the sold-out switch. */
  availability?: string;
  page?: number;
  perPage?: number;
};

/** Stock is counted only when a piece is not made to order — see src/lib/stock.ts. */
const COUNTED = { status: "ACTIVE", madeToOrder: false } as const;

const ATTENTION_WHERE: Record<AttentionView, Prisma.ProductWhereInput> = {
  "out-of-stock": {
    ...COUNTED,
    OR: [
      { variants: { none: {} }, stock: { lte: 0 } },
      { variants: { some: {} }, AND: { variants: { every: { stock: { lte: 0 } } } } },
    ],
  },
  // `gt: 1`, not `gt: 0`. This catalogue is one-of-a-kind pieces, so a stock of
  // exactly one is the normal resting state, not a warning — flagging it would
  // put every tagged piece on the board permanently and train the studio to
  // ignore the tile. Two or three left of a repeatable line is the real signal.
  "low-stock": {
    ...COUNTED,
    variants: { none: {} },
    stock: { gt: 1, lte: LOW_STOCK_AT },
  },
  unpriced: { status: "ACTIVE", priceOnEnquiry: false, priceMinor: { lte: 0 } },
  "no-photo": { status: "ACTIVE", images: { none: {} } },
};

export async function listProductsForAdmin(query: AdminListQuery) {
  const page = Math.max(1, query.page ?? 1);
  const perPage = Math.min(100, Math.max(1, query.perPage ?? 25));

  let where: Prisma.ProductWhereInput = {};

  if (query.attention && ATTENTION_VIEWS.includes(query.attention as AttentionView)) {
    where = { ...ATTENTION_WHERE[query.attention as AttentionView] };
  }

  if (query.category) where.category = query.category;
  // An explicit status beats the view's own — the views all assume ACTIVE,
  // and someone filtering to Drafts means it.
  if (query.status) where.status = query.status;
  if (query.availability === "sold") where.soldOut = true;
  else if (query.availability === "available") where.soldOut = false;
  if (query.q) {
    const term = query.q.trim();
    where.OR = [{ name: { contains: term } }, { slug: { contains: term.toLowerCase() } }];
  }

  const [items, total, counts] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }],
      skip: (page - 1) * perPage,
      take: perPage,
      include: withImages,
    }),
    prisma.product.count({ where }),
    prisma.product.groupBy({ by: ["status"], _count: true }),
  ]);

  return {
    items,
    total,
    page,
    perPage,
    pages: Math.max(1, Math.ceil(total / perPage)),
    statusCounts: Object.fromEntries(counts.map((row) => [row.status, row._count])) as Record<
      string,
      number
    >,
  };
}

/**
 * Deleting a product that has already been ordered would orphan the order line,
 * so those are archived instead. The caller is told which happened.
 */
export async function deleteOrArchiveProduct(id: string) {
  const orderLines = await prisma.orderItem.count({ where: { productId: id } });

  if (orderLines > 0) {
    await prisma.product.update({ where: { id }, data: { status: "ARCHIVED" } });
    return { archived: true as const, reason: "It appears on a past order." };
  }

  await prisma.product.delete({ where: { id } });
  return { archived: false as const };
}

export async function replaceProductImages(
  productId: string,
  images: { url: string; alt: string; position: number }[],
) {
  await prisma.$transaction([
    prisma.productImage.deleteMany({ where: { productId } }),
    ...(images.length
      ? [
          prisma.productImage.createMany({
            data: images.map((image, index) => ({
              productId,
              url: image.url,
              alt: image.alt,
              position: image.position ?? index,
            })),
          }),
        ]
      : []),
  ]);

  return prisma.product.findUnique({ where: { id: productId }, include: withImages });
}

/**
 * Replaces a piece's options wholesale.
 *
 * Rows are matched by label rather than deleted and recreated, so a size that
 * survives an edit keeps its id — and therefore keeps its place in anyone's
 * cart. A blunt deleteMany here would empty live selections every time the
 * studio corrected a typo.
 */
export async function replaceProductVariants(productId: string, variants: VariantWrite[]) {
  const existing = await prisma.productVariant.findMany({ where: { productId } });
  const byLabel = new Map(existing.map((row) => [row.label.trim().toLowerCase(), row]));

  const keptIds: string[] = [];

  for (const [index, variant] of variants.entries()) {
    const data = {
      label: variant.label.trim(),
      sku: variant.sku || null,
      priceMinor: variant.price == null ? null : Math.round(variant.price * 100),
      stock: variant.stock,
      position: variant.position ?? index,
    };

    const match = byLabel.get(data.label.toLowerCase());
    if (match) {
      const updated = await prisma.productVariant.update({ where: { id: match.id }, data });
      keptIds.push(updated.id);
    } else {
      const created = await prisma.productVariant.create({ data: { productId, ...data } });
      keptIds.push(created.id);
    }
  }

  await prisma.productVariant.deleteMany({
    where: { productId, id: { notIn: keptIds.length ? keptIds : ["__none__"] } },
  });

  return prisma.product.findUnique({ where: { id: productId }, include: withImages });
}

export async function replaceCertificates(productId: string, certificates: CertificateWrite[]) {
  await prisma.$transaction([
    prisma.certificate.deleteMany({ where: { productId } }),
    ...(certificates.length
      ? [
          prisma.certificate.createMany({
            data: certificates.map((certificate, index) => ({
              productId,
              lab: certificate.lab,
              number: certificate.number.trim(),
              documentUrl: certificate.documentUrl || null,
              caratW: certificate.caratW,
              colour: certificate.colour ? certificate.colour.toUpperCase() : null,
              clarity: certificate.clarity ? certificate.clarity.toUpperCase() : null,
              cut: certificate.cut || null,
              issuedOn: certificate.issuedOn ? new Date(certificate.issuedOn) : null,
              position: certificate.position ?? index,
            })),
          }),
        ]
      : []),
  ]);

  return prisma.product.findUnique({ where: { id: productId }, include: withImages });
}

export async function studioSummary() {
  const [
    products,
    active,
    draft,
    archived,
    withPhotos,
    enquiriesNew,
    ordersPending,
    totalValue,
    certified,
    unpriced,
    lowStock,
    missingPhotos,
    outOfStock,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { status: "ACTIVE" } }),
    prisma.product.count({ where: { status: "DRAFT" } }),
    prisma.product.count({ where: { status: "ARCHIVED" } }),
    prisma.product.count({ where: { images: { some: {} } } }),
    prisma.enquiry.count({ where: { status: "NEW" } }),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.aggregate({ _sum: { totalMinor: true } }),
    prisma.product.count({ where: { certificates: { some: {} } } }),
    prisma.product.count({ where: { status: "ACTIVE", priceOnEnquiry: false, priceMinor: { lte: 0 } } }),
    prisma.product.count({
      where: { status: "ACTIVE", madeToOrder: false, variants: { none: {} }, stock: { gt: 1, lte: LOW_STOCK_AT } },
    }),
    prisma.product.count({ where: { status: "ACTIVE", images: { none: {} } } }),
    // Stock-tracked pieces the storefront is currently refusing to sell. Only
    // meaningful for madeToOrder: false — everything else is always orderable.
    prisma.product.count({
      where: {
        status: "ACTIVE",
        madeToOrder: false,
        OR: [
          { variants: { none: {} }, stock: { lte: 0 } },
          { variants: { some: {} }, AND: { variants: { every: { stock: { lte: 0 } } } } },
        ],
      },
    }),
  ]);

  return {
    products,
    active,
    draft,
    archived,
    withPhotos,
    enquiriesNew,
    ordersPending,
    orderValueMinor: totalValue._sum.totalMinor ?? 0,
    certified,
    unpriced,
    lowStock,
    missingPhotos,
    outOfStock,
  };
}
