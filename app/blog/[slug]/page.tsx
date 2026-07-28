import Link from "next/link";
import { notFound } from "next/navigation";
import { getPost } from "@/lib/mdx";
import { renderContent } from "@/lib/renderContent";
import { allSlugs, findPost } from "../posts";
import { ShareRow } from "@/components/ShareRow";

export function generateStaticParams() {
  return allSlugs().map((slug) => ({ slug }));
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function formatDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
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
  const { post, part, bucket } = found;
  const doc = getPost("blog", slug);

  return (
    <article className="max-w-2xl mx-auto px-6 py-16">
      <p className="font-sans text-[12px] font-semibold uppercase tracking-[0.14em] mb-4">
        <span className="text-[var(--eb-accent)]">
          {bucket === "Evaluate" ? `Beyond Error Bars · Part ${part}` : bucket}
        </span>
        <span className="font-normal text-[var(--muted)]"> · {formatDate(post.date)}</span>
      </p>
      <h1 className="font-sans text-[1.35rem] sm:text-[1.55rem] font-bold leading-[1.25] tracking-tight mb-3">
        {post.title}
      </h1>
      <p className="font-sans text-[16px] leading-[1.6] text-[var(--muted)] max-w-xl mb-4">
        {post.description}
      </p>

      <div className="prose-mono text-[17px] text-[var(--foreground)]">
        {doc ? renderContent(doc.content) : <p>Coming soon.</p>}
      </div>

      <footer className="mt-8 pt-6 border-t border-[var(--border)]/60 flex items-baseline justify-between gap-4 flex-wrap">
        <Link
          href="/blog"
          className="font-serif text-[14px] italic text-[var(--muted)] hover:text-[var(--foreground)] transition-colors duration-200"
        >
          ← Back to Blog
        </Link>
        <ShareRow
          url={`https://naixinzhang.com/blog/${slug}`}
          title={post.title}
        />
      </footer>
    </article>
  );
}
