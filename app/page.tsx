import Image from "next/image";

export default function Home() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <section>
        <h1 className="text-4xl sm:text-5xl font-serif mb-6">Hello.</h1>
        <div className="max-w-2xl space-y-4 font-serif text-[17px] leading-[1.7] font-light text-[var(--foreground)]">
          <p>
            I&rsquo;m Naixin — a full-stack data scientist at Scale AI in the
            SF Bay Area. In the AI era,{" "}
            <span className="glow">
              I see myself less as a traditional modeler and more as a builder
            </span>
            : I enjoy turning ambiguous business problems into systems that
            are thoughtful, useful, and shipped.
          </p>
          <p>
            The work I&rsquo;m most drawn to sits at the intersection of data,
            product, engineering, and execution. Good AI building requires
            rigor, taste, and the ability to move quickly from abstraction to
            reality.
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
            Outside work, I spend my time traveling, gardening, collecting
            Japanese tableware, playing tennis, and learning CrossFit. I also
            enjoy studying companies through the lens of value investing,
            which has become one of my favorite ways to think.
          </p>
          <p>
            Together, these hobbies have shaped how I see both work and life:
            with patience, curiosity, and an appreciation for things that are
            carefully built and quietly enduring. Thunder, my 85 lb Japanese
            Akita, is involved in most decisions :p
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
          138 page views since Apr 13, 2026
        </p>
      </section>
    </div>
  );
}
