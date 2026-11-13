import type { Metadata } from "next";
import PageLayout from "@/components/layout/PageLayout";
import LiveReceivePanel from "@/components/live/LiveReceivePanel";

/**
 * Live Send recipient page.
 *
 * `noindex` because the URL identifies a one-time, single-recipient
 * session. There is nothing here for a crawler, and an indexed
 * invitation would be a leak even without the fragment secret.
 */
export const metadata: Metadata = {
  title: "Receive files | NaijaTransfer",
  description: "Receive files sent directly to your browser with Live Send.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function LiveReceivePage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;

  return (
    <PageLayout>
      <div className="max-w-3xl mx-auto px-4 pt-24 pb-16">
        <LiveReceivePanel roomId={roomId} />
      </div>
    </PageLayout>
  );
}
