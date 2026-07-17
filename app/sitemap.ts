import type { MetadataRoute } from "next";
import { allSlugs } from "./blog/posts";
import { CATEGORIES } from "./outside/categories";

const BASE = "https://naixinzhang.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const fixed = ["", "/blog", "/outside"];
  const build = allSlugs().map((slug) => `/blog/${slug}`);
  const outsideCats = CATEGORIES.map((c) => `/outside/${c.slug}`);
  const outsidePosts = CATEGORIES.flatMap((c) =>
    c.posts.map((p) => `/outside/${c.slug}/${p.slug}`)
  );
  return [...fixed, ...build, ...outsideCats, ...outsidePosts].map((path) => ({
    url: `${BASE}${path}`,
    lastModified: new Date(),
  }));
}
