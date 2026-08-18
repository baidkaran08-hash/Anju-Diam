import Link from "next/link";

import Reveal from "@/components/Reveal";

export default function SectionHeading({
  eyebrow,
  title,
  body,
  action,
  align = "left",
  tone = "dark",
}: {
  eyebrow: string;
  title: string;
  body?: string;
  action?: { href: string; label: string };
  align?: "left" | "center";
  tone?: "dark" | "light";
}) {
  const centred = align === "center";

  return (
    <div
      className={`flex flex-col gap-6 ${
        centred ? "items-center text-center" : "md:flex-row md:items-end md:justify-between"
      }`}
    >
      <div className={centred ? "max-w-2xl" : "max-w-2xl"}>
        <Reveal>
          <p className={`label mb-5 ${tone === "light" ? "text-gold" : "text-wine"}`}>{eyebrow}</p>
        </Reveal>
        <Reveal delay={80}>
          <h2 className={`display-lg ${tone === "light" ? "text-ivory" : "text-plum"}`}>{title}</h2>
        </Reveal>
        {body && (
          <Reveal delay={160}>
            <p
              className={`measure mt-6 body-lg ${
                tone === "light" ? "text-ivory/65" : "text-graphite/70"
              } ${centred ? "mx-auto" : ""}`}
            >
              {body}
            </p>
          </Reveal>
        )}
      </div>

      {action && (
        <Reveal delay={200} className={centred ? "mt-2" : "shrink-0"}>
          <Link
            href={action.href}
            className={`label link-rule ${tone === "light" ? "text-gold" : "text-plum hover:text-wine"}`}
          >
            {action.label}
          </Link>
        </Reveal>
      )}
    </div>
  );
}
