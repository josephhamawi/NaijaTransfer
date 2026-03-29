// File request upload page
// Implementation in Epic 7

interface FileRequestPageProps {
  params: { code: string };
}

export default function FileRequestPage({ params }: FileRequestPageProps) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <p className="text-gray-500">File request page: {params.code}</p>
    </main>
  );
}
