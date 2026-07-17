import Image from "next/image";
import { redis, VIEWS_KEY } from "../lib/redis";
import { Tracker } from "../components/Tracker";

export const dynamic = "force-dynamic";

export default async function Home() {
  const views = (await redis.get<number>(VIEWS_KEY).catch(() => 0)) ?? 0;
  return <HomeContent views={views} />;
}

function HomeContent({ views }: { views: number }) {

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <section>
        <h1 className="text-4xl sm:text-5xl font-serif mb-6">Hello.</h1>
        <div className="max-w-2xl space-y-4 font-serif text-[16px] leading-[1.55] font-light text-[var(--foreground)]">
          <p>
            Hi, I&rsquo;m Naixin 👋 — a full-stack data scientist at Scale AI,
            based in the SF Bay Area.
          </p>
          <p>
            In the AI era, I think of myself{" "}
            <span className="glow">
              less as a traditional modeler and more as a builder
            </span>
            : someone who takes ambiguous business problems and turns them into
            systems that are thoughtful, useful, and — crucially — actually
            shipped. My favorite work lives at the messy intersection of data,
            product, engineering, and execution. Building good AI takes rigor,
            taste, and a willingness to leap from whiteboard to reality before
            the ink dries.
          </p>

          <div className="flex gap-4 py-2">
            <figure className="w-40 shrink-0">
              <div className="relative aspect-square w-40 overflow-hidden rounded-sm border border-[var(--border)]">
                <Image
                  src="/me.jpg"
                  alt="Naixin"
                  fill
                  sizes="160px"
                  className="object-cover"
                />
              </div>
              <figcaption className="mt-2 text-[11px] text-[var(--muted)] italic text-center leading-snug">
                Naixin — Rocky Mountain National Park, 12,183 ft, 2023
              </figcaption>
            </figure>
            <figure className="w-40 shrink-0">
              <div className="relative aspect-square w-40 overflow-hidden rounded-sm border border-[var(--border)]">
                <Image
                  src="/Thunder.jpg"
                  alt="Thunder, an 85 lb Japanese Akita"
                  fill
                  sizes="160px"
                  className="object-cover"
                />
              </div>
              <figcaption className="mt-2 text-[11px] text-[var(--muted)] italic text-center leading-snug">
                Thunder — Yosemite, 2024
              </figcaption>
            </figure>
          </div>

          <p>
            Outside of work, you&rsquo;ll find me traveling, gardening, and
            collecting Japanese tableware (日器) — or on the move: tennis,
            badminton, marathon training, and getting regularly humbled at
            CrossFit. I also study companies and industries through the lens of
            value investing, which has quietly become one of my favorite ways
            to think.
          </p>
          <p>
            Somehow, all of this adds up to how I approach work and life: with
            patience, curiosity, and a soft spot for things that are carefully
            built and quietly enduring. Thunder, my 85 lb Japanese Akita, is
            involved in most decisions :p
          </p>
        </div>

        <p className="mt-6 text-sm text-[var(--muted)]">
          <a href="mailto:hello@naixin.dev" className="underline underline-offset-4">Email</a>
          <span className="mx-3">·</span>
          <a href="https://www.linkedin.com/in/naixinzhang1104/" className="underline underline-offset-4">LinkedIn</a>
          <span className="mx-3">·</span>
          <a href="https://x.com/" className="underline underline-offset-4">X</a>
        </p>
        <hr className="mt-5 max-w-2xl border-t border-[var(--border)]" />
        <p className="mt-3 text-xs text-[var(--muted)]">
          {views.toLocaleString()} page views since Apr 13, 2026
        </p>
      </section>
      <Tracker />
    </div>
  );
}
