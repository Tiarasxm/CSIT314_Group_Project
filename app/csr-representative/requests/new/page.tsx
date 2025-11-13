"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AssignVolunteerModal from "@/components/ui/assign-volunteer-modal";
import { exportRequestToPDF, getUserDisplayName } from "@/lib/utils/pdf-export";

const CATEGORIES = [
  "Household Support",
  "Transportation",
  "Medical Assistance",
  "Food & Groceries",
  "Technology Support",
  "Other",
];

export default function CSRNewRequestsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignContext, setAssignContext] = useState<any>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>("");

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
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching requests:", error);
    } else {
      setRequests(data || []);
    }
  };

  const handleAssign = (requestId: string, existingData?: any) => {
    setSelectedRequest(requestId);
    setAssignContext(existingData || null);
    setShowAssignModal(true);
  };

  const handleConfirmAssign = async (volunteerData: {
    volunteerName: string;
    volunteerMobile: string;
    volunteerNote: string;
    volunteerImageUrl?: string;
  }) => {
    if (!selectedRequest) return;

    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) return;

      const { error } = await supabase
        .from("requests")
        .update({
          status: "accepted",
          accepted_by: authUser.id,
          volunteer_name: volunteerData.volunteerName,
          volunteer_mobile: volunteerData.volunteerMobile,
          volunteer_note: volunteerData.volunteerNote,
          volunteer_image_url: volunteerData.volunteerImageUrl || null,
        })
        .eq("id", selectedRequest);

      if (error) {
        console.error("Error assigning volunteer:", error);
        alert("Failed to assign volunteer. Please try again.");
        return;
      }

      setShowAssignModal(false);
      setSelectedRequest(null);
      setAssignContext(null);
      await fetchRequests();
      alert("Volunteer assigned successfully!");
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred. Please try again.");
    }
  };

  const handleShortlist = async (requestId: string, shortlisted: boolean) => {
    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        alert("You must be logged in to shortlist requests.");
        return;
      }

      const newShortlistValue = !shortlisted;
      const { error } = await supabase
        .from("requests")
        .update({
          shortlisted: newShortlistValue,
          shortlisted_by: newShortlistValue ? authUser.id : null,
        })
        .eq("id", requestId);

      if (error) {
        console.error("Error updating shortlist:", error);
        // Provide more specific error message
        if (error.code === "42501" || error.message?.includes("permission")) {
          alert(
            "Permission denied. Please ensure you have run the database migration: supabase/migrations/012_allow_csr_update_pending_requests.sql"
          );
        } else {
          alert(`Failed to update shortlist: ${error.message || "Unknown error"}`);
        }
        return;
      }

      await fetchRequests();
    } catch (error: any) {
      console.error("Error:", error);
      alert(`An error occurred: ${error.message || "Unknown error"}`);
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

  const filteredRequests = useMemo(() => {
    let filtered = [...requests];

    if (selectedCategories.length > 0) {
      filtered = filtered.filter((request) => {
        const category = request.category || "Other";
        return selectedCategories.includes(category);
      });
    }

    if (selectedTimeRange) {
      const days = parseInt(selectedTimeRange, 10);
      const now = new Date();
      filtered = filtered.filter((request) => {
        if (!request.created_at) return false;
        const createdAt = new Date(request.created_at);
        const diffInDays =
          (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
        return diffInDays <= days;
      });
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((request) => {
        const requestUser = request.users;
        const nameFromMeta =
          (requestUser?.first_name && requestUser?.last_name
            ? `${requestUser.first_name} ${requestUser.last_name}`.trim()
            : requestUser?.first_name || requestUser?.last_name) ||
          requestUser?.name ||
          "";
        return (
          request.description?.toLowerCase().includes(query) ||
          request.category?.toLowerCase().includes(query) ||
          nameFromMeta.toLowerCase().includes(query)
        );
      });
    }

    return filtered;
  }, [requests, searchQuery, selectedCategories, selectedTimeRange]);

  const handleViewDetails = (id: string) => {
    router.push(`/csr-representative/requests/${id}`);
  };

  const formatPreferredDate = (request: any) => {
    const preferred = request?.scheduled_at || request?.preferred_at;
    if (!preferred) {
      return {
        time: "No time specified",
        date: "",
      };
    }

    const dateObj = new Date(preferred);
    return {
      time: dateObj.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      date: dateObj.toLocaleDateString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    };
  };

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
            <h1 className="text-2xl font-bold text-black">New Requests</h1>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 flex gap-4">
          <div className="flex-1">
            <div className="relative">
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
          </div>
          <button
            onClick={() => setShowFilterModal(true)}
            className="flex items-center gap-2 rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-zinc-50"
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
            {(selectedCategories.length > 0 || selectedTimeRange) && (
              <span className="ml-1 rounded-full bg-orange-600 px-2 py-0.5 text-xs text-white">
                {selectedCategories.length + (selectedTimeRange ? 1 : 0)}
              </span>
            )}
          </button>
        </div>

        {/* Requests Grid */}
        {filteredRequests.length === 0 ? (
          <div className="rounded-lg bg-white p-8 text-center shadow">
            <p className="text-black">No new requests found</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredRequests.map((request) => {
              const requestUser = request.users;
              const userName = getUserDisplayName(requestUser);
              const userImage = requestUser?.profile_image_url;
              const preferredDate = formatPreferredDate(request);

              return (
                <div
                  key={request.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleViewDetails(request.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      handleViewDetails(request.id);
                    }
                  }}
                  className="rounded-lg bg-white p-6 shadow transition hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                >
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
                        {preferredDate.time}
                        {preferredDate.date ? ` · ${preferredDate.date}` : ""}
                      </div>
                    </div>
                  </div>

                  {/* Note */}
                  <div className="mb-4">
                    <div className="text-xs font-medium text-black">Note</div>
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
                  <div className="flex flex-wrap gap-2">
                    {request.shortlisted && request.shortlisted_by === user?.id ? (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShortlist(request.id, true);
                          }}
                          className="flex-1 rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-700"
                        >
                          Undo
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExportPDF(request);
                          }}
                          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-zinc-50"
                        >
                          Export
                        </button>
                        <div className="w-full text-center text-sm text-green-600">
                          ✓ You have shortlisted the request!
                        </div>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAssign(request.id, {
                              volunteerName: request.volunteer_name,
                              volunteerMobile: request.volunteer_mobile,
                              volunteerNote: request.volunteer_note,
                              volunteerImageUrl: request.volunteer_image_url,
                            });
                          }}
                          className="flex-1 rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-700"
                        >
                          Assign
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShortlist(request.id, false);
                          }}
                          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-zinc-50"
                        >
                          Shortlist
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleExportPDF(request);
                          }}
                          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-zinc-50"
                        >
                          Export
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Assign Volunteer Modal */}
      {showAssignModal && selectedRequest && (
        <AssignVolunteerModal
          requestId={selectedRequest}
          isOpen={showAssignModal}
          onClose={() => {
            setShowAssignModal(false);
            setSelectedRequest(null);
            setAssignContext(null);
          }}
          onConfirm={handleConfirmAssign}
          existingData={
            assignContext
              ? {
                  volunteerName: assignContext.volunteerName,
                  volunteerMobile: assignContext.volunteerMobile,
                  volunteerNote: assignContext.volunteerNote,
                  volunteerImageUrl: assignContext.volunteerImageUrl,
                }
              : undefined
          }
        />
      )}

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
                Filter Requests
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

            {/* Category Filter */}
            <div className="mb-6">
              <div className="mb-3 text-sm font-medium text-black">
                Type
              </div>
              <div className="grid gap-2">
                {CATEGORIES.map((category) => (
                  <label
                    key={category}
                    className="flex items-center gap-2 rounded-md border border-zinc-200 px-3 py-2 text-sm text-black transition hover:bg-zinc-50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCategories((prev) => [...prev, category]);
                        } else {
                          setSelectedCategories((prev) =>
                            prev.filter((item) => item !== category)
                          );
                        }
                      }}
                      className="rounded border-zinc-300 text-orange-600 focus:ring-orange-500"
                    />
                    {category}
                  </label>
                ))}
              </div>
            </div>

            {/* Time Filter */}
            <div className="mb-6">
              <div className="mb-3 text-sm font-medium text-black">
                Time
              </div>
              <div className="space-y-2">
                {["7", "14", "30"].map((days) => (
                  <label
                    key={days}
                    className="flex items-center gap-2 rounded-md border border-zinc-200 px-3 py-2 text-sm text-black transition hover:bg-zinc-50"
                  >
                    <input
                      type="radio"
                      name="timeRange"
                      value={days}
                      checked={selectedTimeRange === days}
                      onChange={(e) => setSelectedTimeRange(e.target.value)}
                      className="border-zinc-300 text-orange-600 focus:ring-orange-500"
                    />
                    In {days} days
                  </label>
                ))}
                <label
                  className="flex items-center gap-2 rounded-md border border-zinc-200 px-3 py-2 text-sm text-black transition hover:bg-zinc-50"
                >
                  <input
                    type="radio"
                    name="timeRange"
                    value=""
                    checked={selectedTimeRange === ""}
                    onChange={() => setSelectedTimeRange("")}
                    className="border-zinc-300 text-orange-600 focus:ring-orange-500"
                  />
                  Any time
                </label>
              </div>
            </div>

            <div className="flex justify-between gap-3">
              <button
                onClick={() => {
                  setSelectedCategories([]);
                  setSelectedTimeRange("");
                }}
                className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-black transition hover:bg-zinc-50"
              >
                Reset
              </button>
              <button
                onClick={() => setShowFilterModal(false)}
                className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-orange-700"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

