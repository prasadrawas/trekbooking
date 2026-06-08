"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

interface UseTrekDetailResult {
  trek: any | null;
  reviews: any[];
  similarTreks: any[];
  isLoading: boolean;
  error: Error | undefined;
}

/** Fetch trek detail, reviews, and similar treks in parallel. Cached by slug. */
export function useTrekDetail(slug: string | undefined): UseTrekDetailResult {
  const { data: trekData, error: trekError, isLoading: trekLoading } = useSWR(
    slug ? `/api/treks/${slug}` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 30000 },
  );

  const { data: reviewData } = useSWR(
    slug ? `/api/treks/${slug}/reviews` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 },
  );

  const { data: similarData } = useSWR(
    slug ? `/api/treks?limit=3` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 },
  );

  return {
    trek: (trekData as any)?.trek ?? null,
    reviews: (reviewData as any)?.reviews ?? [],
    similarTreks: (similarData as any)?.treks ?? [],
    isLoading: trekLoading,
    error: trekError,
  };
}
