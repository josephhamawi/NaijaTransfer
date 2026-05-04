import type { Metadata } from "next";
import Link from "next/link";
import PageLayout from "@/components/layout/PageLayout";
import {
  getAllPosts,
  clusterLabel,
  formatPostDate,
  type BlogCluster,
} from "@/lib/blog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blog | NaijaTransfer: guides for Nigerian creators",
  description:
    "Guides on sending large files, delivering creative work, and getting past slow Nigerian upload speeds. Writing for producers, designers, photographers, and video editors.",
  alternates: { canonical: "https://naijatransfer.com/blog" },
  openGraph: {
    title: "NaijaTransfer Blog",
    description:
      "Guides on sending large files, delivering creative work, and getting past slow Nigerian upload speeds.",
    url: "https://naijatransfer.com/blog",
    type: "website",
  },
};

const CLUSTERS: BlogCluster[] = ["creators", "formats", "speed", "compare"];

export default function BlogIndex() {
  const posts = getAllPosts();
  const byCluster: Record<BlogCluster, typeof posts> = {
    creators: [],
    formats: [],
    speed: [],
    compare: [],
  };
  for (const p of posts) byCluster[p.cluster].push(p);

  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto px-4 pt-28 pb-16 text-white">
        <header className="mb-12">
          <p className="text-sm text-nigerian-green font-medium mb-3 uppercase tracking-wide">
            NaijaTransfer Blog
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 leading-tight">
            Guides for Nigerian creators who send big files.
          </h1>
          <p className="text-lg text-white/70 max-w-2xl">
            Producers, designers, photographers, video editors. If your work
            is measured in gigabytes and your uplink is measured in
            megabits, you&apos;re in the right place.
          </p>
        </header>

        {CLUSTERS.map((c) =>
          byCluster[c].length > 0 ? (
            <section key={c} className="mb-14">
              <h2 className="text-2xl font-bold mb-6 text-white">
                {clusterLabel(c)}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {byCluster[c].map((post) => (
                  <Link
                    key={post.slug}
                    href={`/blog/${post.slug}`}
                    className="block p-5 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-colors"
                  >
                    <h3 className="text-lg font-semibold mb-2 text-white">
                      {post.title}
                    </h3>
                    <p className="text-sm text-white/60 mb-3 line-clamp-2">
                      {post.description}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-white/40">
                      <time dateTime={post.date}>
                        {formatPostDate(post.date)}
                      </time>
                      <span>{post.readingTimeMinutes} min read</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ) : null
        )}

        <section className="mt-16 p-8 rounded-2xl bg-nigerian-green/10 border border-nigerian-green/30 text-center">
          <h2 className="text-2xl font-bold mb-2">
            Stop reading, start sending.
          </h2>
          <p className="text-white/70 mb-5">
            Up to 4 GB free. No signup. Built for Nigerian internet.
          </p>
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 rounded-xl bg-nigerian-green text-white font-semibold hover:bg-nigerian-green/90 transition-colors"
          >
            Send a file now
          </Link>
        </section>
      </div>
    </PageLayout>
  );
}
