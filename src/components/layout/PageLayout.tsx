"use client";

import { cn } from "@/lib/utils";
import BackgroundWallpaper from "./BackgroundWallpaper";
import Header from "./Header";
import Footer from "./Footer";
import type { Wallpaper } from "@/types";

export interface PageLayoutProps {
  children: React.ReactNode;
  /** Show the wallpaper background */
  showWallpaper?: boolean;
  /** Override wallpaper for custom branding */
  wallpaper?: Wallpaper;
  /** Show header */
  showHeader?: boolean;
  /** Show footer */
  showFooter?: boolean;
  /** Whether user is authenticated (passed to Header) */
  isAuthenticated?: boolean;
  /** User name (passed to Header) */
  userName?: string;
  /** Hide "Powered by NaijaTransfer" branding (Business tier) */
  hideBranding?: boolean;
  /** Additional main content class */
  className?: string;
}

/**
 * PageLayout wraps pages with optional wallpaper background, header, and footer.
 *
 * - Homepage/Download: showWallpaper=true, content floats over background
 * - Dashboard: showWallpaper=false, standard page layout
 * - Auth pages: showWallpaper=false, centered card layout
 */
export default function PageLayout({
  children,
  showWallpaper = false,
  wallpaper,
  showHeader = true,
  showFooter = true,
  isAuthenticated = false,
  userName,
  hideBranding = false,
  className,
}: PageLayoutProps) {
  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Background wallpaper layer */}
      {showWallpaper && <BackgroundWallpaper wallpaper={wallpaper} />}

      {/* Header */}
      {showHeader && (
        <Header />
      )}

      {/* Main content */}
      <main
        id="main-content"
        className={cn(
          "relative z-10 flex-1",
          showWallpaper && "min-h-[calc(100vh-4rem)]",
          className
        )}
      >
        {children}
      </main>

      {/* Footer */}
      {showFooter && <Footer hideBranding={hideBranding} />}
    </div>
  );
}
