"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Mountain, Menu, X, User, LogOut, LayoutDashboard, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const navLinks = [
  { label: "Explore Treks", href: "/treks" },
  { label: "About", href: "/about" },
  { label: "Partner With Us", href: "/partner" },
];

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  // Pages with dark/image hero sections — navbar starts transparent to blend
  const isHeroPage = pathname === "/" || /^\/treks\/[^/]+$/.test(pathname);
  const [scrolled, setScrolled] = useState(!isHeroPage);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isHeroPage) {
      setScrolled(true);
      return;
    }
    const handleScroll = () => setScrolled(window.scrollY > 16);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isHeroPage]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  // Close user menu on outside click
  useEffect(() => {
    if (!userMenuOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-user-menu]")) setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [userMenuOpen]);

  // Check auth state
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (u) {
        setUser({
          id: u.id,
          email: u.email ?? "",
          name: u.user_metadata?.full_name ?? u.email?.split("@")[0] ?? "User",
          role: u.user_metadata?.role ?? "trekker",
        });
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email ?? "",
          name: session.user.user_metadata?.full_name ?? session.user.email?.split("@")[0] ?? "User",
          role: session.user.user_metadata?.role ?? "trekker",
        });
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setUserMenuOpen(false);
    setMobileOpen(false);
    router.push("/");
  }

  function getDashboardLink() {
    if (user?.role === "admin") return "/admin";
    if (user?.role === "organizer") return "/org";
    return "/dashboard";
  }

  function getDashboardLabel() {
    if (user?.role === "admin") return "Admin Panel";
    if (user?.role === "organizer") return "Organizer Dashboard";
    return "My Dashboard";
  }

  const initials = user
    ? user.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "";

  return (
    <>
      <header
        className={[
          "fixed inset-x-0 top-0 z-50 transition-all duration-300",
          scrolled
            ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100"
            : "bg-transparent",
        ].join(" ")}
      >
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group" onClick={() => setMobileOpen(false)}>
            <span className={["flex items-center justify-center rounded-lg p-1 transition-colors duration-300", scrolled ? "text-emerald-600" : "text-white"].join(" ")}>
              <Mountain className="h-7 w-7 stroke-[1.75]" />
            </span>
            <span className={["text-xl font-bold tracking-tight transition-colors duration-300", scrolled ? "text-slate-900" : "text-white"].join(" ")}>
              TrekBooking
            </span>
          </Link>

          {/* Desktop nav links */}
          <ul className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={["px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200", scrolled ? "text-slate-600 hover:text-slate-900 hover:bg-slate-100" : "text-white/90 hover:text-white hover:bg-white/10"].join(" ")}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Desktop auth area */}
          <div className="hidden md:flex items-center gap-2">
            {loading ? (
              <div className="w-20" />
            ) : user ? (
              /* Logged-in user menu */
              <div className="relative" data-user-menu>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className={["flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-medium transition-colors duration-200", scrolled ? "text-slate-700 hover:bg-slate-100" : "text-white/90 hover:bg-white/10"].join(" ")}
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white">
                    {initials}
                  </span>
                  <span className="max-w-[120px] truncate">{user.name}</span>
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden z-50"
                    >
                      <div className="px-4 py-3 border-b border-slate-100">
                        <p className="text-sm font-medium text-slate-800 truncate">{user.name}</p>
                        <p className="text-xs text-slate-400 truncate">{user.email}</p>
                        <span className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                          {user.role}
                        </span>
                      </div>
                      <div className="py-1">
                        <Link
                          href={getDashboardLink()}
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <LayoutDashboard className="h-4 w-4 text-slate-400" />
                          {getDashboardLabel()}
                        </Link>
                        <Link
                          href="/dashboard/settings"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <User className="h-4 w-4 text-slate-400" />
                          Profile Settings
                        </Link>
                        <button
                          type="button"
                          onClick={handleSignOut}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition-colors w-full"
                        >
                          <LogOut className="h-4 w-4" />
                          Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              /* Guest buttons */
              <>
                <Link
                  href="/login"
                  className={["px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200", scrolled ? "text-slate-700 hover:text-slate-900 hover:bg-slate-100" : "text-white/90 hover:text-white hover:bg-white/10"].join(" ")}
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 transition-all duration-150 shadow-sm"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((v) => !v)}
            className={["md:hidden flex items-center justify-center rounded-lg p-2 transition-colors duration-200", scrolled ? "text-slate-700 hover:bg-slate-100" : "text-white hover:bg-white/10"].join(" ")}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </nav>
      </header>

      {/* Mobile menu overlay + slide panel */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
              onClick={() => setMobileOpen(false)}
            />

            <motion.div
              key="panel"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 32 }}
              className="fixed inset-y-0 right-0 z-50 flex w-72 flex-col bg-white shadow-2xl md:hidden"
            >
              <div className="flex h-16 items-center justify-between border-b border-slate-100 px-5">
                <Link href="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-2">
                  <Mountain className="h-6 w-6 text-primary stroke-[1.75]" />
                  <span className="text-lg font-bold text-slate-900">TrekBooking</span>
                </Link>
                <button
                  type="button"
                  aria-label="Close menu"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* User info (if logged in) */}
              {user && (
                <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      {initials}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{user.name}</p>
                      <p className="text-xs text-slate-400 truncate">{user.email}</p>
                    </div>
                  </div>
                </div>
              )}

              <nav className="flex-1 overflow-y-auto px-4 py-6">
                <ul className="flex flex-col gap-1">
                  {navLinks.map((link, i) => (
                    <motion.li
                      key={link.href}
                      initial={{ opacity: 0, x: 24 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * i + 0.1 }}
                    >
                      <Link
                        href={link.href}
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center rounded-xl px-4 py-3 text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                      >
                        {link.label}
                      </Link>
                    </motion.li>
                  ))}
                  {user && (
                    <motion.li
                      initial={{ opacity: 0, x: 24 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.25 }}
                    >
                      <Link
                        href={getDashboardLink()}
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-2 rounded-xl px-4 py-3 text-base font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        {getDashboardLabel()}
                      </Link>
                    </motion.li>
                  )}
                </ul>
              </nav>

              <div className="border-t border-slate-100 p-4 flex flex-col gap-3">
                {user ? (
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="w-full rounded-xl border border-rose-200 px-4 py-2.5 text-center text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    Sign Out
                  </button>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setMobileOpen(false)}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-center text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      Login
                    </Link>
                    <Link
                      href="/signup"
                      onClick={() => setMobileOpen(false)}
                      className="w-full rounded-xl bg-primary px-4 py-2.5 text-center text-sm font-semibold text-primary-foreground hover:bg-primary/90 active:scale-95 transition-all shadow-sm"
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
