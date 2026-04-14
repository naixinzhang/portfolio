import Link from "next/link";
import { notFound } from "next/navigation";
import { CATEGORIES, findCategory, type Entry } from "../categories";

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const c = findCategory(category);
  return { title: c ? `${c.name} — Naixin Zhang` : "Outside" };
}

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

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const c = findCategory(category);
  if (!c) notFound();

  return (
    <div className="max-w-3xl mx-auto px-6 py-14">
      <header className="mb-14">
        <p className="font-serif text-[13px] italic text-[var(--muted)] mb-3 tracking-wide">
          <Link href="/outside" className="hover:text-white transition-colors">
            Outside
          </Link>
        </p>
        <h1 className="font-serif text-4xl sm:text-5xl font-light tracking-tight">
          {c.name}
        </h1>
        <p className="mt-4 font-serif text-[16px] leading-[1.65] font-light text-[var(--muted)] max-w-[26rem]">
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
    </div>
  );
}
