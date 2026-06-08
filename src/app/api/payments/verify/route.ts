import { requireAuth } from "@/lib/auth";
import { withErrorHandling, jsonOk } from "@/lib/api-utils";
import { createPaymentService } from "@/lib/services";

// ─── POST /api/payments/verify ──────────────────────────────────────────────

export const POST = withErrorHandling(async (request) => {
  const { supabase } = await requireAuth();
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    await request.json();

  const service = createPaymentService(supabase);
  const result = await service.verifyPaymentSignature(
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  );
  return jsonOk(result);
});
