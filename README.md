# Anju Diam — Fine Diamond Jewellery

Full-stack build for Anju Diam Co., Ltd. (Bangkok, est. 1993), covering the MVP
scope in the PRD: a scroll-driven cinematic hero, a ~250-piece catalogue with
search and filters, wishlist, cart, customer accounts, orders, and enquiry
capture.

**Stack:** Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS v4 ·
Prisma · PostgreSQL

---

## Running it

```bash
npm install
cp .env.example .env          # then fill in DATABASE_URL and AUTH_SECRET
npx prisma db push            # create the tables
npm run db:seed               # ~250 products + an admin account
npm run dev
```

Open http://localhost:3000.

`AUTH_SECRET` must be at least 32 characters — the app throws on boot otherwise,
deliberately, so a weak secret can never reach production:

```bash
openssl rand -base64 32
```

The seed creates `admin@anjudiam.com` with the password
`change-me-on-first-login`. **Change it before the site goes anywhere public.**

### Where to get a database

Any Postgres works. Neon and Supabase both have free tiers that suit this
project fine; paste their connection string into `DATABASE_URL`.

---

## Deploying

Vercel is the path of least resistance since this is a Next.js app:

1. Push the repo to GitHub.
2. Import it in Vercel.
3. Add `DATABASE_URL`, `AUTH_SECRET`, `NEXT_PUBLIC_WHATSAPP` and
   `NEXT_PUBLIC_SITE_URL` as environment variables.
4. Deploy. The build script runs `prisma generate` before `next build`.

After the first deploy, run the seed once against the production database from
your machine with the production `DATABASE_URL` set.

**One caveat worth knowing:** the frame sequence in `public/frames` is about
9.5 MB. That is well within Vercel's limits, but it is static and immutable, so
`next.config.ts` sets a one-year cache header on it. If the client later swaps
the film, change the directory name so the new frames are not served from a
stale cache.

---

## How the hero works

`src/components/FrameSequence.tsx` is the interesting part. Scroll position
drives a canvas playing 240 pre-rendered WebP frames of the house solitaire
turning through a full 360°.

Two decisions keep it from feeling like a slideshow:

**Dwell remapping.** Raw scroll progress is passed through a lookup table built
from Gaussians centred on each chapter, so the rotation slows where there is
something to read and runs on between. The viewer should feel pacing, not
resistance. If it ever feels sticky, lower `DWELL_PEAK` or widen `DWELL_WIDTH`.

**LERP smoothing.** The drawn frame chases the target frame rather than snapping
to it, which hides the stepping on a fast flick scroll.

Frames load in two waves — the chapter anchors first, then everything else in
batches of ten. A nearest-loaded-frame fallback means the canvas never flashes
blank while a wave is in flight.

Chapter centres are defined once in `src/app/page.tsx` and passed to both the
copy and the dwell table. **If you move a chapter, move it in one place** — they
must stay in sync or the copy arrives off-beat.

`prefers-reduced-motion` renders a single stable frame and skips the loop
entirely.

### Frame assets

**On resolution — read this before quoting the client.** The supplied
`AnjuDiam1.zip` contains 240 JPEG frames at **1280x720**, averaging 23 KB each.
That is 720p, heavily compressed. It is not 4K, and no processing invents
detail the file never captured.

An earlier pass upscaled to 1920 and ran an unsharp mask over it. That was
wrong, and worth understanding so nobody repeats it: the source carries baked-in
8x8 JPEG blocking. Upscaling stretched those blocks to 11px, and the unsharp
raised local contrast from 47 to 51, which made them read as visible boxes
across the frame. Sharpening a low-bitrate source sharpens its artefacts.

Current pipeline stays out of the way:

| Step | Why |
|---|---|
| Native 1280x720, no upscale | Keeps blocking at 8px, where it reads as grain rather than boxes |
| `GaussianBlur(0.5)` | Sub-pixel, softens block edges without touching real detail. Blocking ratio 3.88 to 3.59 |
| WebP q90 | High enough that re-encoding adds no artefacts of its own |
| No unsharp, no contrast or saturation lift | The frame is shown as shot |
| `imageSmoothingQuality = "high"` | Resampling quality for the upscale to a high-DPI canvas. Re-applied after every resize, which resets context state |

Rendered contrast measured 60.8 on the sharpened build, 49.8 now — that drop is
the softening, and it is intended.

| Set | Dimensions | Quality | Size |
|---|---|---|---|
| `public/frames/desktop` | 1280x720 | q90 | 9.8 MB |
| `public/frames/mobile` | 854x480 | q84 | 5.7 MB |

**To genuinely reach 4K**, the client re-exports the source animation at
3840x2160. Ask their 3D or video team for the original render, not a compressed
export. With real detail in hand, drop the gaussian and raise the target size.

### Category rename

`PENDANTS` became `NECKLACES` across the Prisma enum, the seed, `lib/catalogue.ts`,
`lib/validation.ts` and the nav. **This changes a Postgres enum**, so an existing
database needs `npx prisma db push` followed by `npm run db:seed` — there is no
in-place migration for rows already tagged `PENDANTS`. Harmless before launch;
do it before the client's real inventory is loaded.

### Logo

`public/logo/` holds the lockup extracted from the client's supplied artwork,
in three colourways (`plum`, `gold`, `ivory`) and four cuts (`mark`, `wordmark`,
`tagline`, `lockup`). Alpha comes from a *local* background estimate — a max filter recovers the silk
behind the dark ink, then a wide blur turns it into a surface that follows the
fabric's gradient and folds. Subtracting that leaves ink only.

A single global threshold, which is what the first pass used, left a faint
rectangle of silk around each element wherever the fabric dipped below the
chosen value. Measured on the current assets: silk residual peaks at 1.7 while
ink reaches 186, so the floor at 8 clears the background completely — corner
alpha is 0 on every asset. A 0.62 gamma then thickens the hairline strokes so
they hold up at nav size.

Colourways are separate files rather than CSS filters, so the artwork keeps its
own antialiasing at nav scale. Gold sits on the film and the charcoal footer,
plum on the ivory pages, swapped by `body[data-theme]`.

> **Tagline conflict, needs a decision.** The new artwork reads *A Legacy of
> Brilliance*. The earlier brand board reads *Everyday Luxury. Timeless
> Brilliance.*, and its mark is an `AD` monogram, not the lotus. The build now
> follows the new artwork throughout. If the board is still current, both the
> tagline and the mark need reverting — confirm which is live before this
> reaches print or packaging.

---|---|
| Lanczos resample to 1920x1080 | The browser upscales to fill a high-DPI canvas either way. Doing it with Lanczos beats leaving it to the browser's bilinear. |
| UnsharpMask (r2, 110%, t3) | Restores edge definition the source JPEG's quantisation flattened. |
| Contrast x1.06, saturation x1.05 | The stones read bright rather than grey. |
| `imageSmoothingQuality = "high"` | Single biggest lever. Re-applied after every canvas resize, which resets context state. |
| Scrim pulled back hard | The old overlay peaked at 0.9 opacity and was murking the frame. Legibility now comes from text shadows on the copy instead. |

Measured against the previous encode at identical display size: **5.15x more
edge detail**.

| Set | Dimensions | Quality | Size |
|---|---|---|---|
| `public/frames/desktop` | 1920x1080 | q80 | 16.8 MB |
| `public/frames/mobile` | 1080x608 | q76 | 9.1 MB |

**Worth weighing:** 16.8 MB is a lot for a client base in Thailand and India on
mobile data. Loading is progressive — five chapter anchors first, then the rest
in batches of ten — so the page is usable in under a second regardless. If
analytics later show bounce on slow connections, drop desktop to q72 (about
12 MB) before cutting frame count; fewer frames is the more visible loss.

**To genuinely reach 4K**, the client needs to re-export the source animation at
3840x2160. Ask their 3D or video team for the original render, not a compressed
export. If they can supply it, re-run `convert.py` with the larger target and
skip the unsharp step entirely — real detail does not need faking.

---|---|---|---|
| `public/frames/desktop` | 1280×720 | q68 | 6.04 MB |
| `public/frames/mobile` | 800×450 | q62 | 3.41 MB |

240 frames each, converted from the supplied JPEG sequence. Source resolution
was the ceiling — upscaling would have cost bandwidth without adding detail.

---

## API

All routes return JSON. Validation failures come back as `422` with a
`fields` map keyed by input name, which the forms render inline.

| Method | Route | Notes |
|---|---|---|
| `GET` | `/api/products` | `q`, `category`, `metal`, `illusionSet`, `minPrice`, `maxPrice`, `sort`, `page`, `perPage` |
| `GET` | `/api/products/[slug]` | Returns the piece plus three from the same category |
| `POST` | `/api/enquiries` | Public. The lead-capture path in the PRD's success metrics |
| `POST` | `/api/auth/register` · `/login` · `/logout` | JWT in an httpOnly cookie, 30-day expiry |
| `GET` | `/api/auth/me` | Returns `{ user: null }` when signed out — never a 401 |
| `GET/POST/DELETE` | `/api/wishlist` | Auth required. `POST` is idempotent |
| `GET/POST/PATCH/DELETE` | `/api/cart` | Auth required |
| `GET/POST` | `/api/orders` | Auth required |
| `GET/PATCH` | `/api/admin/enquiries` | Admin only. The team's lead inbox |

### Deliberate omissions

**Payment is not wired.** The client has not chosen a gateway. `POST /api/orders`
creates the order in `PENDING` and empties the bag inside one transaction — which
is exactly the state a payment provider expects to be handed. Drop the provider's
session creation in after the transaction commits.

**Enquiry notifications are not wired.** Same reason. The hook point is marked in
`src/app/api/enquiries/route.ts`. It is intentionally outside the write, so a
third-party outage can never cause a customer's enquiry to fail.

### Data conventions worth not breaking

- **Prices are integers in the smallest currency unit** (satang, not baht).
  Format only at the edges, via `formatPrice` in `src/lib/money.ts`. This avoids
  float drift on totals.
- **Order line prices are snapshotted** at `unitPriceMinor`, so historic orders
  survive a price change.
- **Login failures return one message** whether or not the account exists. Do not
  "improve" this — distinguishing them leaks which emails are registered.

---

## Design tokens

Taken from the brand board, in `src/app/globals.css`:

| Token | Hex | Board name |
|---|---|---|
| `--color-plum` | `#4F243C` | Imperial Plum |
| `--color-wine` | `#6B3A56` | Mulberry Wine |
| `--color-gold` | `#C8A46A` | Champagne Gold |
| `--color-ivory` | `#F8F5F1` | Warm Ivory |
| `--color-stone` | `#D9D2CC` | Soft Stone |
| `--color-charcoal` | `#2D2B2C` | Graphite Charcoal |
| `--color-ink` | `#140A10` | Derived — the film backdrop |

Playfair Display for headings, Montserrat for body and the tracked uppercase
utility face, per the board.

> **Open question for the client.** The brand board specifies plum and gold; the
> PRD's Appendix A mockup shows black and gold. This build follows the brand
> board. If Ayushi and Akshay signed off on the black direction, it is a token
> swap in `globals.css` — cheap now, expensive after the product pages are built.

---

## Still to build

The MVP scope in the PRD that this repo does not yet cover:

- Collection listing and product detail pages (the API they need is done)
- Cart and checkout UI
- Account area — sign in, wishlist, order history
- Admin UI for the enquiry inbox and product editing
- Real product photography (the catalogue currently references placeholder paths)

## Content provenance

Every factual claim on the page — the 1993 founding, Sanjay Kothari's start in
loose diamonds, the illusion settings, the 18-karat / G colour / VS clarity
standard, and the founder timeline — comes from the client's own write-up.
Nothing was invented, so there is nothing to walk back in a review.
