import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { withErrorHandling, jsonOk, jsonError } from "@/lib/api-utils";

const ALLOWED_ROLES = ["trekker", "organizer"];

export const POST = withErrorHandling(async (request: NextRequest) => {
  const body = await request.json();
  const { email, password, full_name, phone, role: rawRole } = body;

  // ── Validation ──────────────────────────────────────────────────────────
  if (!full_name || typeof full_name !== "string" || full_name.trim().length < 2) {
    return jsonError("Full name is required (min 2 characters).", 400);
  }
  if (full_name.trim().length > 100) {
    return jsonError("Full name is too long (max 100 characters).", 400);
  }
  if (!email || typeof email !== "string") {
    return jsonError("Email is required.", 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonError("Invalid email format.", 400);
  }
  if (!password || typeof password !== "string") {
    return jsonError("Password is required.", 400);
  }
  if (password.length < 8) {
    return jsonError("Password must be at least 8 characters.", 400);
  }
  if (password.length > 128) {
    return jsonError("Password is too long.", 400);
  }

  // Phone validation (optional but if provided must be valid)
  if (phone && typeof phone === "string" && phone.trim().length > 0) {
    const cleaned = phone.replace(/^\+91/, "").trim();
    if (!/^[6-9]\d{9}$/.test(cleaned)) {
      return jsonError("Invalid phone number. Must be a 10-digit Indian mobile number.", 400);
    }
  }

  // ── CRITICAL: Role whitelist — never allow "admin" via self-signup ──────
  const role = ALLOWED_ROLES.includes(rawRole) ? rawRole : "trekker";

  // ── Create user ─────────────────────────────────────────────────────────
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: full_name.trim(),
        phone: phone ? `+91${phone.replace(/^\+91/, "").trim()}` : undefined,
        role,
      },
    },
  });

  if (error) {
    return jsonError(error.message, 400);
  }

  return jsonOk({
    success: true,
    message: "Account created successfully.",
    role,
  });
});
