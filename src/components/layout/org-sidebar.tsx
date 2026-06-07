"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Mountain,
  CalendarCheck,
  Wallet,
  Star,
  Settings,
  BadgeCheck,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/org", icon: LayoutDashboard },
  { label: "My Treks", href: "/org/treks", icon: Mountain },
  { label: "Bookings", href: "/org/bookings", icon: CalendarCheck },
  { label: "Payouts", href: "/org/payouts", icon: Wallet },
  { label: "Reviews", href: "/org/reviews", icon: Star },
  { label: "Settings", href: "/org/settings", icon: Settings },
];

interface OrgSidebarProps {
  organizer?: {
    name: string;
    avatarUrl?: string;
    initials?: string;
    verified?: boolean;
  };
}

export function OrgSidebar({
  organizer = { name: "Organizer", initials: "O", verified: true },
}: OrgSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/org") return pathname === "/org";
    return pathname.startsWith(href);
  };

  return (
    <aside className="flex h-full w-64 flex-col border-r border-slate-100 bg-white">
      {/* Organizer info */}
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-5">
        <div className="relative shrink-0">
          {organizer.avatarUrl ? (
            <img
              src={organizer.avatarUrl}
              alt={organizer.name}
              className="h-10 w-10 rounded-full object-cover ring-2 ring-primary/20"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary ring-2 ring-primary/20">
              {organizer.initials ?? organizer.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">
              {organizer.name}
            </p>
            {organizer.verified && (
              <BadgeCheck
                className="h-4 w-4 shrink-0 text-primary"
                aria-label="Verified organizer"
              />
            )}
          </div>
          <p className="text-xs text-slate-400">
            {organizer.verified ? "Verified Organizer" : "Organizer"}
          </p>
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
                  {/* Active indicator */}
                  {active && (
                    <motion.span
                      layoutId="org-active-pill"
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
                  {/* Hover ring for inactive */}
                  {!active && (
                    <span className="absolute inset-0 rounded-xl opacity-0 ring-1 ring-inset ring-slate-900/5 group-hover:opacity-100 transition-opacity" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* CTA: list a new trek */}
      <div className="border-t border-slate-100 p-4">
        <Link
          href="/org/treks/new"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 active:scale-95 transition-all duration-150"
        >
          <Mountain className="h-4 w-4" />
          List New Trek
        </Link>
      </div>
    </aside>
  );
}
