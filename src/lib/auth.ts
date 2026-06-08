import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { UserRole } from "@/types/database";

// ---------------------------------------------------------------------------
// AuthError — thrown by auth helpers, caught by withErrorHandling in api-utils
// ---------------------------------------------------------------------------

export class AuthError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

// ---------------------------------------------------------------------------
// Return types
// ---------------------------------------------------------------------------

export interface AuthenticatedContext {
  supabase: SupabaseClient<Database>;
  user: {
    id: string;
    email?: string;
    user_metadata?: Record<string, unknown>;
  };
}

export interface OrganizerContext extends AuthenticatedContext {
  organizerId: string;
}

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------

/** Get authenticated user or throw AuthError(401). */
export async function requireAuth(): Promise<AuthenticatedContext> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new AuthError(401, "Not authenticated");
  return { supabase, user };
}

/** Get authenticated user + verify they have an active organizer profile. */
export async function requireOrganizer(): Promise<OrganizerContext> {
  const ctx = await requireAuth();
  const { data, error } = await (ctx.supabase as any)
    .from("organizers")
    .select("id, status")
    .eq("profile_id", ctx.user.id)
    .single();

  if (error || !data) throw new AuthError(404, "Organizer profile not found");
  if ((data as any).status !== "active")
    throw new AuthError(403, "Organizer account is not active");

  return { ...ctx, organizerId: (data as any).id };
}

/** Get the role from user metadata. Defaults to "trekker". */
export function getUserRole(user: AuthenticatedContext["user"]): UserRole {
  return (user.user_metadata?.role as UserRole) ?? "trekker";
}

/** Throw if the user is not an admin. */
export function assertAdmin(user: AuthenticatedContext["user"]): void {
  const role = getUserRole(user);
  if (role !== "admin") throw new AuthError(403, "Admin access required");
}

/** Throw if the user does not have one of the allowed roles. */
export function assertRole(
  user: AuthenticatedContext["user"],
  allowedRoles: UserRole[],
): void {
  const role = getUserRole(user);
  if (!allowedRoles.includes(role))
    throw new AuthError(403, `Role '${role}' is not permitted`);
}
