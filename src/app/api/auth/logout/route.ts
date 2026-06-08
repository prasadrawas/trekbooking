import { createClient } from "@/lib/supabase/server";
import { withErrorHandling, jsonOk, jsonError } from "@/lib/api-utils";

export const POST = withErrorHandling(async () => {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return jsonError(error.message, 500);
  }

  return jsonOk({ success: true });
});
