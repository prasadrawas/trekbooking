"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

/**
 * Generic SWR hook for any API endpoint.
 * Returns cached data instantly on re-render, revalidates in background.
 */
export function useApi<T = unknown>(
  url: string | null,
  options?: {
    revalidateOnFocus?: boolean;
    dedupingInterval?: number;
    refreshInterval?: number;
  },
) {
  return useSWR<T>(url, fetcher, {
    revalidateOnFocus: options?.revalidateOnFocus ?? false,
    dedupingInterval: options?.dedupingInterval ?? 30000,
    refreshInterval: options?.refreshInterval,
  });
}
