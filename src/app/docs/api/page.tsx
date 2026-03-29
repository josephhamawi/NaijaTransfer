import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "API Documentation",
  description: "NigeriaTransfer public API documentation for developers.",
};

export default function ApiDocsPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <h1 className="mb-4 text-3xl font-bold">API Documentation</h1>
      <p className="text-gray-500">API docs coming in Epic 8...</p>
    </main>
  );
}
