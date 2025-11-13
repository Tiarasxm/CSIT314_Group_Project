"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRequestsCache } from "@/lib/hooks/use-requests-cache";
import { useUserData } from "@/lib/hooks/use-user-data";
import SuspendedBanner from "@/components/ui/suspended-banner";

const CATEGORIES = [
  "Household Support",
  "Transportation",
  "Medical Assistance",
  "Food & Groceries",
  "Technology Support",
  "Other",
];

export default function RequestsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const { user } = useUserData();
  const [requests, setRequests] = useState<any[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"latest" | "earliest">("latest");
  const { getCachedRequests, setCachedRequests } = useRequestsCache();

  useEffect(() => {
    const statusParam = searchParams.get("status");
    if (statusParam) {
      setFilter(statusParam);
    }
  }, [searchParams]);

  const applyFiltersAndSearch = useCallback(
    (requestsData: any[]) => {
      let filtered = [...requestsData];

      // Apply search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (req) =>
            req.description?.toLowerCase().includes(query) ||
            req.category?.toLowerCase().includes(query) ||
            req.additional_notes?.toLowerCase().includes(query)
        );
      }

      // Apply category filter
      if (selectedCategories.length > 0) {
        filtered = filtered.filter((req) =>
          selectedCategories.includes(req.category || "Other")
        );
      }

      // Apply sort
      filtered.sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return sortBy === "latest" ? dateB - dateA : dateA - dateB;
      });

      setFilteredRequests(filtered);
    },
    [searchQuery, selectedCategories, sortBy]
  );

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

        // Fetch CSR details for all requests that have been accepted
        // Use the safe get_csr_info function to avoid RLS recursion
        if (data && data.length > 0) {
          const csrIds = [
            ...new Set(data.map((r) => r.accepted_by).filter(Boolean)),
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
            data.forEach((request: any) => {
              if (request.accepted_by) {
                request.csr = csrMap.get(request.accepted_by);
              }
            });
          }
        }

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

  useEffect(() => {
    applyFiltersAndSearch(requests);
  }, [
    searchQuery,
    selectedCategories,
    sortBy,
    requests,
    applyFiltersAndSearch,
  ]);

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedCategories([]);
    setSortBy("latest");
  };

  const hasActiveFilters = searchQuery.trim() || selectedCategories.length > 0;

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
      {user?.is_suspended && <SuspendedBanner />}
      <div
        className={`mx-auto max-w-7xl p-6 ${user?.is_suspended ? "mt-14" : ""}`}
      >
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-zinc-900">{getTitle()}</h1>
          <Link
            href="/user/requests/new"
            className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-700"
          >
            Submit New Request
          </Link>
        </div>

        {/* Search Bar and Filter */}
        <div className="mb-6 flex gap-3">
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <svg
                className="h-5 w-5 text-zinc-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-zinc-300 bg-white py-2 pl-10 pr-4 text-black placeholder-zinc-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
          <button
            onClick={() => setShowFilterModal(true)}
            className="flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-zinc-50"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            Filter
            {hasActiveFilters && (
              <span className="ml-1 rounded-full bg-orange-600 px-2 py-0.5 text-xs text-white">
                {selectedCategories.length + (searchQuery.trim() ? 1 : 0)}
              </span>
            )}
          </button>
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

        {/* Filter Modal */}
        {showFilterModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
            onClick={() => setShowFilterModal(false)}
          >
            <div
              className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-zinc-900">
                  Filter Card
                </h2>
                <button
                  onClick={() => setShowFilterModal(false)}
                  className="text-zinc-400 hover:text-zinc-600"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Filter by Category */}
              <div className="mb-6">
                <div className="mb-3 text-sm font-medium text-black">
                  Filter by
                </div>
                <div className="space-y-2">
                  {CATEGORIES.map((category) => (
                    <label
                      key={category}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category)}
                        onChange={() => handleCategoryToggle(category)}
                        className="h-4 w-4 rounded border-zinc-300 text-orange-600 focus:ring-orange-500"
                      />
                      <span className="text-sm text-black">{category}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Sort by */}
              <div className="mb-6">
                <div className="mb-3 text-sm font-medium text-black">
                  Sort by
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="sort"
                      value="latest"
                      checked={sortBy === "latest"}
                      onChange={() => setSortBy("latest")}
                      className="h-4 w-4 border-zinc-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-sm text-black">Latest</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="sort"
                      value="earliest"
                      checked={sortBy === "earliest"}
                      onChange={() => setSortBy("earliest")}
                      className="h-4 w-4 border-zinc-300 text-orange-600 focus:ring-orange-500"
                    />
                    <span className="text-sm text-black">Earliest</span>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={handleClearFilters}
                  className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-zinc-50"
                >
                  Clear
                </button>
                <button
                  onClick={() => setShowFilterModal(false)}
                  className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-700"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Requests List */}
        {loading && !getCachedRequests(filter) ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-600 border-t-transparent"></div>
              <p className="text-sm text-black">Loading requests...</p>
            </div>
          </div>
        ) : filteredRequests.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredRequests.map((request) => (
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
                        <div className="flex items-center gap-3 bg-orange-50 rounded-xl p-2">
                          {request.volunteer_image_url ? (
                            <img
                              src={request.volunteer_image_url}
                              alt={request.volunteer_name}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-zinc-200"></div>
                          )}
                          <div>
                            <div className="text-xs text-zinc-600">
                              Volunteer
                            </div>
                            <div className="text-sm font-medium text-zinc-900">
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
            <p className="text-black">
              {requests.length === 0
                ? "No requests found"
                : "No requests match your search or filters"}
            </p>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="mt-2 text-sm text-orange-600 hover:underline"
              >
                Clear filters
              </button>
            )}
            {requests.length === 0 && (
              <Link
                href="/user/requests/new"
                className="mt-4 inline-block text-orange-600 hover:underline"
              >
                Submit your first request
              </Link>
            )}
          </div>
        )}
      </div>
    </>
  );
}
