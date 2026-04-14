import Link from "next/link";
import { BUCKETS, type Post } from "./posts";

export const metadata = { title: "Build — Naixin Zhang" };

function PostItem({ post }: { post: Post }) {
  return (
    <Link href={`/build/${post.slug}`} className="group block -mx-2 px-2 py-1 rounded-sm">
      <h3 className="font-serif text-[20px] leading-snug font-light text-[var(--foreground)] transition-colors duration-200 group-hover:text-white flex items-baseline gap-2">
        <span>{post.title}</span>
        <span
          aria-hidden
          className="opacity-0 -translate-x-1 transition-all duration-200 text-[var(--muted)] group-hover:opacity-60 group-hover:translate-x-0 text-sm"
        >
          →
        </span>
      </h3>
      <p className="mt-1.5 text-[13.5px] leading-[1.6] text-[var(--muted)] opacity-80 font-light max-w-[34rem]">
        {post.description}
      </p>
    </Link>
  );
}

export default function BuildPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-14">
      <header className="mb-14">
        <h1 className="font-serif text-4xl sm:text-5xl font-light tracking-tight">
          Build
        </h1>
        <p className="mt-4 font-serif text-[16px] leading-[1.65] font-light text-[var(--muted)] max-w-[26rem]">
          Projects, essays, and notes on AI systems, evaluation, and the
          industry behind them.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {BUCKETS.map((b) => (
          <a
            key={b.slug}
            href={`#${b.slug}`}
            className="group border border-[var(--border)] p-6 transition-colors duration-200 hover:border-white/40 hover:bg-white/[0.02]"
          >
            <h2 className="font-serif text-[22px] font-light tracking-tight mb-3 transition-colors duration-200 group-hover:text-white">
              {b.name}
            </h2>
            <p className="text-[13.5px] leading-[1.6] text-[var(--muted)] font-light">
              {b.card}
            </p>
          </a>
        ))}
      </div>

      <div className="mt-24 divide-y divide-[var(--border)]/60">
        {BUCKETS.map((b, i) => (
          <section
            key={b.slug}
            id={b.slug}
            className={`scroll-mt-24 ${i === 0 ? "pb-14" : "py-14 last:pb-0"}`}
          >
            <header className="mb-10">
              <h2 className="font-serif text-[28px] sm:text-[32px] font-light tracking-tight">
                {b.name}
              </h2>
              <p className="mt-3 font-serif text-[15px] leading-[1.65] font-light italic text-[var(--muted)] max-w-[26rem]">
                {b.intro}
              </p>
            </header>

            <ul className="space-y-7">
              {b.posts.map((post) => (
                <li key={post.slug}>
                  <PostItem post={post} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
