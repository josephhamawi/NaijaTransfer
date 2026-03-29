// File request upload page
// Implementation in Epic 7

import PageLayout from "@/components/layout/PageLayout";

interface FileRequestPageProps {
  params: { code: string };
}

export default function FileRequestPage({ params }: FileRequestPageProps) {
  return (
    <PageLayout>
      <div className="max-w-3xl mx-auto px-4 pt-24 pb-16 text-center">
        <h1 className="text-display font-bold mb-4">File Request</h1>
        <p className="text-body text-[var(--text-secondary)]">File request page: {params.code}</p>
      </div>
    </PageLayout>
  );
}
