"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// ---------------------------------------------------------------------------
// Sign In (email + password)
// ---------------------------------------------------------------------------
export async function signIn(
  _prevState: { error: string } | null,
  formData: FormData,
): Promise<{ error: string }> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();
  const { error, data } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  // Check for custom redirect URL (e.g., from booking page)
  const redirectTo = formData.get("redirect") as string | null;
  if (redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//") && !redirectTo.includes("://")) {
    redirect(redirectTo);
  }

  // Default redirect based on role
  const role = data.user?.user_metadata?.role;
  if (role === "admin") {
    redirect("/admin");
  } else if (role === "organizer") {
    redirect("/org");
  } else {
    redirect("/dashboard");
  }
}

// ---------------------------------------------------------------------------
// Sign Up (email + password + metadata)
// ---------------------------------------------------------------------------
export async function signUp(
  _prevState: { error: string } | null,
  formData: FormData,
): Promise<{ error: string }> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const full_name = (formData.get("full_name") as string)?.trim();
  const phone = (formData.get("phone") as string)?.trim() || undefined;
  // CRITICAL: Whitelist roles — never allow "admin" via self-signup
  const rawRole = (formData.get("role") as string) || "trekker";
  const role = rawRole === "organizer" ? "organizer" : "trekker";

  if (!email || !password || !full_name) {
    return { error: "Full name, email, and password are required." };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Invalid email format." };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name,
        phone: phone ? `+91${phone}` : undefined,
        role,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/login?message=check_email");
}

// ---------------------------------------------------------------------------
// Sign Out
// ---------------------------------------------------------------------------
export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

// ---------------------------------------------------------------------------
// Sign In with Google (OAuth)
// ---------------------------------------------------------------------------
export async function signInWithGoogle(): Promise<{ error: string } | void> {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/auth/callback`,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error || !data?.url) {
    return { error: error?.message ?? "Failed to initiate Google sign-in." };
  }

  redirect(data.url);
}

// ---------------------------------------------------------------------------
// Reset Password
// ---------------------------------------------------------------------------
export async function resetPassword(
  _prevState: { error: string } | null,
  formData: FormData,
): Promise<{ error: string }> {
  const email = formData.get("email") as string;

  if (!email) {
    return { error: "Email address is required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/auth/callback?next=/update-password`,
  });

  if (error) {
    return { error: error.message };
  }

  // Return a non-error state so the page can show the success UI.
  // We purposefully do NOT redirect here — the page handles the success state.
  return { error: "" };
}
