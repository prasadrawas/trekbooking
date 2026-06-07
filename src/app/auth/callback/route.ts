import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Validate redirect path — prevent open redirect attacks
function safePath(raw: string | null, fallback: string): string {
  if (!raw) return fallback;
  if (raw.startsWith("/") && !raw.startsWith("//") && !raw.includes("://")) {
    return raw;
  }
  return fallback;
}

const ALLOWED_ROLES = ["trekker", "organizer"];

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safePath(searchParams.get("next"), "/dashboard");
  const rawRole = searchParams.get("role");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // If a role was passed (from signup page), update user metadata and profile
      const role = rawRole && ALLOWED_ROLES.includes(rawRole) ? rawRole : null;

      if (role) {
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const existingRole = user.user_metadata?.role;

          // Only set role if user doesn't already have one (first-time OAuth signup)
          if (!existingRole) {
            // Update auth metadata
            await supabase.auth.updateUser({
              data: { role },
            });

            // Update profiles table directly via admin client
            const admin = createAdminClient();
            await (admin as any)
              .from("profiles")
              .update({ role })
              .eq("id", user.id);
          }
        }
      }

      // Redirect based on role
      const { data: { user: freshUser } } = await supabase.auth.getUser();
      const userRole = freshUser?.user_metadata?.role;

      let redirectTo = next;
      if (redirectTo === "/dashboard") {
        if (userRole === "admin") redirectTo = "/admin";
        else if (userRole === "organizer") redirectTo = "/org";
      }

      return NextResponse.redirect(`${origin}${redirectTo}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
