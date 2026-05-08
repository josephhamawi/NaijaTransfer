import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageLayout from "@/components/layout/PageLayout";
import {
  getAllPosts,
  getPost,
  getRelatedPosts,
  formatPostDate,
  clusterLabel,
} from "@/lib/blog";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return { title: "Not found" };
  const url = `https://naijatransfer.com/blog/${post.slug}`;
  return {
    title: `${post.title} | NaijaTransfer Blog`,
    description: post.description,
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: post.description,
      url,
      type: "article",
      publishedTime: post.date,
      modifiedTime: post.updated ?? post.date,
      tags: post.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const related = getRelatedPosts(post.slug, 3);
  const url = `https://naijatransfer.com/blog/${post.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.updated ?? post.date,
    author: {
      "@type": "Organization",
      name: "NaijaTransfer",
      url: "https://naijatransfer.com",
    },
    publisher: {
      "@type": "Organization",
      name: "NaijaTransfer",
      url: "https://naijatransfer.com",
      logo: {
        "@type": "ImageObject",
        url: "https://naijatransfer.com/logo-40.png",
      },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    keywords: post.tags.join(", "),
  };

  return (
    <PageLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article className="max-w-3xl mx-auto px-4 pt-28 pb-16 text-[var(--text-primary)]">
        <nav className="mb-6 text-sm text-[var(--text-secondary)]">
          <Link href="/" className="hover:text-[var(--text-primary)]">
            Home
          </Link>{" "}
          <span className="mx-2">/</span>
          <Link href="/blog" className="hover:text-[var(--text-primary)]">
            Blog
          </Link>{" "}
          <span className="mx-2">/</span>
          <span>{clusterLabel(post.cluster)}</span>
        </nav>

        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4 leading-tight">
            {post.title}
          </h1>
          <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
            <time dateTime={post.date}>{formatPostDate(post.date)}</time>
            <span>&middot;</span>
            <span>{post.readingTimeMinutes} min read</span>
          </div>
        </header>

        <div
          className="blog-prose"
          dangerouslySetInnerHTML={{ __html: post.html }}
        />

        <aside className="mt-12 p-6 rounded-2xl bg-nigerian-green/10 border border-nigerian-green/30">
          <h3 className="text-lg font-semibold mb-2">
            Got a file to send right now?
          </h3>
          <p className="text-[var(--text-secondary)] mb-4">
            NaijaTransfer does up to 4 GB free, resumable if your ISP drops,
            and uploads from a Lagos edge on paid plans.
          </p>
          <Link
            href="/"
            className="inline-flex items-center px-5 py-2.5 rounded-xl bg-nigerian-green text-white font-semibold hover:bg-nigerian-green/90 transition-colors"
          >
            Try it free
          </Link>
        </aside>

        {related.length > 0 && (
          <section className="mt-14">
            <h2 className="text-xl font-bold mb-5">Related reading</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/blog/${r.slug}`}
                  className="block p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-elevated)] hover:border-nigerian-green/60 hover:shadow-md transition-all"
                >
                  <h3 className="text-sm font-semibold mb-1">{r.title}</h3>
                  <p className="text-xs text-[var(--text-secondary)] line-clamp-2">
                    {r.description}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </PageLayout>
  );
}
