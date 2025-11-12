"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRequestsCache } from "@/lib/hooks/use-requests-cache";

export default function RequestsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { getCachedRequests, setCachedRequests } = useRequestsCache();

  useEffect(() => {
    const statusParam = searchParams.get("status");
    if (statusParam) {
      setFilter(statusParam);
    }
  }, [searchParams]);

  const fetchRequests = useCallback(
    async (filterType: string) => {
      // Check cache first
      const cached = getCachedRequests(filterType);
      if (cached) {
        setRequests(cached);
        setLoading(false);
        setIsTransitioning(false);
        return;
      }

      setIsTransitioning(true);
      setLoading(true);

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        let query = supabase
          .from("requests")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (filterType === "pending") {
          query = query.eq("status", "pending");
        } else if (filterType === "upcoming") {
          query = query.in("status", ["accepted", "in-progress"]);
        } else if (filterType === "past") {
          query = query.eq("status", "completed");
        }

        const { data, error } = await query;

        if (error) {
          console.error("Error fetching requests:", error);
          setRequests([]);
        } else {
          const requestsData = data || [];
          setRequests(requestsData);
          // Cache the results
          setCachedRequests(filterType, requestsData);
        }
      } catch (error) {
        console.error("Error:", error);
        setRequests([]);
      } finally {
        setLoading(false);
        setIsTransitioning(false);
      }
    },
    [supabase, router, getCachedRequests, setCachedRequests]
  );

  useEffect(() => {
    fetchRequests(filter);
  }, [filter, fetchRequests]);

  const handleFilterChange = (newFilter: string) => {
    // Prevent changing tabs while loading
    if (isTransitioning || loading) {
      return;
    }
    setFilter(newFilter);
  };

  const getTitle = () => {
    if (filter === "pending") return "Pending Requests";
    if (filter === "upcoming") return "Upcoming";
    if (filter === "past") return "Past Requests";
    return "All Requests";
  };

  return (
    <>
        <div className="mx-auto max-w-7xl p-6">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-zinc-900">{getTitle()}</h1>
            <Link
              href="/user/requests/new"
              className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-700"
            >
              Submit New Request
            </Link>
          </div>

          {/* Filter Tabs */}
          <div className="mb-6 flex gap-2 border-b border-zinc-200">
            <button
              onClick={() => handleFilterChange("all")}
              disabled={isTransitioning || loading}
              className={`px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                filter === "all"
                  ? "border-b-2 border-orange-600 text-orange-600"
                  : "text-black hover:text-zinc-900"
              }`}
            >
              All
            </button>
            <button
              onClick={() => handleFilterChange("pending")}
              disabled={isTransitioning || loading}
              className={`px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                filter === "pending"
                  ? "border-b-2 border-orange-600 text-orange-600"
                  : "text-black hover:text-zinc-900"
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => handleFilterChange("upcoming")}
              disabled={isTransitioning || loading}
              className={`px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                filter === "upcoming"
                  ? "border-b-2 border-orange-600 text-orange-600"
                  : "text-black hover:text-zinc-900"
              }`}
            >
              Upcoming
            </button>
            <button
              onClick={() => handleFilterChange("past")}
              disabled={isTransitioning || loading}
              className={`px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                filter === "past"
                  ? "border-b-2 border-orange-600 text-orange-600"
                  : "text-black hover:text-zinc-900"
              }`}
            >
              Past
            </button>
          </div>

          {/* Requests List */}
          {loading && !cache[filter] ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-600 border-t-transparent"></div>
                <p className="text-sm text-black">Loading requests...</p>
              </div>
            </div>
          ) : requests.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {requests.map((request) => (
                <Link
                  key={request.id}
                  href={`/user/requests/${request.id}`}
                  className="block"
                >
                  <div className="rounded-lg bg-white p-6 shadow transition-shadow hover:shadow-md">
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

                    {/* CSR Rep and Volunteer Info */}
                    {request.accepted_by && (
                      <div className="mb-4 space-y-2">
                        <div>
                          <div className="text-xs text-black">CSR Rep</div>
                          <div className="text-sm font-medium text-zinc-900">
                            {request.csr_rep_name || "Name"}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-zinc-200"></div>
                          <div>
                            <div className="text-xs text-black">Volunteer</div>
                            <div className="text-sm font-medium text-zinc-900">
                              {request.volunteer_name || "Name"}
                            </div>
                            <div className="text-xs text-black">
                              {request.volunteer_mobile || "Mobile"}
                            </div>
                          </div>
                        </div>
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
                            : request.status === "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-zinc-100 text-black"
                        }`}
                      >
                        {request.status === "accepted"
                          ? "Confirmed"
                          : request.status === "in-progress"
                          ? "In Progress"
                          : request.status === "pending"
                          ? "Pending"
                          : request.status === "completed"
                          ? "Completed"
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
                        Created on {new Date(request.created_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-lg bg-white p-8 text-center shadow">
              <p className="text-black">No requests found</p>
              <Link
                href="/user/requests/new"
                className="mt-4 inline-block text-orange-600 hover:underline"
              >
                Submit your first request
              </Link>
            </div>
          )}
        </div>
    </>
  );
}
