import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, password, redirect } = body;

  // Validation
  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }
  if (!password || typeof password !== "string") {
    return NextResponse.json({ error: "Password is required." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email format." }, { status: 400 });
  }

  const supabase = await createClient();
  const { error, data } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  // Determine redirect URL
  const role = data.user?.user_metadata?.role;
  let redirectTo = "/dashboard";
  if (redirect && typeof redirect === "string" && redirect.startsWith("/") && !redirect.startsWith("//") && !redirect.includes("://")) {
    redirectTo = redirect;
  } else if (role === "admin") {
    redirectTo = "/admin";
  } else if (role === "organizer") {
    redirectTo = "/org";
  }

  return NextResponse.json({
    success: true,
    redirectTo,
    user: {
      id: data.user?.id,
      email: data.user?.email,
      role,
      full_name: data.user?.user_metadata?.full_name,
    },
  });
}
