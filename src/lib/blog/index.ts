import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";

export type BlogCluster = "creators" | "formats" | "speed" | "compare";

export interface BlogPostMeta {
  slug: string;
  title: string;
  description: string;
  date: string;
  updated?: string;
  cluster: BlogCluster;
  tags: string[];
  readingTimeMinutes: number;
}

export interface BlogPost extends BlogPostMeta {
  content: string;
  html: string;
}

const BLOG_DIR = path.join(process.cwd(), "src/content/blog");

const CLUSTER_LABELS: Record<BlogCluster, string> = {
  creators: "Creator workflows",
  formats: "File formats & technical",
  speed: "Speed & Nigerian internet",
  compare: "Alternatives & comparisons",
};

export function clusterLabel(c: BlogCluster) {
  return CLUSTER_LABELS[c];
}

function computeReadingTime(markdown: string): number {
  const words = markdown.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 220));
}

function renderMarkdown(markdown: string): string {
  marked.setOptions({ gfm: true, breaks: false });
  return marked.parse(markdown, { async: false }) as string;
}

let _cache: BlogPost[] | null = null;

export function getAllPosts(): BlogPost[] {
  if (_cache) return _cache;
  if (!fs.existsSync(BLOG_DIR)) {
    _cache = [];
    return _cache;
  }
  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".md"));
  const posts: BlogPost[] = files.map((file) => {
    const raw = fs.readFileSync(path.join(BLOG_DIR, file), "utf8");
    const parsed = matter(raw);
    const slug = file.replace(/\.md$/, "");
    const data = parsed.data as Partial<BlogPostMeta>;
    const content = parsed.content;
    return {
      slug,
      title: data.title ?? slug,
      description: data.description ?? "",
      date: data.date ?? "2026-04-19",
      updated: data.updated,
      cluster: (data.cluster as BlogCluster) ?? "creators",
      tags: data.tags ?? [],
      readingTimeMinutes: computeReadingTime(content),
      content,
      html: renderMarkdown(content),
    };
  });
  posts.sort((a, b) => (a.date < b.date ? 1 : -1));
  _cache = posts;
  return posts;
}

export function getPost(slug: string): BlogPost | null {
  return getAllPosts().find((p) => p.slug === slug) ?? null;
}

export function getPostsByCluster(cluster: BlogCluster): BlogPost[] {
  return getAllPosts().filter((p) => p.cluster === cluster);
}

export function getRelatedPosts(slug: string, limit = 3): BlogPost[] {
  const current = getPost(slug);
  if (!current) return [];
  const all = getAllPosts().filter((p) => p.slug !== slug);
  const sameCluster = all.filter((p) => p.cluster === current.cluster);
  const sharedTagScore = (p: BlogPost) =>
    p.tags.filter((t) => current.tags.includes(t)).length;
  const scored = all
    .map((p) => ({
      post: p,
      score:
        (p.cluster === current.cluster ? 3 : 0) + sharedTagScore(p),
    }))
    .sort((a, b) => b.score - a.score);
  const picks = scored.slice(0, limit).map((s) => s.post);
  if (picks.length < limit) {
    for (const p of sameCluster) {
      if (!picks.includes(p) && picks.length < limit) picks.push(p);
    }
  }
  return picks.slice(0, limit);
}

export function formatPostDate(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
