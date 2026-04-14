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
    slug: "build",
    name: "Build",
    card: "Systems thinking, shipped products, and the work of turning ambiguity into something real.",
    intro: "Systems, product thinking, and the work of shipping useful things.",
    posts: [
      {
        slug: "what-a-data-scientist-actually-does-at-an-ai-company",
        title: "What a Data Scientist Actually Does at an AI Company",
        description:
          "The role is becoming less about isolated analysis and more about building systems that connect data, product, operations, and engineering.",
      },
      {
        slug: "from-fuzzy-problem-to-shipped-system",
        title: "From Fuzzy Problem to Shipped System",
        description:
          "On turning ambiguous business problems into thoughtful, useful, shipped systems.",
      },
      {
        slug: "why-the-best-ai-data-scientists-think-like-builders",
        title: "Why the Best AI Data Scientists Think Like Builders",
        description:
          "The job is changing from analysis alone to building things that work in the wild.",
      },
    ],
  },
  {
    slug: "evaluate",
    name: "Evaluate",
    card: "Model evaluation, quality, human judgment, and what useful measurement actually looks like.",
    intro: "On quality, judgment, and what useful evaluation really requires.",
    posts: [
      {
        slug: "model-evaluation-is-more-than-benchmarks",
        title: "Model Evaluation Is More Than Benchmarks",
        description:
          "Why good evaluation depends as much on design and judgment as on metrics.",
      },
      {
        slug: "what-quality-really-means-in-ai",
        title: "What \u201CQuality\u201D Really Means in AI",
        description:
          "A closer look at model quality, human judgment, and operational reality.",
      },
      {
        slug: "human-judgment-is-part-of-the-model",
        title: "Human Judgment Is Part of the Model",
        description:
          "The role of raters, disagreement, and evaluation design in real AI systems.",
      },
    ],
  },
  {
    slug: "industry",
    name: "Industry",
    card: "Data labeling, incentives, AI operations, and where the role of data science is going.",
    intro: "The human and operational systems behind modern AI.",
    posts: [
      {
        slug: "thoughts-on-the-data-labeling-industry",
        title: "Thoughts on the Data Labeling Industry",
        description:
          "The hidden labor, incentives, and systems behind modern AI.",
      },
      {
        slug: "the-hidden-economics-of-human-in-the-loop-ai",
        title: "The Hidden Economics of Human-in-the-Loop AI",
        description:
          "Why labor design, incentives, and operations shape model outcomes.",
      },
      {
        slug: "the-future-shape-of-data-science-in-the-ai-era",
        title: "The Future Shape of Data Science in the AI Era",
        description:
          "Why the role is shifting from analyst to builder.",
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
