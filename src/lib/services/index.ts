import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

import { BookingService } from "./booking.service";
import { PaymentService } from "./payment.service";
import { TrekService } from "./trek.service";
import { DashboardService } from "./dashboard.service";

import { BookingRepository } from "@/lib/repositories/booking.repository";
import { TrekRepository } from "@/lib/repositories/trek.repository";
import { TrekEventRepository } from "@/lib/repositories/trek-event.repository";
import { PaymentRepository } from "@/lib/repositories/payment.repository";
import { PickupPointRepository } from "@/lib/repositories/pickup-point.repository";
import { OrganizerRepository } from "@/lib/repositories/organizer.repository";

// ─── Factory functions ────────────────────────────────────────────────────────

export function createBookingService(
  client: SupabaseClient<Database>,
): BookingService {
  return new BookingService(
    new BookingRepository(client),
    new TrekEventRepository(client),
    new PaymentRepository(client),
    new PickupPointRepository(client),
  );
}

export function createPaymentService(
  client: SupabaseClient<Database>,
): PaymentService {
  return new PaymentService(
    new PaymentRepository(client),
    new BookingRepository(client),
    new TrekEventRepository(client),
  );
}

export function createTrekService(
  client: SupabaseClient<Database>,
): TrekService {
  return new TrekService(new TrekRepository(client));
}

export function createDashboardService(
  client: SupabaseClient<Database>,
): DashboardService {
  return new DashboardService(new OrganizerRepository(client));
}

// ─── Re-exports ───────────────────────────────────────────────────────────────

export { BookingService } from "./booking.service";
export { PaymentService } from "./payment.service";
export { TrekService } from "./trek.service";
export { DashboardService } from "./dashboard.service";
