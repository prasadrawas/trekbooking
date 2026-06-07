import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // ── Auth-required routes ──────────────────────────────────────────────────
  const isProtected =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/org") ||
    pathname.startsWith("/admin");

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // ── Role-based route protection ───────────────────────────────────────────
  if (user) {
    const role = user.user_metadata?.role as string | undefined;

    // /org routes — only organizers and admins (but NOT /organizers/* which is public)
    if (pathname.startsWith("/org") && !pathname.startsWith("/organizers") && role !== "organizer" && role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }

    // /admin routes — only admins
    if (pathname.startsWith("/admin") && role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }

    // /dashboard routes — trekkers, organizers, admins all OK (trekker home)

    // ── Redirect logged-in users away from auth pages ───────────────────────
    if (pathname === "/login" || pathname === "/signup") {
      const url = request.nextUrl.clone();
      if (role === "admin") {
        url.pathname = "/admin";
      } else if (role === "organizer") {
        url.pathname = "/org";
      } else {
        url.pathname = "/dashboard";
      }
      return NextResponse.redirect(url);
    }
  }

  // ── API route role protection ─────────────────────────────────────────────
  if (pathname.startsWith("/api/") && !pathname.startsWith("/api/webhooks")) {
    // Public API endpoints — no auth needed
    const isPublicApi =
      (pathname === "/api/treks" && request.method === "GET") ||
      (pathname.startsWith("/api/treks/") && request.method === "GET") ||
      (pathname === "/api/organizers" && request.method === "GET") ||
      (pathname.startsWith("/api/organizers/") &&
        !pathname.includes("/me") &&
        request.method === "GET");

    if (!isPublicApi && !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user) {
      const role = user.user_metadata?.role as string | undefined;

      // POST /api/treks, POST /api/treks/:slug/events — organizer only
      if (
        pathname === "/api/treks" &&
        request.method === "POST" &&
        role !== "organizer" &&
        role !== "admin"
      ) {
        return NextResponse.json(
          { error: "Only organizers can create treks" },
          { status: 403 }
        );
      }

      // /api/organizers/me — organizer only
      if (
        pathname === "/api/organizers/me" &&
        role !== "organizer" &&
        role !== "admin"
      ) {
        return NextResponse.json(
          { error: "Organizer access required" },
          { status: 403 }
        );
      }

      // POST /api/organizers — organizer role only
      if (
        pathname === "/api/organizers" &&
        request.method === "POST" &&
        role !== "organizer" &&
        role !== "admin"
      ) {
        return NextResponse.json(
          { error: "Organizer role required" },
          { status: 403 }
        );
      }

      // /api/payouts — organizer or admin only
      if (
        pathname === "/api/payouts" &&
        role !== "organizer" &&
        role !== "admin"
      ) {
        return NextResponse.json(
          { error: "Organizer or admin access required" },
          { status: 403 }
        );
      }
    }
  }

  return supabaseResponse;
}
