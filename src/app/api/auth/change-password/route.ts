import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { withErrorHandling, jsonOk, jsonError } from "@/lib/api-utils";

export const POST = withErrorHandling(async (request: NextRequest) => {
  const { supabase, user } = await requireAuth();

  if (!user.email) {
    return jsonError("User email not available", 400);
  }

  const body = await request.json();
  const { current_password, new_password } = body;

  if (!current_password || !new_password) {
    return jsonError("Current password and new password are required.", 400);
  }

  if (new_password.length < 8) {
    return jsonError("New password must be at least 8 characters.", 400);
  }

  // Verify current password
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: current_password,
  });

  if (verifyError) {
    return jsonError("Current password is incorrect.", 400);
  }

  // Update password
  const { error: updateError } = await supabase.auth.updateUser({
    password: new_password,
  });

  if (updateError) {
    return jsonError(updateError.message, 500);
  }

  return jsonOk({ success: true });
});
