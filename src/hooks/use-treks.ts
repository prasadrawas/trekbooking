"use client";

import useSWR from "swr";
import { useMemo } from "react";
import { fetcher } from "@/lib/fetcher";
import { mapApiTrek, type MappedTrek } from "@/lib/trek-mapper";

interface TreksResponse {
  treks: unknown[];
  total: number;
}

interface UseTreksResult {
  treks: MappedTrek[];
  total: number;
  isLoading: boolean;
  error: Error | undefined;
}

/** Fetch published trek listing with filters. Caches across navigations. */
export function useTreks(searchParams: URLSearchParams): UseTreksResult {
  const apiUrl = useMemo(() => {
    const params = new URLSearchParams();

    const q = searchParams.get("q");
    if (q) params.set("q", q);

    searchParams.getAll("region").forEach((r) => params.append("region", r));
    searchParams.getAll("difficulty").forEach((d) => params.append("difficulty", d));
    searchParams.getAll("duration").forEach((d) => params.append("duration", d));

    const childFriendly = searchParams.get("child_friendly") || searchParams.get("childFriendly");
    if (childFriendly) params.set("child_friendly", childFriendly);

    const priceMin = searchParams.get("price_min");
    const priceMax = searchParams.get("price_max");
    if (priceMin) params.set("price_min", priceMin);
    if (priceMax) params.set("price_max", priceMax);

    const sort = searchParams.get("sort");
    if (sort) params.set("sort", sort);

    const page = searchParams.get("page");
    if (page) params.set("page", page);

    params.set("limit", "12");
    return `/api/treks?${params.toString()}`;
  }, [searchParams]);

  const { data, error, isLoading } = useSWR<TreksResponse>(apiUrl, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000, // 30s — don't re-fetch if same URL hit within 30s
  });

  const treks = useMemo(
    () => (data?.treks ?? []).map(mapApiTrek),
    [data?.treks],
  );

  return {
    treks,
    total: data?.total ?? 0,
    isLoading,
    error,
  };
}

/** Fetch a small set of treks (e.g., trending on homepage). */
export function useTrendingTreks(limit = 4): UseTreksResult {
  const { data, error, isLoading } = useSWR<TreksResponse>(
    `/api/treks?limit=${limit}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 },
  );

  const treks = useMemo(
    () => (data?.treks ?? []).map(mapApiTrek),
    [data?.treks],
  );

  return { treks, total: data?.total ?? 0, isLoading, error };
}
