import { type NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { ProfileRepository } from "@/lib/repositories";
import { withErrorHandling, jsonOk, jsonError } from "@/lib/api-utils";

// ─── GET /api/auth/profile — Get current user profile (auth) ─────────────────

export const GET = withErrorHandling(async () => {
  const { supabase, user } = await requireAuth();
  const profileRepo = new ProfileRepository(supabase);

  const profile = await profileRepo.findById(user.id);
  if (!profile) {
    return jsonError("Profile not found", 404);
  }

  return jsonOk({
    user: {
      id: profile.id,
      email: user.email,
      role: profile.role,
      full_name: profile.full_name,
      phone: profile.phone,
      avatar_url: profile.avatar_url,
      city: profile.city,
      youtube_channel_url: profile.youtube_channel_url,
    },
  });
});

// ─── PUT /api/auth/profile — Update profile (auth) ───────────────────────────

export const PUT = withErrorHandling(async (request: NextRequest) => {
  const { supabase, user } = await requireAuth();
  const profileRepo = new ProfileRepository(supabase);

  // Verify profile exists
  const existing = await profileRepo.existsById(user.id);
  if (!existing) {
    return jsonError("Profile not found", 404);
  }

  const body = await request.json();
  const { full_name, phone, city, avatar_url, youtube_channel_url } = body as {
    full_name?: string;
    phone?: string;
    city?: string;
    avatar_url?: string;
    youtube_channel_url?: string;
  };

  const allowedFields = ["full_name", "phone", "city", "avatar_url", "youtube_channel_url"] as const;
  type AllowedField = (typeof allowedFields)[number];
  const input: Partial<Record<AllowedField, unknown>> = {
    full_name,
    phone,
    city,
    avatar_url,
    youtube_channel_url,
  };

  const updates: Partial<Record<AllowedField, unknown>> = {};
  for (const field of allowedFields) {
    if (input[field] !== undefined) {
      updates[field] = input[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    return jsonError("No updatable fields provided", 400);
  }

  const updated = await profileRepo.update(user.id, updates);

  return jsonOk({
    user: {
      id: updated.id,
      email: user.email,
      role: updated.role,
      full_name: updated.full_name,
      phone: updated.phone,
      avatar_url: updated.avatar_url,
      city: updated.city,
      youtube_channel_url: updated.youtube_channel_url,
    },
  });
});
