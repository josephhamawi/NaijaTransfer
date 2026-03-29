import type { Metadata } from "next";
import PageLayout from "@/components/layout/PageLayout";

export const metadata: Metadata = {
  title: "API Documentation",
  description: "NigeriaTransfer public API documentation for developers.",
};

export default function ApiDocsPage() {
  return (
    <PageLayout>
      <div className="max-w-3xl mx-auto px-4 pt-24 pb-16 text-center">
        <h1 className="text-display font-bold mb-4">API Documentation</h1>
        <p className="text-body text-[var(--text-secondary)]">API docs coming in Epic 8...</p>
      </div>
    </PageLayout>
  );
}
