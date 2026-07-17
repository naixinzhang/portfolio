import Link from "next/link";
import { BUCKETS } from "./posts";

export const metadata = { title: "Beyond Error Bars — Naixin Zhang" };

const posts = BUCKETS[0].posts;

export default function BuildPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      <div className="flex items-baseline">
        <span className="font-mono text-[13px] text-[var(--muted)] shrink-0 w-[6.5rem] tabular-nums">
          2026-06-01
        </span>
        <p className="font-serif text-[16px] leading-[1.55] text-[var(--foreground)]">
          Beyond Error Bars
          <span className="text-[var(--muted)]">
            {" "}
            — a nine-part series on the statistics of LLM evaluation.
          </span>
        </p>
      </div>

      <ul className="mt-6 pl-[6.5rem]">
        {posts.map((post, i) => (
          <li key={post.slug}>
            <Link
              href={`/blog/${post.slug}`}
              className="group flex gap-4 items-baseline py-[3px]"
            >
              <span className="font-mono text-[13px] text-[var(--muted)] shrink-0 w-14 tabular-nums">
                Part {i + 1}
              </span>
              <span className="font-serif text-[16px] leading-[1.55] font-light text-[var(--foreground)] transition-opacity duration-200 group-hover:opacity-50">
                {post.title}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
