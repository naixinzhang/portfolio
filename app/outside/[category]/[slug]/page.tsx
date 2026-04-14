import Link from "next/link";
import { notFound } from "next/navigation";
import { CATEGORIES, findEntry } from "../../categories";

export function generateStaticParams() {
  return CATEGORIES.flatMap((c) =>
    c.posts.map((p) => ({ category: c.slug, slug: p.slug }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { category, slug } = await params;
  const found = findEntry(category, slug);
  return {
    title: found ? `${found.entry.title} — Naixin Zhang` : "Post",
  };
}

export default async function OutsidePost({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  const { category, slug } = await params;
  const found = findEntry(category, slug);
  if (!found) notFound();
  const { entry, category: c } = found;

  return (
    <article className="max-w-2xl mx-auto px-6 py-16">
      <p className="font-serif text-[13px] italic text-[var(--muted)] mb-5 tracking-wide">
        <Link href="/outside" className="hover:text-white transition-colors">
          Outside
        </Link>
        <span className="mx-2 opacity-50">/</span>
        <Link
          href={`/outside/${c.slug}`}
          className="hover:text-white transition-colors"
        >
          {c.name}
        </Link>
      </p>
      <h1 className="font-serif text-3xl sm:text-4xl font-light leading-[1.2] tracking-tight mb-5">
        {entry.title}
      </h1>
      <p className="font-serif text-[16px] leading-[1.65] font-light text-[var(--muted)] max-w-xl mb-16">
        {entry.description}
      </p>

      <div className="font-serif text-[16px] leading-[1.75] font-light text-[var(--foreground)] opacity-80">
        <p>Coming soon.</p>
      </div>

      <footer className="mt-24 pt-8 border-t border-[var(--border)]/60">
        <Link
          href={`/outside/${c.slug}`}
          className="font-serif text-[14px] italic text-[var(--muted)] hover:text-white transition-colors duration-200"
        >
          ← Back to {c.name}
        </Link>
      </footer>
    </article>
  );
}
