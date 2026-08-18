# Anju Diam — Fine Diamond Jewellery

Full-stack website for Anju Diam Co., Ltd. — a scroll-driven cinematic hero over a
complete catalogue, enquiry-based commerce, customer accounts and a studio queue.

Built to the MVP PRD: Home, About, Collections, Collection Detail, Custom Jewellery
and Contact, with a ~250-piece catalogue, search, filters, wishlist, cart, customer
login, WhatsApp and enquiry capture.

---

## Quick start

**Just want to look at it?** Double-click `run.command` in Finder. It installs
what is missing, seeds the database if needed, builds, and opens the site. Leave
that window open — closing it stops the server.

To run it by hand:

```bash
npm install
cp .env.example .env
npm run db:push && npm run db:seed
npm run dev
```

Open http://localhost:3000.

If a page ever shows an error, check the terminal first — the most common cause
by far is that the server is not running, which makes every link fail. `npm run
dev` and `npm run build` share the `.next` directory, so running `dev` after a
`build` wipes the production output; run `npm run build` again before
`npm run start`.

Seeded accounts:

| Role     | Email                | Password               |
| -------- | -------------------- | ---------------------- |
| Studio   | `admin@anjudiam.com` | `changeme-in-production` |
| Customer | `client@example.com` | `demo-account-1993`    |

Change the admin password before this goes anywhere public — set
`SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` and re-run the seed.

---

## Stack

| Layer     | Choice                                                      |
| --------- | ----------------------------------------------------------- |
| Framework | Next.js 15 (App Router), React 19, TypeScript strict         |
| Styling   | Tailwind v4, brand tokens in `src/app/globals.css`           |
| Data      | Prisma — SQLite in development, Postgres in production       |
| Auth      | `jose` JWT in an httpOnly cookie, bcrypt hashing             |
| Email     | Nodemailer over SMTP (Gmail app password), no-op without it  |
| Media     | Canvas frame sequence, generated SVG product artwork         |

No UI kit, no animation library. Every interaction is hand-built, which is why
the shared bundle is ~102 KB.

---

## The hero

The supplied archive holds **300 JPEG frames at 1920x1080** — a slow push-in on
the model, lit against a warm champagne studio backdrop.
`scripts/build-frames.ts` processes them into three WebP sets:

- **ultra** 3456x1944 — DPR >= 1.6 and >= 1100px wide
- **desktop** 2304x1296 — everything else above 780px
- **mobile** 1152x648 — 780px and below

A visitor downloads exactly one tier. The tier is chosen from the canvas the
device will actually build, not from a guess: a 1440pt Retina laptop makes a
2862x1800 canvas and — because the frame is wider than the viewport — draws the
frame about 3355px wide. At 3456 the source exceeds the canvas, so the browser
downsamples rather than upscales, which is as sharp as a raster gets.

### The watermark

The render carries a four-pointed star in the bottom-right corner, which cannot
ship on a client site. It is **painted out rather than cropped**: it sits on a
smooth gradient, so each affected row is rebuilt by interpolating between clean
strips either side of it. That reproduces the gradient exactly, and keeps the
full frame — including the clean right-hand backdrop the hero copy sits on.

Two approaches were tried and rejected first. Cloning a patch from elsewhere in
the frame leaves a visible disc wherever the tone does not match. Averaging the
surrounding region to estimate the gradient averages the star's own brightness
back in, leaving a soft bright blob. Row interpolation has neither problem.

### Pacing

`src/components/FrameSequence.tsx` drives the canvas. Three things make it feel
expensive rather than janky:

1. **Dwell remapping** — scroll progress runs through a lookup table built from
   Gaussians centred on each chapter, so the camera slows where there is copy to
   read and runs on between.
2. **LERP smoothing** — the drawn frame chases the target instead of snapping,
   hiding the stepping on a fast flick scroll.
3. **Deferred bulk loading** — the chapter anchor frames load first, so the hero
   is scrubbable almost immediately. The rest are held back until the visitor
   scrolls, touches the page, or the browser goes idle, then stream in batches
   behind a nearest-loaded fallback so the canvas never flashes blank.

It honours `prefers-reduced-motion` by drawing a single still.

### A light hero, with nothing over the film

This footage is lit *bright*, which inverted the hero's design. The copy is wine
and sits on the right, because the model holds centre-left through the whole
take and leaves that side clean. The header carries no plate over the hero and
switches its type to wine until the glass fades in.

**Nothing is laid over the picture.** An earlier revision washed the frame with
an ivory gradient to buy contrast, which dulled exactly the warm champagne and
deep burgundy that make the shot. Wine on champagne is only about 2.7:1 — under
the 3:1 large text needs — so the lift instead goes on the glyphs themselves:
`on-film` in globals.css puts a diffuse ivory halo behind the type, reading as
light coming off the backdrop while leaving every pixel of the film untouched.

Two consequences worth knowing if you edit the hero:

- The body copy is capped at 25 characters wide. Any wider and its first line
  runs onto the model's sleeve, where wine on burgundy is unreadable.
- On mobile the frame is drawn smaller and pulled up (56% scale, 30% anchor in
  `FrameSequence`) so the copy has clean backdrop beneath it. Restoring the
  earlier framing puts the headline back on her dress.

The canvas clears to the backdrop's own average tone (`#A48769`) so letterboxing
blends into the shot instead of framing it in black.

### On sharpness

Three things were making the previous cut look soft, all since fixed: the canvas
was rendering below the display (DPR capped at 1.75 — plainly visible as blur on
a Retina screen), the frames were smaller than the canvas so the browser
upscaled them on every draw, and the frames were being blurred before encoding
to hide JPEG blocking, which cost more sharpness than it hid.

This source also raised the ceiling on its own: at 1920x1080 it carries **2.25x
the pixels** of the original 1280x720 footage and roughly double the bitrate per
frame, so the ultra tier is a 1.8x upscale rather than 2.7x.

None of this invents detail. If you can get the original uncompressed render,
drop it into `raw-frames/` and run `npm run frames:build` — the pipeline uses
every pixel it is given and needs no other change. An AI upscaler would go
further still, but the connected image service reports 0 credits on a free plan
and the local option has no prebuilt binary for Node 24 on Apple Silicon.

## Natural diamonds

The house sells **natural, earth-mined diamonds — never laboratory-grown**, and
the site says so rather than leaving "diamond" to be assumed. It appears in the
site description and metadata, the house standard, the hero chapters, the
hallmarks, the About page, the enquiry acknowledgement email, every generated
product description, the product spec table as its own **Origin** row, and the
`Product` structured data as an `additionalProperty`.

`houseStandard.origin` in `src/lib/site.ts` holds the phrasing.

## Collections

Five: Rings, Earrings, Necklaces, Bracelets and **Gifting**. Gifting replaced an
earlier Bridal collection — the house does not sell bridal — so its forms are
pendants, lockets, charm bracelets, everyday studs and stacking bands rather
than engagement rings and wedding bands.

The rename is enforced rather than assumed. `RETIRED_CATEGORIES` in
`src/lib/enums.ts` lists withdrawn collections, and the seed sweeps any product
still sitting in one: rows are deleted outright, except those appearing on a
past order, which are moved to Gifting and archived so the order line is not
orphaned. Add a category to that list and the next seed cleans up after it.

## The house hallmarks

`/` carries a hallmarks section late on the page — after the film, the
collections and a price, when the visitor's question has moved from "is this
beautiful" to "can I trust these people and is this a fair price". It answers
pricing, purity, weighing, inspection, certification, aftercare and the house
mark, and nothing else.

The icons are in `src/components/HallmarkIcons.tsx`, **redrawn as SVG** from the
client's brand-icon sheet rather than cropped out of it. On that sheet each icon
is roughly 90px inside a 1280px JPEG — too small to show at 56px on a retina
screen, and its hairline strokes carry JPEG fringing against the plum. Vectors
stay crisp at any size, take `currentColor`, and add nothing to the page weight.

Seven of the eight are used. The second icon on the sheet is struck through,
which is read as "not this one" — if that was meant differently, it is a
ten-minute addition.

## Contact and Enquire

They used to be the same page, so someone who only wanted the address had to
read past a six-field form to find it.

- **`/contact`** is the house card: address, telephone, email, WhatsApp, social
  handles and opening hours. No form.
- **`/enquire`** is the form, with a short note on what each kind of enquiry
  gets back.

Each links to the other, and both sit in the primary nav.

Contact details live in `src/lib/site.ts` and are the client's real ones:

| | |
| --- | --- |
| Website | www.anjudiam.com |
| Email | info@anjudiam.com |
| Telephone | +66 83 163 6736 |
| Instagram | [@anjudiam](https://instagram.com/anjudiam) |

They flow through to the contact card, the footer, the `tel:`/`mailto:` links,
the WhatsApp button (`NEXT_PUBLIC_WHATSAPP`) and the JewelryStore structured
data, so changing one is a single edit.

**Two things are still outstanding.** There is no street address yet — the card
shows "Bangkok, Thailand · Visits by appointment" rather than an invented one,
because a made-up address sitting beside real details is worse than showing
less. And the opening hours are a sensible default for a Bangkok atelier, not
confirmed. Both are marked in `site.ts`.

## The header

Transparent on every page and at every scroll position — no plate, no fill. It
used to drop a frosted plum plate the moment you scrolled, so the site opened
light and airy and then went dark as soon as you moved.

Transparency alone would be unreadable over the plum and ink bands, so the bar
reads what is beneath it. Any full-width dark section carries
`data-nav-tone="light"`; on scroll the header finds whichever band sits under
its centre line and switches between wine and ivory type, each with a matching
halo (`on-film` / `on-film-dark` in globals.css) doing the legibility work.
Nothing is ever laid over the page.

Rects are read live rather than cached — they move as images decode, fonts swap
and the catalogue grid fills in, and a stale cache would leave the bar the wrong
colour exactly where it is least readable.

Two things to know if you add a section:

- A dark full-width band needs `data-nav-tone="light"` or the type will stay
  wine over it.
- Anything `position: fixed` covering the viewport must only set the attribute
  while it is actually visible. The mobile menu sheet is `fixed inset-0`, and
  leaving the attribute on permanently pinned the bar to ivory on every phone.

## Currency

The client sells into **Thailand, India and the United States**, so the header
carries a currency selector offering THB, INR and USD.

**Baht is the only real currency in the system.** Prices are stored, quoted,
ordered, emailed and accounted in THB; INR and USD are a reading convenience so
a visitor does not have to open a converter in another tab. Anywhere a
converted figure is shown it is prefixed `≈`, and the cart, checkout and product
pages carry a line saying the piece is settled in baht.

| Piece | How |
| --- | --- |
| Rates | `open.er-api.com`, free and keyless, based on THB |
| Caching | Next `fetch` cache, 12 hours — two requests a day, not two thousand |
| Failure | Falls back to hard-coded rates in `src/lib/currency.ts`; never throws |
| Selection | `ad_currency` cookie, read **on the server** in `app/layout.tsx` |
| Rounding | Per currency — USD to $10, INR to ₹500, so a price reads as a price |

Reading the cookie on the server matters: the first painted HTML is already in
the visitor's currency. Doing it on the client would render every price in baht
and flip it on hydration, which looks broken.

`<Price minor={…} />` is the only thing that should render money on the
storefront, and it always takes THB satang — no component does currency maths.
The price filter converts both ways, so someone browsing in dollars types
dollars while the API still receives baht.

**The studio, the emails and the order records stay in baht** whatever the
visitor picked. Those are the books, not a shop window.

## Product imagery

There is no product photography in the source material yet, so every piece is
drawn by `src/lib/product-art.tsx`: a plate-style engraving derived from the
product's own record. The form is read out of the slug (a `tennis-bracelet`
becomes a line, a `bangle` a hoop), the stone shape picks the silhouette, the
metal picks the line colour, and the diamond count decides how many stones a
line setting carries.

**When the real photographs arrive, nothing needs redesigning.** Every grid,
card and detail view renders through `src/components/ProductMedia.tsx`, which
shows a photograph when the product has one and the generated artwork when it
does not.

---

## The studio

`/admin`, for accounts with the `ADMIN` role. Four sections:

| Section        | Does                                                                  |
| -------------- | --------------------------------------------------------------------- |
| **Overview**   | Catalogue counts, photography coverage, enquiry and selection queues   |
| **Catalogue**  | Every piece — search, filter by status and collection, add, edit, delete |
| **Enquiries**  | The lead queue, with status and one-click reply                        |
| **Selections** | Enquiry-checkout orders, with fulfilment status                        |

### Adding a piece

Catalogue → **Add a piece**. Name and description are the only prose; everything
else is specification. The side panel shows a live preview of the generated
artwork as you set the stone shape and metal, so you can see what it will look
like before any photography exists.

New pieces default to **Draft** — nothing reaches the storefront until you set
it to Active. A draft returns a real 404 on its public URL, not a soft one.

Price is entered in **whole baht**; it is converted to satang before storage,
because money is held as an integer throughout.

### Photographs

Open a piece and drop files onto the gallery panel. On upload each file is
rotated upright from its EXIF, resized to fit 2600px, converted to WebP, and
written alongside a 900px thumbnail. Supply the largest originals you have —
files are never enlarged, and the studio warns you when a file lands under
1600px, which will look soft on a large screen.

The first image is the lead: it is what the grid, the cart line and the product
page show. Reorder with the arrows. **The moment a piece has one photograph the
generated artwork disappears for it everywhere** — no setting to flip.

### Where the files go

Uploads are written to `MEDIA_DIR` (`./media` by default) and served by
`/api/media`, **not** `public/`. Next builds a static manifest of `public/` at
build time, so anything written there after the build works in development and
silently 404s in production — the upload would have looked fine right up until
launch.

On an ephemeral filesystem (Vercel, Fly, most containers) `./media` does not
survive a deploy. Point `MEDIA_DIR` at a mounted volume, or replace the two
`writeFile` calls in `src/app/api/admin/upload/route.ts` with an S3 / R2 / Blob
put. The database only stores the URL, so nothing else changes.

## Loading the real catalogue

```bash
npm run catalogue:import -- data/catalogue.csv --dry-run   # validate only
npm run catalogue:import -- data/catalogue.csv             # write
npm run catalogue:import -- data/catalogue.csv --replace   # + archive anything absent
```

`data/catalogue-template.csv` is a working three-row example. Required columns are
`name`, `description`, `category`, `price` (whole baht), `grossWeightG`,
`diamondCount` and `diamondCaratW`; everything else has a sensible default. The
importer validates the entire file before writing a single row — a half-imported
catalogue is worse than a rejected one.

Photographs go in `public/products/<slug>/` and are referenced in the `images`
column, pipe-separated, lead image first:

```
/products/aurelia-solitaire-ring/01.webp|/products/aurelia-solitaire-ring/02.webp
```

---

## Email

Enquiries and selections are always written to the database first; mail is
best-effort, so a dead SMTP host can never cost the house a lead. With
`SMTP_HOST` unset every send is logged to the console and the enquiry is honestly
recorded as `notified: false` — the studio page shows a banner saying so.

To switch alerts on with Gmail, create an **App Password** (a normal Google
password will not work once 2FA is on) and set:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=enquiries@anjudiam.com
SMTP_PASS=<16-character app password>
ENQUIRY_INBOX=enquiries@anjudiam.com
```

Two mails go out per enquiry: an alert to the house with the customer as
`Reply-To`, and a branded acknowledgement to the customer.

---

## Moving to Postgres

The schema is written to survive the switch untouched — no native enums, no
scalar lists, no `@db.*` attributes. In `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Point `DATABASE_URL` at Neon, Supabase or Railway, then:

```bash
npm run db:push && npm run db:seed
```

No model edits required.

---

## Commerce model

Checkout ends at a **confirmed enquiry, not a card charge**. At this price point,
with everything made to order, the house confirms stone availability and final
sizing before taking money — so the flow captures everything the atelier needs to
quote and says plainly that nothing has been charged.

Prices are never trusted from the client; every total is recomputed from the
product rows at checkout, and `OrderItem.unitPriceMinor` snapshots the price so
historic orders survive a price change. Money is stored as integer satang
throughout — nothing in this codebase holds a price as a float.

Cart and wishlist are keyed by an opaque owner string rather than a user id, so a
visitor can build a selection before creating an account. Signing in merges the
guest rows across (`src/lib/owner.ts`).

---

## Routes

| Public                     | Session-only            | API                          |
| -------------------------- | ----------------------- | ---------------------------- |
| `/`                        | `/cart`                 | `/api/products`              |
| `/collections`             | `/checkout`             | `/api/products/[slug]`       |
| `/collections/[category]`  | `/wishlist`             | `/api/cart`                  |
| `/products/[slug]`         | `/account`              | `/api/wishlist`              |
| `/about`                   | `/admin` (studio only)  | `/api/auth/*`                |
| `/custom`                  |                         | `/api/enquiries`             |
| `/contact`                 |                         | `/api/orders`                |
| `/enquire`                 |                         | `/api/admin/*`               |
| `/search`                  |                         |                              |

`sitemap.xml` and `robots.txt` are generated; account, cart, checkout, wishlist
and admin are excluded from indexing.

---

## Security

- Passwords bcrypt-hashed at cost 12; sessions are signed JWTs in httpOnly,
  SameSite=Lax cookies, `Secure` in production.
- Admin role is re-read from the database on every request, so revoking an
  administrator takes effect immediately rather than when their token expires.
- Every write path is Zod-validated; public POSTs are rate-limited per IP.
- Contact and checkout forms carry an off-screen honeypot. A filled honeypot
  returns `201` and stores nothing, so the bot records a success and does not
  retry with a different shape.
- Login answers identically for an unknown address and a wrong password.
- `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options` and a
  `Permissions-Policy` are set in `next.config.ts`.

The rate limiter is in-process. On a multi-instance or serverless deployment each
instance keeps its own counter, so the effective limit is `limit × instances`. If
that ever matters, swap the `Map` in `src/lib/rate-limit.ts` for Upstash Redis —
the call signature is designed not to change.

---

## Brand

Palette, type and the 40/30/15/10/5 colour hierarchy come from the supplied brand
sheet and are defined once in `src/app/globals.css`:

| Token      | Hex       | Role                          |
| ---------- | --------- | ----------------------------- |
| `plum`     | `#4F243C` | Dominant, 40%                 |
| `ivory`    | `#F8F5F1` | Editorial ground, 30%         |
| `stone`    | `#D9D2CC` | Secondary surfaces, 15%       |
| `gold`     | `#C8A46A` | Accent only — 10%             |
| `graphite` | `#2D2B2C` | Body copy, 5%                 |
| `ink`      | `#140A10` | Cinematic sections            |

Playfair Display for display type, Montserrat for everything else.

### Glass

`glass`, `glass-light` and `glass-chip` in `globals.css` are an iOS-style
material rather than a plain blur. Four things do the work, and leaving any of
them out is what makes web glassmorphism look fake:

1. `saturate()` alongside `blur()` — iOS boosts chroma behind the panel, which
   is why colour bleeds through as colour instead of grey mush
2. a 1px white inset highlight on the top edge, reading as a lit bevel
3. a darker inset on the bottom edge, so the panel has thickness
4. a wide, soft drop shadow, so it floats rather than sitting flat

Where `backdrop-filter` is unsupported the tint falls back to near-opaque —
translucent-without-blur is unreadable over photography.

Used on: the header bar and mobile sheet, the sticky catalogue filter bar, the
illusion badges and wishlist buttons on product cards, the hover overlay, the
hero chapter rail and scroll pill, the product-page spec strip, and the cart and
checkout summary panels.

The lotus mark and the `ANJU DIAM` wordmark are custom artwork and are used as
supplied — not traced, not re-typeset. `npm run logo:build` regenerates the three
colourways and the favicon from the plum masters in `public/logo/_master/`,
stripping the soft alpha fringe the originals carry.

Note that two taglines are in circulation: the logo lockup reads **"A Legacy of
Brilliance"**, and the brand sheet gives **"Everyday Luxury. Timeless Brilliance."**
as the campaign line. The site uses the first in the identity lockups and the
second as the hero headline. Worth confirming which the client wants where.

---

## Scripts

| Command                     | Does                                              |
| --------------------------- | ------------------------------------------------- |
| `npm run dev`               | Development server                                |
| `npm run build`             | Production build (runs `prisma generate` first)   |
| `npm run typecheck`         | `tsc --noEmit`                                    |
| `npm run db:push`           | Sync schema to the database                       |
| `npm run db:seed`           | Seed the placeholder catalogue (idempotent)       |
| `npm run db:studio`         | Prisma Studio                                     |
| `npm run catalogue:import`  | Import the real product file                      |
| `npm run frames:build`      | Reprocess the hero frames from `raw-frames/`      |
| `npm run logo:build`        | Regenerate logo colourways and the favicon        |

---

## Publishing

### 1. Put it on GitHub

The repository is committed and ready. It has no remote yet — create one and
push:

```bash
git remote add origin https://github.com/<you>/anju-diam.git
git push -u origin main
```

Create the repository **empty** (no README, no .gitignore) or the first push
will be rejected as a non-fast-forward.

Make it **private**. It is a commercial site with the client's business details
in it, and nothing here benefits from being public.

It is ~69 MB, almost all of it the 900 hero frames. That is well inside GitHub's
limits and needs no Git LFS, but a fresh clone is not instant — worth knowing
before anyone assumes it has hung.

### 2. Deploy

Vercel is the path of least resistance: import the repo and set the environment
variables below.

**Two things must change before it works in production**, both because Vercel's
filesystem is ephemeral and does not survive a deploy:

| What | Why | Fix |
| --- | --- | --- |
| **Database** | SQLite is a file on disk. It resets on every deploy. | Provision Postgres (Neon, Supabase, Railway), set `DATABASE_URL`, change `provider` to `postgresql` in `prisma/schema.prisma`, then run `db:push` and `db:seed` once against it. The schema needs no other edits. |
| **Uploads** | Product photographs are written to `./media`. They vanish on redeploy. | Point `MEDIA_DIR` at a mounted volume, or swap the two `writeFile` calls in `src/app/api/admin/upload/route.ts` for an S3 / R2 / Vercel Blob put. The database only stores the URL. |

Neither matters on a single always-on server (a VPS, Render, Fly with a volume),
where the defaults are fine as they are.

### 3. Environment variables

| Variable | Needed | Notes |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Postgres connection string in production |
| `AUTH_SECRET` | Yes | `openssl rand -base64 32` — sessions forge without it |
| `NEXT_PUBLIC_SITE_URL` | Yes | `https://www.anjudiam.com` |
| `NEXT_PUBLIC_WHATSAPP` | No | `66831636736`; blank hides the floating button |
| `MEDIA_DIR` | On ephemeral hosts | Where uploaded photography is written |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` | No | Gmail App Password. Unset, enquiries still save but nothing is emailed |
| `ENQUIRY_INBOX` | No | Defaults to `SMTP_USER` |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | Before first seed | **Change these.** The default studio password is in this README |

### 4. Before it goes public

- [ ] Change the studio password — `admin@anjudiam.com` / `changeme-in-production` is the seeded default
- [ ] Set a real `AUTH_SECRET`
- [ ] Add the street address and confirm opening hours in `src/lib/site.ts`
- [ ] Confirm `+66 83 163 6736` actually takes WhatsApp, or clear `NEXT_PUBLIC_WHATSAPP`
- [ ] Replace the placeholder catalogue with the real product file (`npm run catalogue:import`)
- [ ] Point the domain at the deployment and update `NEXT_PUBLIC_SITE_URL`

### Bandwidth

The frame sequence is ~66 MB of static WebP across three sets, but a visitor
downloads exactly one: 33 MB on a retina desktop, 24 MB otherwise, 9 MB on
mobile. It is served `Cache-Control: immutable`, the first paint needs only the
chapter anchors, and the bulk is deferred until the visitor engages.

It is still the biggest asset on the site. If bandwidth is metered, the lever is
`VARIANTS` in `scripts/build-frames.ts` — quality 72 to 66 on the ultra tier
saves roughly 4 MB and is close to invisible at viewing size.

---

## Known gaps

- **Product photography.** The generated artwork is a deliberate placeholder with
  a clean swap path, not a substitute for real photographs of real pieces.
- **Payments.** Deliberately absent — see the commerce model above. Adding Stripe
  later means one route and one step in `CheckoutForm`.
- **Thai localisation.** The PRD puts it out of MVP scope. Copy is English only.
- **Search.** A substring match, which is instant at 250 rows. Past a few thousand
  products move to Postgres full-text or Meilisearch; `src/lib/catalogue.ts` is
  the only call site that would change.
