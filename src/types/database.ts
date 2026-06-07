// ─── Enum / union types ───────────────────────────────────────────────────────

export type UserRole = "trekker" | "organizer" | "admin";
export type OrganizerStatus = "pending" | "active" | "suspended";
export type DifficultyLevel = "easy" | "moderate" | "difficult" | "very_difficult";
export type EventStatus = "upcoming" | "full" | "completed" | "cancelled";
export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed" | "refunded";
export type PaymentStatus = "created" | "authorized" | "captured" | "failed" | "refunded";
export type PayoutStatus = "pending" | "processing" | "completed" | "failed";
export type ChildPricePolicy = "same_price" | "discounted" | "free_under_age";

// ─── Database schema ──────────────────────────────────────────────────────────

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: UserRole;
          full_name: string;
          phone: string | null;
          avatar_url: string | null;
          city: string | null;
          youtube_channel_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: UserRole;
          full_name: string;
          phone?: string | null;
          avatar_url?: string | null;
          city?: string | null;
          youtube_channel_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          role?: UserRole;
          full_name?: string;
          phone?: string | null;
          avatar_url?: string | null;
          city?: string | null;
          youtube_channel_url?: string | null;
          updated_at?: string;
        };
      };

      organizers: {
        Row: {
          id: string;
          profile_id: string;
          org_name: string;
          slug: string;
          description: string | null;
          logo_url: string | null;
          phone: string;
          email: string;
          is_verified: boolean;
          commission_rate: number;
          avg_rating: number;
          total_reviews: number;
          status: OrganizerStatus;
          agreement_signed_at: string | null;
          free_period_ends_at: string | null;
          bank_account_name: string | null;
          bank_account_number: string | null;
          bank_ifsc: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          org_name: string;
          slug: string;
          description?: string | null;
          logo_url?: string | null;
          phone: string;
          email: string;
          is_verified?: boolean;
          commission_rate?: number;
          avg_rating?: number;
          total_reviews?: number;
          status?: OrganizerStatus;
          agreement_signed_at?: string | null;
          free_period_ends_at?: string | null;
          bank_account_name?: string | null;
          bank_account_number?: string | null;
          bank_ifsc?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          org_name?: string;
          slug?: string;
          description?: string | null;
          logo_url?: string | null;
          phone?: string;
          email?: string;
          is_verified?: boolean;
          commission_rate?: number;
          avg_rating?: number;
          total_reviews?: number;
          status?: OrganizerStatus;
          agreement_signed_at?: string | null;
          free_period_ends_at?: string | null;
          bank_account_name?: string | null;
          bank_account_number?: string | null;
          bank_ifsc?: string | null;
        };
      };

      treks: {
        Row: {
          id: string;
          organizer_id: string;
          title: string;
          slug: string;
          description: string | null;
          short_desc: string | null;
          difficulty: DifficultyLevel;
          duration_days: number;
          distance_km: number | null;
          elevation_m: number | null;
          region: string | null;
          meeting_point: string | null;
          meeting_point_url: string | null;
          inclusions: string[] | null;
          exclusions: string[] | null;
          things_to_carry: string[] | null;
          cancellation_policy: string | null;
          is_child_friendly: boolean;
          min_child_age: number | null;
          child_price_policy: ChildPricePolicy | null;
          is_published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organizer_id: string;
          title: string;
          slug: string;
          description?: string | null;
          short_desc?: string | null;
          difficulty?: DifficultyLevel;
          duration_days?: number;
          distance_km?: number | null;
          elevation_m?: number | null;
          region?: string | null;
          meeting_point?: string | null;
          meeting_point_url?: string | null;
          inclusions?: string[] | null;
          exclusions?: string[] | null;
          things_to_carry?: string[] | null;
          cancellation_policy?: string | null;
          is_child_friendly?: boolean;
          min_child_age?: number | null;
          child_price_policy?: ChildPricePolicy | null;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organizer_id?: string;
          title?: string;
          slug?: string;
          description?: string | null;
          short_desc?: string | null;
          difficulty?: DifficultyLevel;
          duration_days?: number;
          distance_km?: number | null;
          elevation_m?: number | null;
          region?: string | null;
          meeting_point?: string | null;
          meeting_point_url?: string | null;
          inclusions?: string[] | null;
          exclusions?: string[] | null;
          things_to_carry?: string[] | null;
          cancellation_policy?: string | null;
          is_child_friendly?: boolean;
          min_child_age?: number | null;
          child_price_policy?: ChildPricePolicy | null;
          is_published?: boolean;
          updated_at?: string;
        };
      };

      trek_images: {
        Row: {
          id: string;
          trek_id: string;
          image_url: string;
          alt_text: string | null;
          sort_order: number;
          is_cover: boolean;
        };
        Insert: {
          id?: string;
          trek_id: string;
          image_url: string;
          alt_text?: string | null;
          sort_order?: number;
          is_cover?: boolean;
        };
        Update: {
          id?: string;
          trek_id?: string;
          image_url?: string;
          alt_text?: string | null;
          sort_order?: number;
          is_cover?: boolean;
        };
      };

      trek_events: {
        Row: {
          id: string;
          trek_id: string;
          event_date: string;
          end_date: string | null;
          reporting_time: string;
          price: number;
          child_price: number | null;
          total_seats: number;
          booked_seats: number;
          status: EventStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          trek_id: string;
          event_date: string;
          end_date?: string | null;
          reporting_time: string;
          price: number;
          child_price?: number | null;
          total_seats: number;
          booked_seats?: number;
          status?: EventStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          trek_id?: string;
          event_date?: string;
          end_date?: string | null;
          reporting_time?: string;
          price?: number;
          child_price?: number | null;
          total_seats?: number;
          booked_seats?: number;
          status?: EventStatus;
        };
      };

      pickup_points: {
        Row: {
          id: string;
          trek_event_id: string;
          label: string;
          address: string | null;
          maps_url: string | null;
          latitude: number | null;
          longitude: number | null;
          pickup_time: string;
          sort_order: number;
          extra_charge: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          trek_event_id: string;
          label: string;
          address?: string | null;
          maps_url?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          pickup_time: string;
          sort_order?: number;
          extra_charge?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          trek_event_id?: string;
          label?: string;
          address?: string | null;
          maps_url?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          pickup_time?: string;
          sort_order?: number;
          extra_charge?: number;
        };
      };

      bookings: {
        Row: {
          id: string;
          booking_number: string;
          trek_event_id: string;
          trekker_id: string;
          num_adults: number;
          num_children: number;
          total_amount: number;
          platform_fee: number;
          organizer_amount: number;
          status: BookingStatus;
          booking_name: string;
          booking_phone: string;
          booking_email: string;
          emergency_contact: string | null;
          special_requests: string | null;
          selected_pickup_id: string | null;
          created_at: string;
          cancelled_at: string | null;
          cancellation_reason: string | null;
        };
        Insert: {
          id?: string;
          booking_number: string;
          trek_event_id: string;
          trekker_id: string;
          num_adults?: number;
          num_children?: number;
          total_amount: number;
          platform_fee: number;
          organizer_amount: number;
          status?: BookingStatus;
          booking_name: string;
          booking_phone: string;
          booking_email: string;
          emergency_contact?: string | null;
          special_requests?: string | null;
          selected_pickup_id?: string | null;
          created_at?: string;
          cancelled_at?: string | null;
          cancellation_reason?: string | null;
        };
        Update: {
          id?: string;
          booking_number?: string;
          trek_event_id?: string;
          trekker_id?: string;
          num_adults?: number;
          num_children?: number;
          total_amount?: number;
          platform_fee?: number;
          organizer_amount?: number;
          status?: BookingStatus;
          booking_name?: string;
          booking_phone?: string;
          booking_email?: string;
          emergency_contact?: string | null;
          special_requests?: string | null;
          selected_pickup_id?: string | null;
          cancelled_at?: string | null;
          cancellation_reason?: string | null;
        };
      };

      payments: {
        Row: {
          id: string;
          booking_id: string;
          razorpay_order_id: string | null;
          razorpay_payment_id: string | null;
          razorpay_signature: string | null;
          amount: number;
          currency: string;
          status: PaymentStatus;
          method: string | null;
          paid_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          razorpay_order_id?: string | null;
          razorpay_payment_id?: string | null;
          razorpay_signature?: string | null;
          amount: number;
          currency?: string;
          status?: PaymentStatus;
          method?: string | null;
          paid_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string;
          razorpay_order_id?: string | null;
          razorpay_payment_id?: string | null;
          razorpay_signature?: string | null;
          amount?: number;
          currency?: string;
          status?: PaymentStatus;
          method?: string | null;
          paid_at?: string | null;
        };
      };

      payouts: {
        Row: {
          id: string;
          organizer_id: string;
          trek_event_id: string;
          total_collected: number;
          commission: number;
          payout_amount: number;
          status: PayoutStatus;
          paid_at: string | null;
          reference_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organizer_id: string;
          trek_event_id: string;
          total_collected: number;
          commission: number;
          payout_amount: number;
          status?: PayoutStatus;
          paid_at?: string | null;
          reference_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          organizer_id?: string;
          trek_event_id?: string;
          total_collected?: number;
          commission?: number;
          payout_amount?: number;
          status?: PayoutStatus;
          paid_at?: string | null;
          reference_id?: string | null;
        };
      };

      reviews: {
        Row: {
          id: string;
          booking_id: string;
          trek_id: string;
          trekker_id: string;
          rating: number;
          comment: string | null;
          is_published: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          trek_id: string;
          trekker_id: string;
          rating: number;
          comment?: string | null;
          is_published?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string;
          trek_id?: string;
          trekker_id?: string;
          rating?: number;
          comment?: string | null;
          is_published?: boolean;
        };
      };

      trekker_videos: {
        Row: {
          id: string;
          trekker_id: string;
          trek_id: string | null;
          youtube_url: string;
          title: string | null;
          sort_order: number;
          is_published: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          trekker_id: string;
          trek_id?: string | null;
          youtube_url: string;
          title?: string | null;
          sort_order?: number;
          is_published?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          trekker_id?: string;
          trek_id?: string | null;
          youtube_url?: string;
          title?: string | null;
          sort_order?: number;
          is_published?: boolean;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      organizer_status: OrganizerStatus;
      difficulty_level: DifficultyLevel;
      event_status: EventStatus;
      booking_status: BookingStatus;
      payment_status: PaymentStatus;
      payout_status: PayoutStatus;
      child_price_policy: ChildPricePolicy;
    };
  };
}

// ─── Convenience row aliases ──────────────────────────────────────────────────

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Organizer = Database["public"]["Tables"]["organizers"]["Row"];
export type Trek = Database["public"]["Tables"]["treks"]["Row"];
export type TrekImage = Database["public"]["Tables"]["trek_images"]["Row"];
export type TrekEvent = Database["public"]["Tables"]["trek_events"]["Row"];
export type PickupPoint = Database["public"]["Tables"]["pickup_points"]["Row"];
export type Booking = Database["public"]["Tables"]["bookings"]["Row"];
export type Payment = Database["public"]["Tables"]["payments"]["Row"];
export type Payout = Database["public"]["Tables"]["payouts"]["Row"];
export type Review = Database["public"]["Tables"]["reviews"]["Row"];
export type TrekkerVideo = Database["public"]["Tables"]["trekker_videos"]["Row"];

// ─── Insert / Update aliases ──────────────────────────────────────────────────

export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];
export type OrganizerInsert = Database["public"]["Tables"]["organizers"]["Insert"];
export type OrganizerUpdate = Database["public"]["Tables"]["organizers"]["Update"];
export type TrekInsert = Database["public"]["Tables"]["treks"]["Insert"];
export type TrekUpdate = Database["public"]["Tables"]["treks"]["Update"];
export type TrekImageInsert = Database["public"]["Tables"]["trek_images"]["Insert"];
export type TrekImageUpdate = Database["public"]["Tables"]["trek_images"]["Update"];
export type TrekEventInsert = Database["public"]["Tables"]["trek_events"]["Insert"];
export type TrekEventUpdate = Database["public"]["Tables"]["trek_events"]["Update"];
export type PickupPointInsert = Database["public"]["Tables"]["pickup_points"]["Insert"];
export type PickupPointUpdate = Database["public"]["Tables"]["pickup_points"]["Update"];
export type BookingInsert = Database["public"]["Tables"]["bookings"]["Insert"];
export type BookingUpdate = Database["public"]["Tables"]["bookings"]["Update"];
export type PaymentInsert = Database["public"]["Tables"]["payments"]["Insert"];
export type PaymentUpdate = Database["public"]["Tables"]["payments"]["Update"];
export type PayoutInsert = Database["public"]["Tables"]["payouts"]["Insert"];
export type PayoutUpdate = Database["public"]["Tables"]["payouts"]["Update"];
export type ReviewInsert = Database["public"]["Tables"]["reviews"]["Insert"];
export type ReviewUpdate = Database["public"]["Tables"]["reviews"]["Update"];
export type TrekkerVideoInsert = Database["public"]["Tables"]["trekker_videos"]["Insert"];
export type TrekkerVideoUpdate = Database["public"]["Tables"]["trekker_videos"]["Update"];

// ─── Composite / joined types ─────────────────────────────────────────────────

export type TrekWithImages = Trek & {
  trek_images: TrekImage[];
};

export type TrekEventWithPickups = TrekEvent & {
  pickup_points: PickupPoint[];
};

export type TrekDetail = Trek & {
  trek_images: TrekImage[];
  organizer: Organizer;
  trek_events: TrekEventWithPickups[];
};

export type BookingDetail = Booking & {
  payment: Payment | null;
  trek_event: TrekEvent & {
    trek: Trek & {
      trek_images: TrekImage[];
      organizer: Pick<Organizer, "id" | "org_name" | "logo_url" | "phone">;
    };
    pickup_points: PickupPoint[];
  };
};
