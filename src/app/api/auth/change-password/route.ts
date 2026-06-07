import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { current_password, new_password } = body;

  if (!current_password || !new_password) {
    return NextResponse.json(
      { error: "Current password and new password are required." },
      { status: 400 }
    );
  }

  if (new_password.length < 8) {
    return NextResponse.json(
      { error: "New password must be at least 8 characters." },
      { status: 400 }
    );
  }

  // Verify current password
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: current_password,
  });

  if (verifyError) {
    return NextResponse.json(
      { error: "Current password is incorrect." },
      { status: 400 }
    );
  }

  // Update password
  const { error: updateError } = await supabase.auth.updateUser({
    password: new_password,
  });

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
