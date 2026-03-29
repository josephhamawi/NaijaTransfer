import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: {
    default: "NigeriaTransfer - Send Large Files. No Account. No Wahala.",
    template: "%s | NigeriaTransfer",
  },
  description:
    "Send large files up to 4GB for free. No account required. Resumable uploads for Nigerian internet. Fast, secure, and built for Africa.",
  keywords: [
    "file transfer",
    "Nigeria",
    "send large files",
    "WeTransfer alternative",
    "file sharing",
    "upload files",
    "free file transfer",
  ],
  authors: [{ name: "NigeriaTransfer" }],
  creator: "NigeriaTransfer",
  metadataBase: new URL(process.env.APP_URL || "http://localhost:3000"),
  openGraph: {
    type: "website",
    locale: "en_NG",
    url: "/",
    siteName: "NigeriaTransfer",
    title: "NigeriaTransfer - Send Large Files. No Account. No Wahala.",
    description:
      "Send large files up to 4GB for free. No account required. Resumable uploads built for Nigerian internet.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "NigeriaTransfer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NigeriaTransfer - Send Large Files",
    description: "Send large files up to 4GB for free. No account required.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#008751" },
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
