import Link from "next/link";
import PageLayout from "@/components/layout/PageLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

/**
 * Shown with a real HTTP 404 when a transfer cannot be served.
 *
 * The wording covers invalid, expired and deleted alike, because
 * `getTransferByCode` cannot tell them apart — and from the recipient's
 * side the remedy is identical: ask the sender to send it again.
 * Claiming "this link never existed" to someone holding a link that
 * worked last week would just be wrong.
 */
export default function TransferNotFound() {
  return (
    <PageLayout showWallpaper>
      <div className="flex items-center justify-center min-h-screen px-4">
        <Card
          frosted
          elevation="xl"
          padding="lg"
          className="w-full max-w-full sm:max-w-md text-center"
        >
          <h1 className="text-h2 mb-2">This transfer isn&apos;t available</h1>
          <p className="text-body-sm text-[var(--text-secondary)] mb-2">
            The link may have expired, hit its download limit, or been deleted.
          </p>
          <p className="text-body-sm text-[var(--text-muted)] mb-6">
            Ask the sender for a fresh link — transfers are removed once they expire.
          </p>
          <Link href="/" className="contents">
            <Button variant="primary" size="lg" fullWidth>
              Send your own files free
            </Button>
          </Link>
        </Card>
      </div>
    </PageLayout>
  );
}
