import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

export type Frontmatter = {
  title?: string;
  date: string;
  excerpt?: string;
  images?: string[];
  draft?: boolean;
};

export type Post = {
  slug: string;
  frontmatter: Frontmatter;
  content: string;
};

const ROOT = path.join(process.cwd(), "content");

export function getPosts(section: string): Post[] {
  const dir = path.join(ROOT, section);
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter((f) => /\.(mdx?|html)$/.test(f));
  const posts = files.map((file) => {
    const raw = fs.readFileSync(path.join(dir, file), "utf8");
    const { data, content } = matter(raw);
    const slug = file.replace(/\.(mdx?|html)$/, "");
    const date = data.date instanceof Date
      ? data.date.toISOString().slice(0, 10)
      : String(data.date ?? "");
    return { slug, frontmatter: { ...data, date } as Frontmatter, content };
  });
  const filtered = process.env.NODE_ENV === "production"
    ? posts.filter((p) => !p.frontmatter.draft)
    : posts;
  return filtered.sort((a, b) =>
    (b.frontmatter.date ?? "").localeCompare(a.frontmatter.date ?? "")
  );
}

export function getPost(section: string, slug: string): Post | null {
  return getPosts(section).find((p) => p.slug === slug) ?? null;
}
