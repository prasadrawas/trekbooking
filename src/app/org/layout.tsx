"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Bell, Menu, X, Mountain, LogOut, Settings } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { OrgSidebar } from "@/components/layout/org-sidebar";
import { cn } from "@/lib/utils";
import { getOrganizer } from "@/actions/organizer";

interface OrgInfo {
  name: string;
  initials: string;
  verified: boolean;
  email: string;
}

export default function OrgLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [orgInfo, setOrgInfo] = useState<OrgInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    async function checkOrganizer() {
      // Skip check if already on onboarding page
      if (pathname === "/org/onboarding") {
        setLoading(false);
        return;
      }

      const org = await getOrganizer();

      if (!org) {
        router.replace("/org/onboarding");
        return;
      }

      setOrgInfo({
        name: org.org_name,
        initials: org.org_name
          .split(" ")
          .map((w: string) => w[0])
          .join("")
          .toUpperCase()
          .slice(0, 2),
        verified: org.is_verified,
        email: org.email ?? "",
      });
      setLoading(false);
    }

    checkOrganizer();
  }, [pathname, router]);

  // Show onboarding page without the dashboard shell
  if (pathname === "/org/onboarding") {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Mountain className="h-8 w-8 text-emerald-600 animate-pulse" />
          <p className="text-sm text-slate-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const displayOrg = orgInfo || { name: "My Org", initials: "MO", verified: false, email: "" };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:shrink-0">
        <OrgSidebar organizer={displayOrg} />
      </div>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              key="mobile-sidebar"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 350, damping: 35 }}
              className="fixed inset-y-0 left-0 z-50 flex lg:hidden"
            >
              <OrgSidebar organizer={displayOrg} />
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="absolute right-0 top-4 translate-x-full rounded-r-lg bg-white p-2 shadow-md"
                aria-label="Close sidebar"
              >
                <X className="h-4 w-4 text-slate-600" />
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-100 bg-white px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-1.5 lg:hidden">
              <Mountain className="h-5 w-5 text-primary" />
              <span className="text-sm font-bold text-slate-800">TrekBooking</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Notifications */}
            <button
              type="button"
              className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
            </button>

            {/* User menu */}
            <div className="relative" data-user-menu>
              <button
                type="button"
                onClick={() => setUserMenuOpen((o) => !o)}
                className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-slate-100 transition-colors"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700 ring-2 ring-emerald-200">
                  {displayOrg.initials}
                </div>
                <span className="hidden sm:block text-sm font-medium text-slate-700">
                  {displayOrg.name.split(" ")[0]}
                </span>
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-slate-100 bg-white py-1.5 shadow-lg z-50"
                    onMouseLeave={() => setUserMenuOpen(false)}
                  >
                    <div className="px-3 py-2.5 border-b border-slate-100">
                      <p className="text-sm font-semibold text-slate-800">{displayOrg.name}</p>
                      <p className="text-xs text-slate-400 truncate">{displayOrg.email}</p>
                    </div>
                    <Link
                      href="/org/settings"
                      className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <Settings className="h-3.5 w-3.5 text-slate-400" />
                      Settings
                    </Link>
                    <button
                      type="button"
                      onClick={async () => {
                        const supabase = createClient();
                        await supabase.auth.signOut();
                        router.push("/");
                      }}
                      className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-rose-500 hover:bg-rose-50 transition-colors"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Sign out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <main
          className={cn(
            "flex-1 overflow-y-auto",
            "scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent"
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
