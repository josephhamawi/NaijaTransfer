import type { Metadata } from "next";
import PageLayout from "@/components/layout/PageLayout";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "Featured Artists — NigeriaTransfer",
  description: "Nigerian artists whose work is featured as backgrounds on NigeriaTransfer.",
};

const artists = [
  { name: "Featured Artist 1", description: "Lagos-based photographer capturing the city's energy and nightlife.", url: "#" },
  { name: "Featured Artist 2", description: "Textile designer blending traditional Adire patterns with modern aesthetics.", url: "#" },
  { name: "Featured Artist 3", description: "Digital artist creating vibrant Afrofuturism landscapes.", url: "#" },
];

export default function ArtistsPage() {
  return (
    <PageLayout>
      <div className="max-w-3xl mx-auto px-4 pt-24 pb-16">
        <h1 className="text-display font-bold mb-3 text-center">Featured Artists</h1>
        <p className="text-body text-[var(--text-secondary)] text-center mb-12 max-w-xl mx-auto">
          The backgrounds you see on NigeriaTransfer are created by Nigerian artists and photographers. Every time you send a file, you experience their work.
        </p>

        <div className="space-y-6">
          {artists.map((artist) => (
            <Card key={artist.name} padding="lg" elevation="sm">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-lg bg-nigerian-green/10 flex items-center justify-center shrink-0">
                  <svg className="w-8 h-8 text-nigerian-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-h3 font-bold">{artist.name}</h2>
                  <p className="text-body-sm text-[var(--text-secondary)] mt-1">{artist.description}</p>
                  <a href={artist.url} className="text-body-sm text-nigerian-green hover:underline mt-2 inline-block">View their work</a>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-body text-[var(--text-secondary)] mb-2">Are you a Nigerian artist or photographer?</p>
          <p className="text-body-sm text-[var(--text-muted)]">
            We&apos;re always looking for new backgrounds. Contact us at <a href="mailto:artists@nigeriatransfer.com" className="text-nigerian-green hover:underline">artists@nigeriatransfer.com</a>
          </p>
        </div>
      </div>
    </PageLayout>
  );
}
