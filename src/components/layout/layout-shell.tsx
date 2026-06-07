"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

// Routes that have their own navigation — no navbar/footer
const SHELL_HIDDEN_PREFIXES = ["/admin", "/dashboard", "/login", "/signup", "/forgot-password"];

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // /org/* hides shell, but /organizers/* is public and shows shell
  const isOrgDashboard = pathname === "/org" || (pathname.startsWith("/org/") && !pathname.startsWith("/organizers"));
  const isBookingPage = pathname.includes("/book/");
  const hideShell = isOrgDashboard || isBookingPage || SHELL_HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (hideShell) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      <main className="flex-1 flex flex-col">{children}</main>
      <Footer />
    </>
  );
}
