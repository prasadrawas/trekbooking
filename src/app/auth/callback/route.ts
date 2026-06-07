import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Validate redirect path — prevent open redirect attacks
function safePath(raw: string | null, fallback: string): string {
  if (!raw) return fallback;
  // Must start with / but not // and must not contain ://
  if (raw.startsWith("/") && !raw.startsWith("//") && !raw.includes("://")) {
    return raw;
  }
  return fallback;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safePath(searchParams.get("next"), "/dashboard");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
