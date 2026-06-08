import Link from "next/link";
import { Mountain, Globe, Share2, Rss } from "lucide-react";

const exploreLinks = [
  { label: "All Treks", href: "/treks" },
  { label: "Weekend Treks", href: "/treks" },
  { label: "Night Treks", href: "/treks" },
];

const companyLinks = [
  { label: "About Us", href: "/about" },
  { label: "Partner With Us", href: "/partner" },
  { label: "Contact", href: "/contact" },
];

const supportLinks = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms", href: "/terms" },
];

const socialLinks: { label: string; href: string; icon: typeof Globe }[] = [
  // Add social links when accounts are created
  // {
  //   label: "Instagram",
  //   href: "https://instagram.com/trekbooking",
  //   icon: Globe,
  // },
];

function FooterLinkGroup({
  heading,
  links,
}: {
  heading: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
        {heading}
      </h3>
      <ul className="flex flex-col gap-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="text-sm text-slate-400 hover:text-white transition-colors duration-200"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main grid */}
        <div className="grid grid-cols-1 gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
          {/* Column 1: Brand */}
          <div className="flex flex-col gap-5 sm:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 group w-fit">
              <span className="text-primary group-hover:text-primary/80 transition-colors">
                <Mountain className="h-7 w-7 stroke-[1.75]" />
              </span>
              <span className="text-xl font-bold text-white group-hover:text-white/90 transition-colors">
                TrekBooking
              </span>
            </Link>

            <p className="text-sm leading-relaxed text-slate-400 max-w-xs">
              Book weekend treks near Pune. Discover the Sahyadri mountains with
              curated experiences led by expert guides.
            </p>

            {/* Social icons */}
            <div className="flex items-center gap-3">
              {socialLinks.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-800 text-slate-400 hover:bg-primary hover:text-white transition-all duration-200"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Column 2: Explore */}
          <FooterLinkGroup heading="Explore" links={exploreLinks} />

          {/* Column 3: Company */}
          <FooterLinkGroup heading="Company" links={companyLinks} />

          {/* Column 4: Support */}
          <FooterLinkGroup heading="Support" links={supportLinks} />
        </div>

        {/* Divider */}
        <div className="h-px bg-slate-800" />

        {/* Bottom bar */}
        <div className="flex flex-col items-center justify-between gap-3 py-6 sm:flex-row">
          <p className="text-xs text-slate-500">
            &copy; 2026 TrekBooking. All rights reserved.
          </p>
          <p className="text-xs text-slate-500">
            Made with{" "}
            <span role="img" aria-label="love" className="text-red-400">
              ❤️
            </span>{" "}
            in Pune
          </p>
        </div>
      </div>
    </footer>
  );
}
