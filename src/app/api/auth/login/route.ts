import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withErrorHandling, jsonOk, jsonError } from "@/lib/api-utils";

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json();
  const { email, password, redirect } = body;

  // Validation
  if (!email || typeof email !== "string") {
    return jsonError("Email is required.", 400);
  }
  if (!password || typeof password !== "string") {
    return jsonError("Password is required.", 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonError("Invalid email format.", 400);
  }

  const supabase = await createClient();
  const { error, data } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return jsonError(error.message, 401);
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

  return jsonOk({
    success: true,
    redirectTo,
    user: {
      id: data.user?.id,
      email: data.user?.email,
      role,
      full_name: data.user?.user_metadata?.full_name,
    },
  });
});
