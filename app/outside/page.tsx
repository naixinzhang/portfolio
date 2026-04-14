import Link from "next/link";
import { CATEGORIES, type Entry } from "./categories";

export const metadata = { title: "Outside — Naixin Zhang" };

function EntryItem({
  entry,
  category,
}: {
  entry: Entry;
  category: string;
}) {
  return (
    <Link
      href={`/outside/${category}/${entry.slug}`}
      className="group block -mx-2 px-2 py-1 rounded-sm"
    >
      <h3 className="font-serif text-[20px] leading-snug font-light text-[var(--foreground)] transition-colors duration-200 group-hover:text-white flex items-baseline gap-2">
        <span>{entry.title}</span>
        <span
          aria-hidden
          className="opacity-0 -translate-x-1 transition-all duration-200 text-[var(--muted)] group-hover:opacity-60 group-hover:translate-x-0 text-sm"
        >
          →
        </span>
      </h3>
      <p className="mt-1.5 text-[13.5px] leading-[1.6] text-[var(--muted)] opacity-80 font-light max-w-[34rem]">
        {entry.description}
      </p>
    </Link>
  );
}

export default function OutsidePage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-14">
      <header className="mb-14">
        <h1 className="font-serif text-4xl sm:text-5xl font-light tracking-tight">
          Outside
        </h1>
        <p className="mt-4 font-serif text-[16px] leading-[1.65] font-light text-[var(--muted)] max-w-[26rem]">
          The parts of life that happen away from the keyboard.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {CATEGORIES.map((c) => (
          <a
            key={c.slug}
            href={`#${c.slug}`}
            className="group border border-[var(--border)] p-6 transition-colors duration-200 hover:border-white/40 hover:bg-white/[0.02]"
          >
            <h2 className="font-serif text-[22px] font-light tracking-tight mb-3 transition-colors duration-200 group-hover:text-white">
              {c.name}
            </h2>
            <p className="text-[13.5px] leading-[1.6] text-[var(--muted)] font-light">
              {c.card}
            </p>
          </a>
        ))}
      </div>

      <div className="mt-24 divide-y divide-[var(--border)]/60">
        {CATEGORIES.map((c, i) => (
          <section
            key={c.slug}
            id={c.slug}
            className={`scroll-mt-24 ${i === 0 ? "pb-14" : "py-14 last:pb-0"}`}
          >
            <header className="mb-10">
              <h2 className="font-serif text-[28px] sm:text-[32px] font-light tracking-tight">
                {c.name}
              </h2>
              <p className="mt-3 font-serif text-[15px] leading-[1.65] font-light italic text-[var(--muted)] max-w-[26rem]">
                {c.intro}
              </p>
            </header>

            <ul className="space-y-7">
              {c.posts.map((entry) => (
                <li key={entry.slug}>
                  <EntryItem entry={entry} category={c.slug} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
