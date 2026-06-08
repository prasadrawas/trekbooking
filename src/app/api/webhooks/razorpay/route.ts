import { type NextRequest } from "next/server";
import { withErrorHandling, jsonOk, jsonError } from "@/lib/api-utils";
import { createPaymentService } from "@/lib/services";
import { createAdminClient } from "@/lib/supabase/admin";

// ─── POST /api/webhooks/razorpay ────────────────────────────────────────────

export const POST = withErrorHandling(async (request: NextRequest) => {
  // Read raw body — critical for signature verification
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature");

  if (!signature) {
    return jsonError("Missing signature header", 400);
  }

  const adminClient = createAdminClient();
  const service = createPaymentService(adminClient);

  // Verify webhook signature (throws on mismatch)
  service.verifyWebhookSignature(rawBody, signature);

  // Parse event payload
  let event: { event: string; payload: Record<string, unknown> };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return jsonError("Invalid JSON payload", 400);
  }

  // Handle the event (idempotent — safe to retry)
  await service.handleWebhookEvent(event.event, event.payload);

  return jsonOk({ received: true });
});
