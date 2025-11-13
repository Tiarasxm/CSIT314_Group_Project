"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

// Global cache for user data
let userCache: {
  data: any | null;
  timestamp: number;
} = {
  data: null,
  timestamp: 0,
};

// Global listeners for cache updates
let cacheUpdateListeners: Set<() => void> = new Set();

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Export function to invalidate user cache globally
export function invalidateUserCache() {
  userCache = {
    data: null,
    timestamp: 0,
  };
  // Notify all listeners to refetch
  cacheUpdateListeners.forEach((listener) => listener());
}

export function useUserData() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async (forceRefresh = false) => {
    // Check cache first
    const now = Date.now();
    if (
      !forceRefresh &&
      userCache.data &&
      now - userCache.timestamp < CACHE_DURATION
    ) {
      setUser(userCache.data);
      setLoading(false);
      return userCache.data;
    }

    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        router.replace("/login");
        return null;
      }

      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .maybeSingle();

      let finalUserData = userData;

      // If user doesn't exist in public.users, create them
      if (!userData && !userError) {
        const userName =
          authUser.user_metadata?.name ||
          authUser.user_metadata?.full_name ||
          `${authUser.user_metadata?.first_name || ""} ${
            authUser.user_metadata?.last_name || ""
          }`.trim() ||
          authUser.email?.split("@")[0] ||
          "User";

        const { data: newUser, error: insertError } = await supabase
          .from("users")
          .insert({
            id: authUser.id,
            email: authUser.email || "",
            name: userName,
            first_name: authUser.user_metadata?.first_name || null,
            last_name: authUser.user_metadata?.last_name || null,
            role: "user",
          })
          .select()
          .single();

        if (!insertError && newUser) {
          finalUserData = newUser;
        } else {
          // Retry fetch
          await new Promise((resolve) => setTimeout(resolve, 500));
          const { data: retryData } = await supabase
            .from("users")
            .select("*")
            .eq("id", authUser.id)
            .maybeSingle();
          finalUserData = retryData;
        }
      }

      if (!finalUserData) {
        router.replace("/login?error=user_not_found");
        return null;
      }

      if (finalUserData.role !== "user") {
        router.replace("/login");
        return null;
      }

      // Update cache
      userCache = {
        data: finalUserData,
        timestamp: now,
      };

      setUser(finalUserData);
      setLoading(false);
      return finalUserData;
    } catch (error) {
      console.error("Error fetching user:", error);
      setLoading(false);
      return null;
    }
  }, [supabase, router]);

  useEffect(() => {
    fetchUser();
    
    // Listen for cache invalidations from other components
    const listener = () => {
      fetchUser(true);
    };
    cacheUpdateListeners.add(listener);
    
    return () => {
      cacheUpdateListeners.delete(listener);
    };
  }, [fetchUser]);

  return { user, loading, refetch: () => fetchUser(true) };
}

