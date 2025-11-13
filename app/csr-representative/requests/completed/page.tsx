"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { exportRequestToPDF, getUserDisplayName } from "@/lib/utils/pdf-export";

export default function CSRCompletedServicesPage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>("");

  const categories = [
    "Household Support",
    "Transportation",
    "Medical Assistance",
    "Food & Groceries",
    "Technology Support",
    "Other",
  ];

  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        router.push("/staff/login");
        return;
      }

      const { data: userData } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (userData?.role !== "csr-representative") {
        router.push("/staff/login");
        return;
      }

      setUser(userData);
      await fetchRequests();
      setLoading(false);
    };

    fetchData();
  }, [supabase, router]);

  const fetchRequests = async () => {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) return;

    const { data, error } = await supabase
      .from("requests")
      .select(`
        *,
        users:user_id (
          id,
          name,
          first_name,
          last_name,
          email,
          profile_image_url
        )
      `)
      .eq("accepted_by", authUser.id)
      .eq("status", "completed")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching requests:", error);
    } else {
      setRequests(data || []);
    }
  };

  const handleExportPDF = async (request: any) => {
    try {
      await exportRequestToPDF(request);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  const filteredRequests = requests.filter((request) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !request.description?.toLowerCase().includes(query) &&
        !request.category?.toLowerCase().includes(query) &&
        !request.volunteer_name?.toLowerCase().includes(query) &&
        !request.users?.name?.toLowerCase().includes(query)
      ) {
        return false;
      }
    }

    // Category filter
    if (selectedCategories.length > 0) {
      if (!request.category || !selectedCategories.includes(request.category)) {
        return false;
      }
    }

    // Time range filter
    if (selectedTimeRange) {
      const now = new Date();
      const requestDate = new Date(request.created_at);
      const daysDiff = Math.floor(
        (now.getTime() - requestDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (selectedTimeRange === "7" && daysDiff > 7) return false;
      if (selectedTimeRange === "14" && daysDiff > 14) return false;
      if (selectedTimeRange === "30" && daysDiff > 30) return false;
    }

    return true;
  });

  if (loading) {
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
      <div className="mx-auto max-w-7xl p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/csr-representative/dashboard"
              className="text-black hover:text-orange-600"
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
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </Link>
            <h1 className="text-2xl font-bold text-black">
              Completed Services
            </h1>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 flex gap-4">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search requests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-zinc-300 px-4 py-2 pl-10 text-black focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
            <svg
              className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400"
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
          <button
            onClick={() => setShowFilter(!showFilter)}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-zinc-50"
          >
            Filter
          </button>
        </div>

        {/* Filter Modal */}
        {showFilter && (
          <div className="fixed inset-0 z-40 flex items-center justify-center backdrop-blur-sm">
            <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-black">
                  Filter by
                </h3>
                <button
                  onClick={() => setShowFilter(false)}
                  className="text-black hover:text-black"
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

              {/* Category Filter */}
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-black">
                  Type
                </label>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <label
                      key={category}
                      className="flex items-center gap-2"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCategories([
                              ...selectedCategories,
                              category,
                            ]);
                          } else {
                            setSelectedCategories(
                              selectedCategories.filter((c) => c !== category)
                            );
                          }
                        }}
                        className="rounded border-zinc-300 text-orange-600 focus:ring-orange-500"
                      />
                      <span className="text-sm text-black">{category}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Time Filter */}
              <div>
                <label className="mb-2 block text-sm font-medium text-black">
                  Time
                </label>
                <div className="space-y-2">
                  {["7", "14", "30"].map((days) => (
                    <label key={days} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="timeRange"
                        value={days}
                        checked={selectedTimeRange === days}
                        onChange={(e) => setSelectedTimeRange(e.target.value)}
                        className="border-zinc-300 text-orange-600 focus:ring-orange-500"
                      />
                      <span className="text-sm text-black">
                        In {days} days
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Requests Grid */}
        {filteredRequests.length === 0 ? (
          <div className="rounded-lg bg-white p-8 text-center shadow">
            <p className="text-black">No completed requests found</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredRequests.map((request) => {
              const requestUser = request.users;
              const userName = getUserDisplayName(requestUser);
              const userImage = requestUser?.profile_image_url;

              return (
                <div key={request.id} className="rounded-lg bg-white p-6 shadow">
                  {/* Category and Request ID */}
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
                        {request.category || "Other"}
                      </span>
                    </div>
                    <span className="text-xs text-black">
                      Request ID: #{request.id.slice(0, 8)}
                    </span>
                  </div>

                  {/* User Info */}
                  <div className="mb-4 flex items-center gap-3">
                    {userImage ? (
                      <img
                        src={userImage}
                        alt={userName}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-zinc-200"></div>
                    )}
                    <div>
                      <div className="font-medium text-zinc-900">{userName}</div>
                      <div className="text-xs text-black">
                        {request.preferred_at
                          ? new Date(request.preferred_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "No time specified"}{" "}
                        {request.preferred_at
                          ? new Date(request.preferred_at).toLocaleDateString()
                          : ""}
                      </div>
                    </div>
                  </div>

                  {/* Volunteer Info */}
                  {request.volunteer_name && (
                    <div className="mb-4 space-y-2">
                      <div>
                        <span className="text-xs font-medium text-black">
                          Volunteer:{" "}
                        </span>
                        <span className="text-sm text-black">
                          {request.volunteer_name}
                        </span>
                      </div>
                      {request.volunteer_mobile && (
                        <div>
                          <span className="text-xs font-medium text-black">
                            Mobile:{" "}
                          </span>
                          <span className="text-sm text-black">
                            {request.volunteer_mobile}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Status */}
                  <div className="mb-4">
                    <span className="inline-block rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                      Status: Completed
                    </span>
                  </div>

                  {/* Note */}
                  <div className="mb-4">
                    <div className="text-xs font-medium text-black">
                      Your Note
                    </div>
                    <p className="mt-1 text-sm text-black line-clamp-3">
                      {request.description}
                    </p>
                  </div>

                  {/* Created Date */}
                  {request.created_at && (
                    <div className="mb-4 text-xs text-black">
                      Created on{" "}
                      {new Date(request.created_at).toLocaleDateString()}
                    </div>
                  )}

                  {/* Actions */}
                  <button
                    onClick={() => handleExportPDF(request)}
                    className="w-full rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-zinc-50"
                  >
                    Export
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

