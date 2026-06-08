"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Mountain, Bell, ChevronRight, LogOut } from "lucide-react";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { cn } from "@/lib/utils";
interface UserInfo {
  name: string;
  email: string;
  initials: string;
  avatarUrl: string;
}

function getBreadcrumbs(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const crumbs: { label: string; href: string }[] = [];
  let href = "";
  for (const seg of segments) {
    href += `/${seg}`;
    let label = seg.charAt(0).toUpperCase() + seg.slice(1);
    if (seg === "dashboard") label = "Dashboard";
    else if (seg === "bookings") label = "My Bookings";
    else if (seg === "reviews") label = "My Reviews";
    else if (seg === "videos") label = "My Videos";
    else if (seg === "settings") label = "Settings";
    else if (seg === "confirmation") label = "Confirmation";
    else if (seg.length === 36 || /^[a-z0-9-]{8,}$/.test(seg)) label = "Booking Details";
    crumbs.push({ label, href });
  }
  return crumbs;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [user, setUser] = useState<UserInfo>({ name: "", email: "", initials: "", avatarUrl: "" });
  const pathname = usePathname();
  const router = useRouter();
  const breadcrumbs = getBreadcrumbs(pathname);

  useEffect(() => {
    fetch("/api/auth/profile")
      .then((r) => {
        if (r.status === 401) {
          router.replace("/login");
          return null;
        }
        return r.ok ? r.json() : null;
      })
      .then((data) => {
        if (data?.user) {
          const name = data.user.full_name ?? "";
          setUser({
            name,
            email: data.user.email ?? "",
            initials: name
              ? name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2)
              : "?",
            avatarUrl: data.user.avatar_url ?? "",
          });
        }
      })
      .catch(() => {
        router.replace("/login");
      });
  }, [router]);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-[280px] lg:flex-shrink-0 lg:flex-col">
        <div className="flex flex-col h-full border-r border-slate-100 bg-white">
          {/* Logo */}
          <div className="flex items-center gap-2.5 px-5 h-14 border-b border-slate-100">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-600">
              <Mountain className="w-4.5 h-4.5 text-white" strokeWidth={2} />
            </div>
            <span className="text-base font-bold text-slate-900 tracking-tight">
              TrekBooking
            </span>
          </div>
          <DashboardSidebar user={user} />
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 400, damping: 40 }}
              className="fixed left-0 top-0 z-50 h-full w-[280px] bg-white shadow-2xl lg:hidden"
            >
              <div className="flex items-center justify-between px-5 h-14 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-600">
                    <Mountain className="w-4.5 h-4.5 text-white" strokeWidth={2} />
                  </div>
                  <span className="text-base font-bold text-slate-900">TrekBooking</span>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <DashboardSidebar user={user} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-14 flex-shrink-0 items-center gap-4 border-b border-slate-100 bg-white px-4 sm:px-6">
          {/* Mobile hamburger */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1 text-sm flex-1 min-w-0" aria-label="Breadcrumb">
            {breadcrumbs.map((crumb, i) => (
              <span key={crumb.href} className="flex items-center gap-1 min-w-0">
                {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />}
                {i === breadcrumbs.length - 1 ? (
                  <span className="text-slate-700 font-medium truncate">{crumb.label}</span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="text-slate-400 hover:text-slate-600 transition-colors truncate"
                  >
                    {crumb.label}
                  </Link>
                )}
              </span>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <button className="relative p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
              <Bell className="w-4.5 h-4.5" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" />
            </button>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen((o) => !o)}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-100 transition-colors"
              >
                {user.avatarUrl ? (
                  <Image src={user.avatarUrl} alt={user.name} width={28} height={28} className="rounded-full object-cover" />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700">
                    {user.initials}
                  </div>
                )}
                <span className="hidden sm:block text-sm font-medium text-slate-700">
                  {user.name.split(" ")[0]}
                </span>
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-slate-100 bg-white py-1.5 shadow-lg z-50"
                    onMouseLeave={() => setUserMenuOpen(false)}
                  >
                    <div className="px-3 py-2 border-b border-slate-100">
                      <p className="text-sm font-semibold text-slate-800">{user.name}</p>
                      <p className="text-xs text-slate-400 truncate">{user.email}</p>
                    </div>
                    <Link
                      href="/dashboard/settings"
                      className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Settings
                    </Link>
                    <button
                      onClick={async () => {
                        await fetch("/api/auth/logout", { method: "POST" });
                        router.push("/");
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className={cn("mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8")}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
