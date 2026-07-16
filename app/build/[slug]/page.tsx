import Link from "next/link";
import { notFound } from "next/navigation";
import { getPost } from "@/lib/mdx";
import { renderContent } from "@/lib/renderContent";
import { allSlugs, findPost } from "../posts";

export function generateStaticParams() {
  return allSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const found = findPost(slug);
  return { title: found ? `${found.post.title} — Naixin Zhang` : "Post" };
}

export default async function BuildPost({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const found = findPost(slug);
  if (!found) notFound();
  const { post, bucket } = found;
  const doc = getPost("build", slug);

  return (
    <article className="max-w-2xl mx-auto px-6 py-16">
      <p className="font-serif text-[13px] italic text-[var(--muted)] mb-5 tracking-wide">
        {bucket}
      </p>
      <h1 className="font-serif text-3xl sm:text-4xl font-light leading-[1.2] tracking-tight mb-5">
        {post.title}
      </h1>
      <p className="font-serif text-[16px] leading-[1.65] font-light text-[var(--muted)] max-w-xl mb-16">
        {post.description}
      </p>

      <div className="prose-mono font-serif text-[16px] font-light text-[var(--foreground)] opacity-80">
        {doc ? renderContent(doc.content) : <p>Coming soon.</p>}
      </div>

      <footer className="mt-24 pt-8 border-t border-[var(--border)]/60">
        <Link
          href="/build"
          className="font-serif text-[14px] italic text-[var(--muted)] hover:text-white transition-colors duration-200"
        >
          ← Back to Build
        </Link>
      </footer>
    </article>
  );
}
