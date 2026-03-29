"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex items-center justify-center min-h-screen px-4 bg-[var(--bg-primary)]">
      <Card padding="lg" elevation="xl" className="w-full max-w-md text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-error-red" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h1 className="text-h2 font-bold mb-2">Something went wrong</h1>
        <p className="text-body-sm text-[var(--text-secondary)] mb-6">
          We&apos;re fixing this. Please try again.
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="primary" onClick={reset}>Try again</Button>
          <a href="/"><Button variant="outline">Go home</Button></a>
        </div>
      </Card>
    </div>
  );
}
