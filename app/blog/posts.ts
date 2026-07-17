export type Post = {
  slug: string;
  title: string;
  description: string;
};

export type Bucket = {
  slug: string;
  name: string;
  card: string;
  intro: string;
  posts: Post[];
};

export const BUCKETS: Bucket[] = [
  {
    slug: "evaluate",
    name: "Evaluate",
    card: "Model evaluation, quality, human judgment, and what useful measurement actually looks like.",
    intro: "On quality, judgment, and what useful evaluation really requires.",
    posts: [
      {
        slug: "every-eval-era-created-the-next-measurement-problem",
        title: "Every Eval Era Created the Next Measurement Problem",
        description:
          "A short history of LLM evaluation, told as a chain of patches — and an argument that the next patch isn’t a new benchmark. It’s statistics.",
      },
      {
        slug: "an-eval-is-a-decision-instrument",
        title: "An Eval Is a Decision Instrument",
        description:
          "Not a score generator: a measurement instrument built to feed a specific decision — and every design choice should be derived backwards from that decision.",
      },
      {
        slug: "error-bars-applied",
        title: "Error Bars, Applied",
        description:
          "The field finally agrees that eval scores need error bars. This post is about the three places the textbook version breaks on contact with real evals: clustered items, small n, and what “#1” means once you have intervals.",
      },
      {
        slug: "how-many-examples-and-when-can-you-stop",
        title: "How Many Examples — and When Can You Stop?",
        description:
          "Power analysis answers “how many examples” in one formula. The harder question is when you're allowed to stop — because the way most teams stop turns a 5% error rate into 30%.",
      },
      {
        slug: "humans-are-instruments-rater-ops-is-the-eval",
        title: "Humans Are Instruments — Rater Ops Is the Eval",
        description:
          "Every eval bottoms out in a human judgment somewhere. This post treats those humans as measurement instruments — the agreement statistics and the operational discipline that separate labels you can build on from labels that merely look like data.",
      },
      {
        slug: "your-llm-judge-is-a-biased-noisy-instrument-debias-it",
        title: "Your LLM Judge Is a Biased, Noisy Instrument. Debias It.",
        description:
          "Everyone validates their judge now — and then trusts its pass-rate anyway. Judge accuracy is not estimate accuracy. Here is the correction epidemiology worked out in 1978, and the 2023 estimator that makes a small human-labeled set go a very long way.",
      },
      {
        slug: "rankings-under-uncertainty-what-arena-numbers-mean",
        title: "Rankings Under Uncertainty: What Arena Numbers Mean",
        description:
          "An arena leaderboard is a 1952 tournament model fitted to a stream of noisy pairwise votes. This post is about what that model assumes, how far a rank can move when nothing happened, and when to trust the number anyway.",
      },
      {
        slug: "agent-evals-the-statistics-of-pass-at-k-and-pass-hat-k",
        title: "Agent Evals: the Statistics of pass@k and pass^k",
        description:
          "The demo said eight for eight; production says one in three fails. Both are true — they're different statistics. pass@k measures capability, pass^k measures reliability, and the error bars on both are the part nobody computes.",
      },
      {
        slug: "building-a-product-eval-instrumented",
        title: "Building a Product Eval, Instrumented",
        description:
          "The build loop for product evals is settled canon: read traces, name the failures, write the rubric, automate the judge, gate the release. What the canon under-specifies is the measurement at each step — and the failure mode nobody checks: calibration ≠ discrimination.",
      },
    ],
  },
];

export function findPost(slug: string):
  | { post: Post; bucket: string }
  | null {
  for (const bucket of BUCKETS) {
    const post = bucket.posts.find((p) => p.slug === slug);
    if (post) return { post, bucket: bucket.name };
  }
  return null;
}

export function allSlugs(): string[] {
  return BUCKETS.flatMap((b) => b.posts.map((p) => p.slug));
}
