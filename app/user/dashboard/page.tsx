"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useUserData } from "@/lib/hooks/use-user-data";
import SuspendedBanner from "@/components/ui/suspended-banner";

// Cache for dashboard stats
let statsCache: {
  data: { pending: number; past: number; upcoming: number; requests: any[] };
  timestamp: number;
} | null = null;

const STATS_CACHE_DURATION = 1 * 60 * 1000; // 1 minute

export default function UserDashboard() {
  const supabase = createClient();
  const { user, loading: userLoading } = useUserData();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pending: 0,
    past: 0,
    upcoming: 0,
  });
  const [upcomingRequests, setUpcomingRequests] = useState<any[]>([]);

  useEffect(() => {
    if (userLoading || !user) return;

    const fetchStats = async () => {
      // Check cache first
      const now = Date.now();
      if (statsCache && now - statsCache.timestamp < STATS_CACHE_DURATION) {
        setStats({
          pending: statsCache.data.pending,
          past: statsCache.data.past,
          upcoming: statsCache.data.upcoming,
        });
        setUpcomingRequests(statsCache.data.requests);
        setLoading(false);
        return;
      }

      try {
        // Fetch all stats in parallel
        const [pendingResult, pastResult, upcomingResult] = await Promise.all([
          supabase
            .from("requests")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("status", "pending"),
          supabase
            .from("requests")
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("status", "completed"),
          supabase
            .from("requests")
            .select("*")
            .eq("user_id", user.id)
            .in("status", ["accepted", "in-progress"])
            .order("scheduled_at", { ascending: true })
            .limit(3),
        ]);

        // Fetch CSR details for upcoming requests using safe function
        let upcomingRequestsWithCsr = upcomingResult.data || [];
        if (upcomingRequestsWithCsr.length > 0) {
          const csrIds = [
            ...new Set(
              upcomingRequestsWithCsr.map((r) => r.accepted_by).filter(Boolean)
            ),
          ];

          if (csrIds.length > 0) {
            // Fetch CSR info for each unique CSR using the safe function
            const csrMap = new Map();
            for (const csrId of csrIds) {
              const { data: csrResult } = await supabase.rpc("get_csr_info", {
                csr_id: csrId,
              });

              if (csrResult && csrResult.length > 0) {
                csrMap.set(csrId, csrResult[0]);
              }
            }

            // Map CSR data to requests
            upcomingRequestsWithCsr.forEach((request: any) => {
              if (request.accepted_by) {
                request.csr = csrMap.get(request.accepted_by);
              }
            });
          }
        }

        const statsData = {
          pending: pendingResult.count || 0,
          past: pastResult.count || 0,
          upcoming: upcomingRequestsWithCsr.length,
          requests: upcomingRequestsWithCsr,
        };

        // Update cache
        statsCache = {
          data: statsData,
          timestamp: now,
        };

        setStats({
          pending: statsData.pending,
          past: statsData.past,
          upcoming: statsData.upcoming,
        });
        setUpcomingRequests(statsData.requests);
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [supabase, user, userLoading]);

  const userName = useMemo(() => {
    // Prioritize name field, then construct from first_name + last_name, then first_name alone
    if (user?.name) return user.name;
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`.trim();
    }
    if (user?.first_name) return user.first_name;
    return "Friend";
  }, [user]);

  if (userLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-600 border-t-transparent"></div>
          <p className="text-sm text-black">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {user?.is_suspended && <SuspendedBanner />}
      <div
        className={`mx-auto max-w-7xl p-6 ${user?.is_suspended ? "mt-14" : ""}`}
      >
        {/* Welcome Card and Stats */}
        <div className="mb-8 grid gap-6 md:grid-cols-3">
          {/* Welcome Card */}
          <div className="rounded-lg bg-orange-500 p-6 text-white md:col-span-2">
            <h2 className="mb-2 text-2xl font-bold">
              Hi, {userName}! Need help today?
            </h2>
            <p className="mb-4 text-orange-50">
              Let us know what you need. Our team and volunteers are here to
              help you every step of the way.
            </p>
            <Link
              href="/user/requests/new"
              className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-medium text-orange-600 transition-colors hover:bg-orange-50"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Submit New Request
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="space-y-4">
            <div className="rounded-lg bg-white p-4 shadow">
              <div className="text-sm text-black">Pending Requests</div>
              <div className="mt-1 text-2xl font-bold text-zinc-900">
                {stats.pending}
              </div>
              <Link
                href="/user/requests?status=pending"
                className="mt-2 text-sm text-orange-600 hover:underline"
              >
                View More &gt;
              </Link>
            </div>

            <div className="rounded-lg bg-white p-4 shadow">
              <div className="text-sm text-black">Past Requests</div>
              <div className="mt-1 text-2xl font-bold text-zinc-900">
                {stats.past}
              </div>
              <Link
                href="/user/requests?status=past"
                className="mt-2 text-sm text-orange-600 hover:underline"
              >
                View More &gt;
              </Link>
            </div>
          </div>
        </div>

        {/* Upcoming Section */}
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-zinc-900">Upcoming</h3>
          <Link
            href="/user/requests?status=upcoming"
            className="text-sm text-orange-600 hover:underline"
          >
            View More &gt;
          </Link>
        </div>

        {upcomingRequests.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-3">
            {upcomingRequests.map((request) => (
              <Link
                key={request.id}
                href={`/user/requests/${request.id}`}
                className="block"
              >
                <div className="cursor-pointer rounded-lg bg-white p-6 shadow transition hover:-translate-y-0.5 hover:shadow-lg">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <svg
                        className="h-5 w-5 text-orange-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                        />
                      </svg>
                      <span className="font-semibold text-zinc-900">
                        {request.category || "Household Support"}
                      </span>
                    </div>
                    <span className="text-xs text-black">
                      Request ID: #{request.id.slice(0, 8)}
                    </span>
                  </div>

                  {/* CSR and Volunteer Info */}
                  {request.accepted_by && (
                    <div className="mb-4 space-y-2">
                      {/* CSR Representative */}
                      <div className="rounded-lg bg-zinc-100 p-2">
                        <div className="text-xs text-zinc-600">
                          CSR Representative
                        </div>
                        <div className="text-sm font-medium text-zinc-900">
                          {request.csr?.name || "CSR Representative"}
                        </div>
                      </div>

                      {/* Volunteer */}
                      {request.volunteer_name && (
                        <div className="flex items-center gap-3 bg-orange-50 rounded-xl p-3">
                          {request.volunteer_image_url ? (
                            <img
                              src={request.volunteer_image_url}
                              alt={request.volunteer_name}
                              className="h-12 w-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-full bg-zinc-200"></div>
                          )}
                          <div>
                            <div className="text-xs text-zinc-600">
                              Volunteer
                            </div>
                            <div className="font-medium text-zinc-900">
                              {request.volunteer_name}
                            </div>
                            <div className="text-xs text-black">
                              {request.volunteer_mobile
                                ? `+65 ${request.volunteer_mobile}`
                                : "Mobile"}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Time and Date */}
                  {request.scheduled_at && (
                    <div className="mb-2 text-sm text-black">
                      {new Date(request.scheduled_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      {new Date(request.scheduled_at).toLocaleDateString()}
                    </div>
                  )}

                  {/* Status */}
                  <div className="mb-2">
                    <span
                      className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${
                        request.status === "accepted" ||
                        request.status === "in-progress"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {request.status === "accepted"
                        ? "Confirmed"
                        : request.status === "in-progress"
                        ? "In Progress"
                        : request.status}
                    </span>
                  </div>

                  {/* Note */}
                  {request.description && (
                    <div className="mt-4">
                      <div className="text-xs font-medium text-black">
                        Your Note
                      </div>
                      <p className="mt-1 text-sm text-black line-clamp-2">
                        {request.description}
                      </p>
                    </div>
                  )}

                  {/* Created Date */}
                  {request.created_at && (
                    <div className="mt-4 text-xs text-black">
                      Created on{" "}
                      {new Date(request.created_at).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-lg bg-white p-8 text-center shadow">
            <p className="text-black">No upcoming requests</p>
            <Link
              href="/user/requests/new"
              className="mt-4 inline-block text-orange-600 hover:underline"
            >
              Submit your request
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
