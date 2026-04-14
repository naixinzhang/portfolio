export type Entry = {
  slug: string;
  title: string;
  description: string;
};

export type Category = {
  slug: string;
  name: string;
  intro: string;
  card: string;
  posts: Entry[];
};

export const CATEGORIES: Category[] = [
  {
    slug: "gardening",
    name: "Gardening",
    intro: "Seasonal notes from the garden.",
    card: "Camellias, roses, fruit trees, and what the garden is teaching me this season.",
    posts: [
      {
        slug: "camellias-in-early-spring",
        title: "Camellias in Early Spring",
        description:
          "Notes on bloom cycles, varieties, and what\u2019s thriving this season.",
      },
      {
        slug: "what-im-learning-from-fruit-trees",
        title: "What I\u2019m Learning from Fruit Trees",
        description:
          "Small lessons from care, patience, and seasonal change.",
      },
      {
        slug: "rose-notes",
        title: "Rose Notes",
        description:
          "A running collection of observations from the garden.",
      },
    ],
  },
  {
    slug: "tableware",
    name: "Tableware",
    intro: "Japanese ceramics, piece by piece.",
    card: "A slow collection of Japanese porcelain \u2014 form, texture, and everyday use.",
    posts: [
      {
        slug: "pieces-i-keep-reaching-for",
        title: "Pieces I Keep Reaching For",
        description:
          "Notes on form, texture, and everyday use.",
      },
      {
        slug: "why-i-love-japanese-tableware",
        title: "Why I Love Japanese Tableware",
        description:
          "On utility, craftsmanship, and quiet beauty.",
      },
      {
        slug: "collecting-slowly",
        title: "Collecting Slowly",
        description:
          "Thoughts on collecting with taste and patience.",
      },
    ],
  },
  {
    slug: "traveling",
    name: "Traveling",
    intro: "Places I\u2019ve been, and what I took home.",
    card: "National parks, small cities, and the slow unfolding of a trip.",
    posts: [
      {
        slug: "forty-of-sixty-three",
        title: "40 of 63",
        description:
          "Notes from working through the U.S. national parks, one at a time.",
      },
      {
        slug: "why-i-travel-slowly",
        title: "Why I Travel Slowly",
        description:
          "On fewer places, more time, and what changes when you\u2019re not rushing.",
      },
      {
        slug: "a-trip-in-photos",
        title: "A Trip in Photos",
        description:
          "A running visual notebook from recent travels.",
      },
    ],
  },
  {
    slug: "investing",
    name: "Investing",
    intro: "Notes on companies, value, and how I think.",
    card: "Reading companies closely \u2014 patience, judgment, and long-term thinking.",
    posts: [
      {
        slug: "how-i-read-companies",
        title: "How I Read Companies",
        description:
          "A personal framework for studying businesses.",
      },
      {
        slug: "what-value-investing-taught-me",
        title: "What Value Investing Taught Me",
        description:
          "On patience, judgment, and long-term thinking.",
      },
      {
        slug: "notes-from-filings",
        title: "Notes from Filings",
        description:
          "Small observations from reading companies closely.",
      },
    ],
  },
];

export function findCategory(slug: string): Category | null {
  return CATEGORIES.find((c) => c.slug === slug) ?? null;
}

export function findEntry(
  categorySlug: string,
  entrySlug: string
): { category: Category; entry: Entry } | null {
  const category = findCategory(categorySlug);
  if (!category) return null;
  const entry = category.posts.find((p) => p.slug === entrySlug);
  if (!entry) return null;
  return { category, entry };
}
