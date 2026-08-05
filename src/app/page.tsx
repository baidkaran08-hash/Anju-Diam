import FrameSequence, { type Chapter } from "@/components/FrameSequence";
import EnquiryForm from "@/components/EnquiryForm";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/money";

/**
 * The chapter map. Centres are in remapped progress and must match the dwell
 * centres used by the sequence engine, otherwise copy arrives off-beat.
 */
const CHAPTERS: Chapter[] = [
  { center: 0.06, window: 0.1, label: "The House" },
  { center: 0.28, window: 0.095, label: "Origin" },
  { center: 0.5, window: 0.095, label: "Illusion Setting" },
  { center: 0.72, window: 0.095, label: "House Standard" },
  { center: 0.93, window: 0.11, label: "Made Yours" },
];

const FRAME_COUNT = 240;

/** Visible when remapped progress is inside the chapter's window. */
function visible(progress: number, chapter: Chapter) {
  return Math.abs(progress - chapter.center) <= chapter.window;
}

export default async function HomePage() {
  const featured = await prisma.product.findMany({
    where: { isFeatured: true, status: "ACTIVE" },
    take: 4,
    orderBy: { category: "asc" },
  });

  return (
    <>
      <main id="top">
        <FrameSequence frameCount={FRAME_COUNT} chapters={CHAPTERS} scrollHeightVh={720}>
          {({ progress, degrees, activeChapter }) => (
            <>
              {/* Scrim — keeps type legible without covering the piece. */}
              <div
                className="pointer-events-none absolute inset-0 z-[2]"
                style={{
                  background:
                    "radial-gradient(125% 82% at 50% 46%, transparent 44%, rgba(20,10,16,.28) 82%, rgba(20,10,16,.6) 100%), linear-gradient(to bottom, rgba(20,10,16,.3) 0%, transparent 16%, transparent 74%, rgba(20,10,16,.68) 100%)",
                }}
                aria-hidden
              />

              <div className="pointer-events-none absolute inset-0 z-[5]">
                {/* 1 — The House */}
                <Chapter show={visible(progress, CHAPTERS[0])} align="center">
                  <Eyebrow center>Bangkok · Est. 1993</Eyebrow>
                  {/* A soft pool of shade under the lockup only — cheaper than
                      darkening the whole frame, and the film stays bright either side. */}
                  <h1
                    className="m-0 px-[clamp(30px,8vw,104px)] py-[clamp(26px,5vw,58px)]"
                    style={{
                      background:
                        "radial-gradient(closest-side, rgba(20,10,16,.72), rgba(20,10,16,.5) 52%, transparent 100%)",
                    }}
                  >
                    <img
                      src="/logo/lockup-gold.webp"
                      alt="Anju Diam — A Legacy of Brilliance"
                      width={900}
                      height={371}
                      className="h-auto w-[min(620px,78vw)] [filter:drop-shadow(0_3px_30px_rgba(20,10,16,.95))_drop-shadow(0_1px_3px_rgba(20,10,16,.9))]"
                    />
                  </h1>
                </Chapter>

                {/* 2 — Origin */}
                <Chapter show={visible(progress, CHAPTERS[1])} align="left">
                  <Eyebrow>Origin</Eyebrow>
                  <h2 className="font-display text-[clamp(34px,5.4vw,74px)] leading-[1.02] tracking-tight drop-shadow-[0_2px_30px_rgba(20,10,16,.9)]">
                    Knowledge
                    <br />
                    before <em className="italic text-gold">craft</em>
                  </h2>
                  <Say>
                    Sanjay Kothari began as a trader of loose diamonds, spending years learning grading,
                    brilliance and value one stone at a time. The jewellery came after — built on what he
                    already knew.
                  </Say>
                </Chapter>

                {/* 3 — Illusion setting */}
                <Chapter show={visible(progress, CHAPTERS[2])} align="right">
                  <Eyebrow>The house speciality</Eyebrow>
                  <h2 className="font-display text-[clamp(34px,5.4vw,74px)] leading-[1.02] tracking-tight drop-shadow-[0_2px_30px_rgba(20,10,16,.9)]">
                    The <em className="italic text-gold">illusion</em>
                    <br />
                    setting
                  </h2>
                  <Say>
                    Our settings are engineered to gather light and return it — maximising brilliance and
                    visual scale while keeping a piece light, wearable and quietly proportioned.
                  </Say>
                </Chapter>

                {/* 4 — House standard */}
                <Chapter show={visible(progress, CHAPTERS[3])} align="left">
                  <Eyebrow>The standard, without exception</Eyebrow>
                  <h2 className="font-display text-[clamp(34px,5.4vw,74px)] leading-[1.02] tracking-tight drop-shadow-[0_2px_30px_rgba(20,10,16,.9)]">
                    G colour.
                    <br />
                    VS clarity.
                  </h2>
                  <Say>
                    Every creation is made in 18-karat gold and set with diamonds of G colour or higher and
                    VS clarity or above. Exceptional jewellery begins with exceptional materials.
                  </Say>
                  <dl className="mt-8 flex flex-wrap gap-8">
                    {[
                      ["G+", "Colour"],
                      ["VS+", "Clarity"],
                      ["18K", "Gold"],
                      ["1993", "Since"],
                    ].map(([value, key]) => (
                      <div key={key} className="min-w-24 border-t border-gold/40 pt-3">
                        <dd className="font-display text-[clamp(19px,1.9vw,26px)]">{value}</dd>
                        <dt className="label mt-2 text-taupe">{key}</dt>
                      </div>
                    ))}
                  </dl>
                </Chapter>

                {/* 5 — Made yours */}
                <Chapter show={visible(progress, CHAPTERS[4])} align="center">
                  <Eyebrow center>Customisation is the house philosophy</Eyebrow>
                  <h2 className="font-display text-[clamp(34px,5.4vw,74px)] leading-[1.02] tracking-tight drop-shadow-[0_2px_30px_rgba(20,10,16,.9)]">
                    Made <em className="italic text-gold">yours</em>
                  </h2>
                  <Say center>
                    Reimagine a classic silhouette or begin somewhere entirely new. We work with you from
                    sketch to setting.
                  </Say>
                  <a
                    href="#enquire"
                    className="label pointer-events-auto mx-auto mt-9 inline-flex border border-gold px-8 py-4 text-gold transition-colors hover:bg-gold hover:text-ink"
                  >
                    Begin a commission
                  </a>
                </Chapter>
              </div>

              {/*
                Signature device — a gemological certificate rail. The rotation
                readout is the one piece of telemetry that means something here:
                it tells you how far round the stone you have turned.
              */}
              <aside
                className="pointer-events-none absolute right-6 top-[104px] z-[8] flex flex-col items-end gap-2 border-r border-gold/35 pr-4 md:right-12"
                aria-hidden
              >
                <p className="label text-taupe">Certificate · AD—1993</p>
                <p className="font-display text-[clamp(24px,2.5vw,36px)] leading-none tabular-nums text-gold">
                  {String(degrees).padStart(3, "0")}
                  <sup className="ml-0.5 align-super text-[0.42em]">°</sup>
                </p>
                <p className="label text-ivory/60">{activeChapter}</p>
              </aside>

              <div className="pointer-events-none absolute inset-x-6 bottom-9 z-[8] h-px bg-ivory/15 md:inset-x-12" aria-hidden>
                <div className="h-full origin-left bg-gold" style={{ transform: `scaleX(${progress})` }} />
              </div>
            </>
          )}
        </FrameSequence>

        {/* ── Collections ─────────────────────────────────────────────── */}
        <section id="collections" className="relative z-20 bg-ivory text-charcoal">
          <div className="mx-auto max-w-[1360px] px-6 py-24 md:px-12 md:py-36">
            <div className="mb-12 flex flex-wrap items-end justify-between gap-10">
              <div>
                <span className="label text-wine">Collections</span>
                <h2 className="mt-4 max-w-[20ch] font-display text-[clamp(30px,4.4vw,58px)] leading-[1.06] tracking-tight text-plum">
                  Four ways to wear the house standard
                </h2>
              </div>
              <p className="max-w-[40ch] text-sm leading-[1.78] text-charcoal/70">
                Around 250 pieces across the house, each handcrafted, individually quality-checked, and open
                to customisation.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
              {featured.map((product, index) => (
                <a
                  key={product.id}
                  href={`/collections/${product.slug}`}
                  className={`group flex min-h-40 flex-col justify-between border border-gold/25 bg-plum p-6 transition-colors hover:border-gold/60 hover:bg-wine ${
                    index === 0 ? "col-span-2 row-span-2 min-h-[300px]" : ""
                  }`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-6 w-6 fill-none stroke-gold stroke-1 opacity-75 transition-transform duration-500 group-hover:rotate-45 group-hover:opacity-100"
                    aria-hidden
                  >
                    <path d="M12 2 22 9l-10 13L2 9Z" />
                    <path d="M2 9h20M12 2 8 9l4 13M12 2l4 7-4 13" />
                  </svg>
                  <div className="mt-auto">
                    <h3 className="font-display text-[clamp(19px,1.9vw,26px)] text-ivory">{product.name}</h3>
                    <span className="label mt-2 block text-taupe">
                      {formatPrice(product.priceMinor, product.currency)} · {product.diamondCaratW} ct
                    </span>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* ── The House ───────────────────────────────────────────────── */}
        <section id="house" className="relative z-20 bg-plum text-ivory">
          <div className="mx-auto max-w-[1360px] px-6 py-24 md:px-12 md:py-36">
            <div className="mb-12 flex flex-wrap items-end justify-between gap-10">
              <div>
                <span className="label text-gold">The House</span>
                <h2 className="mt-4 max-w-[20ch] font-display text-[clamp(30px,4.4vw,58px)] leading-[1.06] tracking-tight">
                  Three decades, three points of view
                </h2>
              </div>
              <p className="max-w-[40ch] text-sm leading-[1.78] text-ivory/70">
                Values rooted in tradition; an approach that keeps moving with each new generation.
              </p>
            </div>

            <div className="border-t border-gold/30">
              {[
                {
                  year: "1993",
                  name: "Sanjay Kothari",
                  role: "Founder",
                  text: "Founded the house in Bangkok after years trading loose diamonds — building an understanding of quality, grading, pricing and sourcing before a single piece was ever made.",
                },
                {
                  year: "2011",
                  name: "Ayushi Khater",
                  role: "Design",
                  text: "Brought a contemporary design sensibility that reached a younger client, while holding on to the craftsmanship and authenticity the house was built on.",
                },
                {
                  year: "2020",
                  name: "Akshay Kothari",
                  role: "Brand & Growth",
                  text: "Focused on branding, marketing and innovation — positioning the house for global growth without letting go of its heritage.",
                },
              ].map((entry) => (
                <article
                  key={entry.year}
                  className="grid grid-cols-[76px_1fr] items-baseline gap-x-8 gap-y-4 border-b border-gold/20 py-8 md:grid-cols-[120px_1fr_minmax(0,46ch)] md:py-10"
                >
                  <span className="font-display text-[clamp(24px,2.4vw,34px)] leading-none text-gold">
                    {entry.year}
                  </span>
                  <h3 className="font-display text-[clamp(19px,1.9vw,27px)] tracking-tight">
                    {entry.name}
                    <small className="label mt-2 block text-taupe">{entry.role}</small>
                  </h3>
                  <p className="col-start-2 text-sm leading-[1.8] text-ivory/75 md:col-start-3">{entry.text}</p>
                </article>
              ))}
            </div>

            <p className="mt-16 max-w-[24ch] border-t border-gold/30 pt-12 font-display text-[clamp(21px,2.9vw,40px)] italic leading-[1.34]">
              Because true luxury is never loud — it is <em className="text-gold">crafted with purpose</em>,
              worn with confidence, and treasured forever.
            </p>
          </div>
        </section>

        {/* ── Enquiry ─────────────────────────────────────────────────── */}
        <section id="enquire" className="relative z-20 bg-ivory text-charcoal">
          <div className="mx-auto max-w-[1360px] px-6 py-24 md:px-12 md:py-36">
            <div className="mb-12 flex flex-wrap items-end justify-between gap-10">
              <div>
                <span className="label text-wine">Custom Jewellery</span>
                <h2 className="mt-4 max-w-[20ch] font-display text-[clamp(30px,4.4vw,58px)] leading-[1.06] tracking-tight text-plum">
                  Start with a conversation
                </h2>
              </div>
              <p className="max-w-[40ch] text-sm leading-[1.78] text-charcoal/70">
                Tell us what you have in mind. We will come back with materials, timing and an honest price.
              </p>
            </div>

            <div className="grid gap-12 md:grid-cols-2 md:gap-20">
              <EnquiryForm />
              <div>
                {[
                  ["Atelier", "Anju Diam Co., Ltd.\nBangkok, Thailand"],
                  ["The house standard", "18-karat gold. Diamonds of G colour or higher, VS clarity or above. Every piece individually quality-checked before it leaves us."],
                  ["Customisation", "Nearly every piece can be adapted — metal, stone size, setting, length. Ask, and we will tell you what is possible."],
                ].map(([heading, body]) => (
                  <div key={heading} className="mb-8 border-t border-plum/20 pt-7">
                    <span className="label mb-3 block text-wine">{heading}</span>
                    <p className="whitespace-pre-line text-[15px] leading-[1.8]">{body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

    </>
  );
}

/* ── Small presentational helpers ───────────────────────────────────── */

function Chapter({
  show,
  align,
  children,
}: {
  show: boolean;
  align: "left" | "right" | "center";
  children: React.ReactNode;
}) {
  const position =
    align === "left"
      ? "left-0 w-[min(46ch,50vw)] items-start text-left"
      : align === "right"
        ? "right-0 ml-auto w-[min(46ch,50vw)] items-start text-left"
        : "inset-x-0 items-center text-center";

  return (
    <article
      className={`absolute inset-y-0 flex flex-col justify-center px-6 py-24 transition-opacity duration-700 md:px-12 ${position} ${
        show ? "opacity-100" : "invisible opacity-0"
      }`}
      aria-hidden={!show}
    >
      {children}
    </article>
  );
}

function Eyebrow({ children, center }: { children: React.ReactNode; center?: boolean }) {
  return (
    <p className={`label mb-6 flex items-center gap-3 text-gold ${center ? "justify-center" : ""}`}>
      <span className="h-px w-8 bg-gold/80" aria-hidden />
      {children}
    </p>
  );
}

function Say({ children, center }: { children: React.ReactNode; center?: boolean }) {
  return (
    <p
      className={`mt-6 max-w-[38ch] text-[clamp(13.5px,1.12vw,16px)] font-light leading-[1.72] text-ivory/85 drop-shadow-[0_1px_18px_rgba(20,10,16,.95)] ${
        center ? "mx-auto" : ""
      }`}
    >
      {children}
    </p>
  );
}
