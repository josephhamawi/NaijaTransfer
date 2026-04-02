import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: {
    default: "NaijaTransfer — Send Large Files Free. No Account. No Wahala.",
    template: "%s | NaijaTransfer",
  },
  description:
    "Send large files up to 4GB for free in Nigeria. No account required. Resumable uploads built for Nigerian internet. WhatsApp sharing, Naira pricing, password protection.",
  keywords: [
    "file transfer Nigeria",
    "send large files Nigeria",
    "WeTransfer alternative Nigeria",
    "free file sharing",
    "upload large files",
    "NaijaTransfer",
    "Nollywood file sharing",
    "send files WhatsApp",
    "resumable upload Nigeria",
    "file transfer Africa",
  ],
  authors: [{ name: "NaijaTransfer" }],
  creator: "NaijaTransfer",
  publisher: "NaijaTransfer",
  metadataBase: new URL("https://naijatransfer.com"),
  alternates: {
    canonical: "https://naijatransfer.com",
  },
  openGraph: {
    type: "website",
    locale: "en_NG",
    url: "https://naijatransfer.com",
    siteName: "NaijaTransfer",
    title: "NaijaTransfer — Send Large Files Free. No Account. No Wahala.",
    description:
      "Send files up to 4GB free. Resumable uploads for Nigerian internet. WhatsApp sharing. Naira pricing. Built in Nigeria, for Nigeria.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "NaijaTransfer — Send Large Files",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NaijaTransfer — Send Large Files Free",
    description: "4GB free. Resumable uploads. WhatsApp sharing. No account needed.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Add Google Search Console verification when ready
    // google: "your-verification-code",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#4EA8DE" },
    { media: "(prefers-color-scheme: dark)", color: "#1A1A2E" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        {/* BioWise analytics */}
        <script
          dangerouslySetInnerHTML={{
            __html: `window.bioWise={pixelId:'3ednX3J8ybanrQ5RozfprmWkK9h1'};(function(){var s=document.createElement('script');s.src='https://www.biowise.cc/pixel/v1.js';s.async=true;document.head.appendChild(s);})();`,
          }}
        />
        {/* Inline script to prevent FOUC (flash of unstyled content) for dark mode */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var mode = localStorage.getItem('nt-theme-mode');
                  var dark = mode === 'dark' || (mode !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  if (dark) document.documentElement.classList.add('dark');

                  var lw = localStorage.getItem('nt-lightweight-mode');
                  if (lw === 'true' || (lw === null && window.innerWidth < 768)) {
                    document.body.classList.add('lightweight');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
