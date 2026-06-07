"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Ticket,
  Wallet,
  Shield,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Organizers", href: "/admin/organizers", icon: Users },
  { label: "Bookings", href: "/admin/bookings", icon: Ticket },
  { label: "Payouts", href: "/admin/payouts", icon: Wallet },
];

function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col bg-slate-900 text-slate-100">
      {/* Branding */}
      <div className="flex items-center gap-3 border-b border-slate-700/60 px-5 py-5">
        <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/20 ring-1 ring-emerald-500/40">
          <Shield className="size-5 text-emerald-400" />
        </div>
        <div>
          <p className="text-sm font-semibold tracking-tight text-white">TrekBooking</p>
          <p className="text-[11px] text-slate-400 font-medium uppercase tracking-widest">Admin</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-auto rounded-md p-1 text-slate-400 hover:text-white lg:hidden"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 px-3 py-4">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const isActive =
            href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/20"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
              )}
            >
              <Icon
                className={cn(
                  "size-4 shrink-0 transition-colors",
                  isActive ? "text-emerald-400" : "text-slate-500 group-hover:text-slate-300"
                )}
              />
              {label}
              {isActive && (
                <ChevronRight className="ml-auto size-3.5 text-emerald-500/70" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-700/60 p-3">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2.5">
          <div className="flex size-8 items-center justify-center rounded-full bg-slate-700 text-xs font-bold text-slate-300">
            A
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-xs font-medium text-slate-200">Super Admin</p>
            <p className="truncate text-[11px] text-slate-500">trekbooking.in@gmail.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Auth guard — redirect to login if session expired
  useEffect(() => {
    fetch("/api/auth/profile")
      .then((r) => {
        if (r.status === 401) router.replace("/login");
      })
      .catch(() => router.replace("/login"));
  }, [router]);

  const currentPage =
    NAV_ITEMS.find((item) =>
      item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href)
    )?.label ?? "Admin Panel";

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      {/* Desktop Sidebar */}
      <aside className="hidden w-60 shrink-0 lg:block">
        <Sidebar />
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 z-40 bg-black/50 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              key="sidebar"
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 z-50 w-60 lg:hidden"
            >
              <Sidebar onClose={() => setMobileOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="flex h-14 shrink-0 items-center gap-4 border-b border-slate-200 bg-white px-4 sm:px-6">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 lg:hidden"
          >
            <Menu className="size-5" />
          </button>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium uppercase tracking-widest text-slate-400">
              Admin Panel
            </span>
            <ChevronRight className="size-3 text-slate-300" />
            <span className="text-sm font-semibold text-slate-700">{currentPage}</span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-slate-500 hover:text-red-600"
              onClick={() => router.push("/")}
            >
              <LogOut className="size-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
