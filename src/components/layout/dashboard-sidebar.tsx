"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Ticket,
  Star,
  Video,
  Settings,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "My Bookings", href: "/dashboard/bookings", icon: Ticket },
  { label: "My Reviews", href: "/dashboard/reviews", icon: Star },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

interface DashboardSidebarProps {
  user?: {
    name: string;
    avatarUrl?: string;
    initials?: string;
  };
}

export function DashboardSidebar({
  user = { name: "Trekker", initials: "T" },
}: DashboardSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <aside className="flex h-full w-full flex-col bg-white">
      {/* User info */}
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-5">
        <div className="relative">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="h-10 w-10 rounded-full object-cover ring-2 ring-primary/20"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary ring-2 ring-primary/20">
              {user.initials ?? user.name.charAt(0).toUpperCase()}
            </div>
          )}
          {/* Online indicator */}
          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-400" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900">
            {user.name}
          </p>
          <p className="text-xs text-slate-400">Trekker</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="flex flex-col gap-0.5">
          {navItems.map(({ label, href, icon: Icon }) => {
            const active = isActive(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={[
                    "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                  ].join(" ")}
                >
                  {/* Active indicator bar */}
                  {active && (
                    <motion.span
                      layoutId="dashboard-active-pill"
                      className="absolute inset-0 rounded-xl bg-primary/10"
                      transition={{ type: "spring", stiffness: 400, damping: 35 }}
                    />
                  )}
                  <Icon
                    className={[
                      "relative z-10 h-4.5 w-4.5 shrink-0 transition-colors duration-150",
                      active
                        ? "text-primary"
                        : "text-slate-400 group-hover:text-slate-600",
                    ].join(" ")}
                    strokeWidth={active ? 2.25 : 1.75}
                  />
                  <span className="relative z-10">{label}</span>
                  {/* Hover shimmer for inactive */}
                  {!active && (
                    <span className="absolute inset-0 rounded-xl opacity-0 ring-1 ring-inset ring-slate-900/5 group-hover:opacity-100 transition-opacity" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer hint */}
      <div className="border-t border-slate-100 px-5 py-4">
        <p className="text-xs text-slate-400 leading-relaxed">
          Need help?{" "}
          <Link
            href="/faqs"
            className="text-primary underline-offset-2 hover:underline"
          >
            Visit FAQs
          </Link>
        </p>
      </div>
    </aside>
  );
}
