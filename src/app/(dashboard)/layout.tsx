/**
 * Dashboard layout with sidebar navigation.
 * Wraps all /dashboard/* routes.
 */

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header isAuthenticated={true} />
      <div className="flex flex-1">
        <DashboardSidebar />
        <main id="main-content" className="flex-1 p-6">
          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
}
