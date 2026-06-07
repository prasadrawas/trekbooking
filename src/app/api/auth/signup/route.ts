import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_ROLES = ["trekker", "organizer"];

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, password, full_name, phone, role: rawRole } = body;

  // ── Validation ──────────────────────────────────────────────────────────

  if (!full_name || typeof full_name !== "string" || full_name.trim().length < 2) {
    return NextResponse.json({ error: "Full name is required (min 2 characters)." }, { status: 400 });
  }
  if (full_name.trim().length > 100) {
    return NextResponse.json({ error: "Full name is too long (max 100 characters)." }, { status: 400 });
  }

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Invalid email format." }, { status: 400 });
  }

  if (!password || typeof password !== "string") {
    return NextResponse.json({ error: "Password is required." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }
  if (password.length > 128) {
    return NextResponse.json({ error: "Password is too long." }, { status: 400 });
  }

  // Phone validation (optional but if provided must be valid)
  if (phone && typeof phone === "string" && phone.trim().length > 0) {
    const cleaned = phone.replace(/^\+91/, "").trim();
    if (!/^[6-9]\d{9}$/.test(cleaned)) {
      return NextResponse.json({ error: "Invalid phone number. Must be a 10-digit Indian mobile number." }, { status: 400 });
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
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    message: "Account created successfully.",
    role,
  });
}
