import type { Metadata } from "next";
import PageLayout from "@/components/layout/PageLayout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { WALLPAPERS } from "@/data/wallpapers";

export const metadata: Metadata = {
  title: "Artists & photographers | NaijaTransfer",
  description:
    "Nigerian artists and photographers whose work is the wallpaper behind every NaijaTransfer upload. Submit your portfolio to be featured.",
  alternates: { canonical: "https://naijatransfer.com/artists" },
};

const SUBMIT_HREF =
  "mailto:hello@kodefoundry.com" +
  "?subject=" +
  encodeURIComponent("Artist submission for NaijaTransfer") +
  "&body=" +
  encodeURIComponent(
    "Hi NaijaTransfer team,\n\n" +
      "I'd like to submit my work to be featured as a wallpaper.\n\n" +
      "Name:\n" +
      "Where I'm based:\n" +
      "Portfolio link:\n" +
      "Notes (subject, location, anything I'd want credited):\n\n" +
      "Sample images attached.\n\n" +
      "Thanks,\n"
  );

// Group wallpapers by artist so a photographer with multiple shots
// shows up as one credit with all their pieces, not duplicated rows.
type ArtistGroup = {
  name: string;
  url?: string;
  works: { title: string; image: string }[];
};

const featured: ArtistGroup[] = (() => {
  const map = new Map<string, ArtistGroup>();
  for (const w of WALLPAPERS) {
    const existing = map.get(w.artistName);
    const piece = { title: w.artworkTitle, image: w.imageUrl };
    if (existing) {
      existing.works.push(piece);
    } else {
      map.set(w.artistName, {
        name: w.artistName,
        url: w.artistUrl || undefined,
        works: [piece],
      });
    }
  }
  return Array.from(map.values());
})();

export default function ArtistsPage() {
  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto px-4 pt-24 pb-16">
        {/* Hero */}
        <div className="text-center mb-12">
          <p className="text-caption-style uppercase tracking-wide text-nigerian-green mb-3">
            Artists & photographers
          </p>
          <h1 className="text-h1 sm:text-display font-bold mb-4">
            Your photo, behind every Nigerian&apos;s upload.
          </h1>
          <p className="text-body text-[var(--text-secondary)] max-w-2xl mx-auto mb-6">
            Every wallpaper on NaijaTransfer comes from a Nigerian
            photographer or visual artist. Send us your portfolio and we&apos;ll
            credit you on the screen people stare at while their files upload.
          </p>
          <a href={SUBMIT_HREF}>
            <Button variant="primary" size="lg">Submit your work</Button>
          </a>
        </div>

        {/* Currently featured */}
        <section className="mb-16">
          <h2 className="text-h2 font-bold mb-6">Currently on rotation</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {featured.map((artist) => (
              <Card key={artist.name} padding="lg" elevation="sm">
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {artist.works.map((work) => (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      key={work.image}
                      src={work.image}
                      alt={`${work.title} by ${artist.name}`}
                      width={300}
                      height={200}
                      loading="lazy"
                      className="w-full h-32 object-cover rounded-md"
                    />
                  ))}
                </div>
                <h3 className="text-h3 font-bold">{artist.name}</h3>
                <p className="text-body-sm text-[var(--text-secondary)] mt-1">
                  {artist.works.map((w) => w.title).join(" · ")}
                </p>
                {artist.url && (
                  <a
                    href={artist.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-body-sm text-nigerian-green hover:underline mt-2 inline-block"
                  >
                    See more of their work →
                  </a>
                )}
              </Card>
            ))}
          </div>
        </section>

        {/* What we look for */}
        <section className="mb-16">
          <h2 className="text-h2 font-bold mb-6">What we feature</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card padding="md" elevation="sm">
              <h3 className="text-body font-semibold mb-1">Nigeria, in any frame</h3>
              <p className="text-body-sm text-[var(--text-secondary)]">
                Cities, markets, landscapes, portraits, architecture, street life. If it&apos;s a slice of Nigerian visual life, we want to see it.
              </p>
            </Card>
            <Card padding="md" elevation="sm">
              <h3 className="text-body font-semibold mb-1">Landscape orientation, high resolution</h3>
              <p className="text-body-sm text-[var(--text-secondary)]">
                The wallpaper sits behind a desktop and mobile widget, so we need at least 2400px wide. Vertical and square images don&apos;t fit the layout.
              </p>
            </Card>
            <Card padding="md" elevation="sm">
              <h3 className="text-body font-semibold mb-1">Your work, with rights you can grant</h3>
              <p className="text-body-sm text-[var(--text-secondary)]">
                Original photographs or illustrations you own. Stock and AI-generated images get rejected at review.
              </p>
            </Card>
            <Card padding="md" elevation="sm">
              <h3 className="text-body font-semibold mb-1">Credit on every view</h3>
              <p className="text-body-sm text-[var(--text-secondary)]">
                If we feature your work you get a name credit on the upload screen, a link out to your portfolio, and a row on this page.
              </p>
            </Card>
          </div>
        </section>

        {/* Submit CTA */}
        <Card padding="lg" elevation="md" className="text-center">
          <h2 className="text-h2 font-bold mb-2">Ready to submit?</h2>
          <p className="text-body text-[var(--text-secondary)] mb-5 max-w-lg mx-auto">
            Email us a portfolio link and 2 to 3 sample images. If your work fits, we&apos;ll add it to the rotation in the next release.
          </p>
          <a href={SUBMIT_HREF}>
            <Button variant="primary" size="lg">Email hello@kodefoundry.com</Button>
          </a>
          <p className="text-body-sm text-[var(--text-muted)] mt-4">
            We read every submission. Replies usually come within a few days.
          </p>
        </Card>
      </div>
    </PageLayout>
  );
}
