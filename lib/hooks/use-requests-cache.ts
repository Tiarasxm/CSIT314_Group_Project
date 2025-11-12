"use client";

import { useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

// Global cache for requests
const requestsCache: Record<
  string,
  { data: any[]; timestamp: number }
> = {};

const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

export function useRequestsCache() {
  const supabase = createClient();

  const getCachedRequests = useCallback((filter: string) => {
    const cached = requestsCache[filter];
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }, []);

  const setCachedRequests = useCallback(
    (filter: string, data: any[]) => {
      requestsCache[filter] = {
        data,
        timestamp: Date.now(),
      };
    },
    []
  );

  const invalidateCache = useCallback((filter?: string) => {
    if (filter) {
      delete requestsCache[filter];
    } else {
      Object.keys(requestsCache).forEach((key) => {
        delete requestsCache[key];
      });
    }
  }, []);

  return {
    getCachedRequests,
    setCachedRequests,
    invalidateCache,
  };
}

