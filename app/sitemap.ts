import type { MetadataRoute } from "next";
import { allSlugs } from "./build/posts";
import { CATEGORIES } from "./outside/categories";

const BASE = "https://naixin.dev";

export default function sitemap(): MetadataRoute.Sitemap {
  const fixed = ["", "/build", "/outside"];
  const build = allSlugs().map((slug) => `/build/${slug}`);
  const outsideCats = CATEGORIES.map((c) => `/outside/${c.slug}`);
  const outsidePosts = CATEGORIES.flatMap((c) =>
    c.posts.map((p) => `/outside/${c.slug}/${p.slug}`)
  );
  return [...fixed, ...build, ...outsideCats, ...outsidePosts].map((path) => ({
    url: `${BASE}${path}`,
    lastModified: new Date(),
  }));
}
