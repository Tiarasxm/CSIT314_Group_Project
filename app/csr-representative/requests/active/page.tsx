"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AssignVolunteerModal from "@/components/ui/assign-volunteer-modal";
import SuccessConfirmationModal from "@/components/ui/success-confirmation-modal";
import { getUserDisplayName } from "@/lib/utils/pdf-export";

export default function CSRActiveAssignmentsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [requestToComplete, setRequestToComplete] = useState<string | null>(
    null
  );

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
      .select(
        `
        *,
        users:user_id (
          id,
          name,
          first_name,
          last_name,
          email,
          profile_image_url
        )
      `
      )
      .eq("accepted_by", authUser.id)
      .in("status", ["accepted", "in-progress"])
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching requests:", error);
    } else {
      setRequests(data || []);
    }
  };

  const handleViewDetails = (id: string) => {
    router.push(`/csr-representative/requests/${id}`);
  };

  const handleEditVolunteer = (request: any, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent card click
    setSelectedRequest(request.id);
    setShowAssignModal(true);
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
      date: dateObj.toLocaleDateString(),
    };
  };

  const handleMarkComplete = (requestId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent card click
    setRequestToComplete(requestId);
    setShowCompleteModal(true);
  };

  const handleConfirmComplete = async () => {
    if (!requestToComplete) return;

    try {
      const { error } = await supabase
        .from("requests")
        .update({ status: "completed" })
        .eq("id", requestToComplete);

      if (error) {
        console.error("Error marking request as completed:", error);
        alert("Failed to mark request as completed. Please try again.");
        return;
      }

      setShowCompleteModal(false);
      setRequestToComplete(null);
      await fetchRequests();
      alert("Request marked as completed successfully!");
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred. Please try again.");
    }
  };

  const handleCancelComplete = () => {
    setShowCompleteModal(false);
    setRequestToComplete(null);
  };

  const handleShortlist = async (
    requestId: string,
    currentShortlisted: boolean,
    event: React.MouseEvent
  ) => {
    event.stopPropagation(); // Prevent card click

    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        alert("You must be logged in to shortlist requests.");
        return;
      }

      const newShortlistValue = !currentShortlisted;
      const { error } = await supabase
        .from("requests")
        .update({
          shortlisted: newShortlistValue,
          shortlisted_by: newShortlistValue ? authUser.id : null,
        })
        .eq("id", requestId);

      if (error) {
        console.error("Error updating shortlist:", error);
        alert(
          `Failed to update shortlist: ${error.message || "Unknown error"}`
        );
        return;
      }

      // Refresh the requests list
      await fetchRequests();
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred. Please try again.");
    }
  };

  const handleConfirmEdit = async (volunteerData: {
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
          volunteer_name: volunteerData.volunteerName,
          volunteer_mobile: volunteerData.volunteerMobile,
          volunteer_note: volunteerData.volunteerNote,
          volunteer_image_url: volunteerData.volunteerImageUrl || null,
        })
        .eq("id", selectedRequest);

      if (error) {
        console.error("Error updating volunteer:", error);
        alert("Failed to update volunteer. Please try again.");
        return;
      }

      setShowAssignModal(false);
      setSelectedRequest(null);
      await fetchRequests();
      alert("Volunteer information updated successfully!");
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred. Please try again.");
    }
  };

  const filteredRequests = requests.filter((request) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      request.description?.toLowerCase().includes(query) ||
      request.category?.toLowerCase().includes(query) ||
      request.volunteer_name?.toLowerCase().includes(query) ||
      request.users?.name?.toLowerCase().includes(query)
    );
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
              Active Assignments
            </h1>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
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

        {/* Requests Grid */}
        {filteredRequests.length === 0 ? (
          <div className="rounded-lg bg-white p-8 text-center shadow">
            <p className="text-black">No active assignments</p>
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
                  className="cursor-pointer rounded-lg bg-white p-6 shadow transition hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
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
                  <div className="mb-4 flex items-center gap-3 bg-black/5 rounded-xl p-4">
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
                      <div className="font-medium text-zinc-900">
                        {userName}
                      </div>
                      <div className="text-xs text-black">
                        {preferredDate.time} {preferredDate.date}
                      </div>
                    </div>
                  </div>

                  {/* Volunteer Info */}
                  {request.volunteer_name && (
                    <div className="mb-4 space-y-2 flex flex-row">
                      {request.volunteer_image_url && (
                        <div className="m-2 pr-4">
                          <img
                            src={request.volunteer_image_url}
                            alt={request.volunteer_name}
                            className="h-16 w-16 rounded-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex flex-col gap-2 items-left justify-center">
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
                              +65 {request.volunteer_mobile}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

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
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => handleEditVolunteer(request, e)}
                        className="flex-1 rounded-md border-2 border-orange-600 px-3 py-2 text-sm font-medium text-orange-600 transition-colors hover:bg-orange-50"
                      >
                        Edit Volunteer
                      </button>
                      <button
                        onClick={(e) => handleMarkComplete(request.id, e)}
                        className="flex-1 rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
                      >
                        Mark Complete
                      </button>
                    </div>
                    <button
                      onClick={(e) =>
                        handleShortlist(
                          request.id,
                          request.shortlisted &&
                            request.shortlisted_by === user?.id,
                          e
                        )
                      }
                      className={`w-full rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                        request.shortlisted &&
                        request.shortlisted_by === user?.id
                          ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                          : "border border-zinc-300 text-black hover:bg-zinc-50"
                      }`}
                    >
                      {request.shortlisted &&
                      request.shortlisted_by === user?.id
                        ? "★ Shortlisted"
                        : "☆ Shortlist"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirmation Modal for Marking Complete */}
      {showCompleteModal && (
        <SuccessConfirmationModal
          title="Mark Request as Completed"
          message="Are you sure you want to mark this request as completed? This will move it to the completed requests list."
          confirmText="Yes, Mark Complete"
          cancelText="Cancel"
          onConfirm={handleConfirmComplete}
          onCancel={handleCancelComplete}
        />
      )}

      {/* Edit Volunteer Modal */}
      {showAssignModal && selectedRequest && (
        <AssignVolunteerModal
          requestId={selectedRequest}
          isOpen={showAssignModal}
          onClose={() => {
            setShowAssignModal(false);
            setSelectedRequest(null);
          }}
          onConfirm={handleConfirmEdit}
          existingData={
            requests.find((r) => r.id === selectedRequest)
              ? {
                  volunteerName: requests.find((r) => r.id === selectedRequest)
                    ?.volunteer_name,
                  volunteerMobile: requests.find(
                    (r) => r.id === selectedRequest
                  )?.volunteer_mobile,
                  volunteerNote: requests.find((r) => r.id === selectedRequest)
                    ?.volunteer_note,
                  volunteerImageUrl: requests.find(
                    (r) => r.id === selectedRequest
                  )?.volunteer_image_url,
                }
              : undefined
          }
        />
      )}
    </>
  );
}
