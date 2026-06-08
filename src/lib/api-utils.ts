import { NextRequest, NextResponse } from "next/server";
import { AuthError } from "@/lib/auth";

// ---------------------------------------------------------------------------
// Response helpers
// ---------------------------------------------------------------------------

export function jsonOk(
  data: unknown,
  status = 200,
  headers?: Record<string, string>,
) {
  return NextResponse.json(data, { status, headers });
}

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

// ---------------------------------------------------------------------------
// Error handling wrapper for API route handlers
// ---------------------------------------------------------------------------

type RouteParams = { params: Promise<Record<string, string>> };

type RouteHandler = (
  request: NextRequest,
  context: RouteParams,
) => Promise<NextResponse>;

/**
 * Wraps an API route handler with standard error handling.
 * - AuthError → mapped to its .status
 * - Other errors → 500 with message
 * - Logs to console with method + path
 */
export function withErrorHandling(handler: RouteHandler): RouteHandler {
  return async (request: NextRequest, context: RouteParams) => {
    try {
      return await handler(request, context);
    } catch (err) {
      if (err instanceof AuthError) {
        return jsonError(err.message, err.status);
      }
      const path = new URL(request.url).pathname;
      console.error(`[${request.method} ${path}]`, err);
      return jsonError(
        err instanceof Error ? err.message : "Internal server error",
        500,
      );
    }
  };
}
