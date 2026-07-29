import Link from "next/link";
import { BUCKETS } from "./posts";

export const metadata = { title: "Blog — Naixin Zhang" };

const SERIES_DATE = "2026-06-01";

const seriesPosts = BUCKETS[0].posts;
const standalone = BUCKETS.filter((b) => b.slug !== "evaluate").flatMap(
  (b) => b.posts
);

type Entry =
  | { kind: "series"; date: string }
  | { kind: "post"; date: string; post: (typeof standalone)[number] };

const entries: Entry[] = [
  { kind: "series" as const, date: SERIES_DATE },
  ...standalone.map((post) => ({ kind: "post" as const, date: post.date, post })),
].sort((a, b) => b.date.localeCompare(a.date));

function SeriesBlock() {
  return (
    <div>
      <div className="flex items-baseline">
        <span className="font-mono text-[13px] text-[var(--muted)] shrink-0 w-[6.5rem] tabular-nums">
          {SERIES_DATE}
        </span>
        <p className="font-serif text-[17px] leading-[1.6] text-[var(--foreground)]">
          Beyond Error Bars
          <span className="text-[var(--muted)]">
            {" "}
            — a nine-part series on the statistics of LLM evaluation.
          </span>
        </p>
      </div>

      <ul className="mt-8 pl-[6.5rem]">
        {seriesPosts.map((post, i) => (
          <li key={post.slug}>
            <Link
              href={`/blog/${post.slug}`}
              className="group flex gap-4 items-baseline py-1.5"
            >
              <span className="font-mono text-[13px] text-[var(--muted)] shrink-0 w-14 tabular-nums">
                Part {i + 1}
              </span>
              <span className="font-serif text-[17px] leading-[1.6] text-[var(--foreground)] transition-opacity duration-200 group-hover:opacity-50">
                {post.title}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function BuildPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16">
      {entries.map((entry, i) => {
        const spacing = i === 0 ? "" : "mt-10";
        if (entry.kind === "series") {
          return (
            <div key="series" className={spacing}>
              <SeriesBlock />
            </div>
          );
        }
        const { post } = entry;
        return (
          <div key={post.slug} className={`flex items-baseline ${spacing}`}>
            <span className="font-mono text-[13px] text-[var(--muted)] shrink-0 w-[6.5rem] tabular-nums">
              {post.date}
            </span>
            <p className="font-serif text-[17px] leading-[1.6] text-[var(--foreground)]">
              <Link
                href={`/blog/${post.slug}`}
                className="transition-opacity duration-200 hover:opacity-50"
              >
                {post.title}
              </Link>
              <span className="text-[var(--muted)]"> — {post.description}</span>
            </p>
          </div>
        );
      })}
    </div>
  );
}
