"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AssignVolunteerModal from "@/components/ui/assign-volunteer-modal";
import { exportRequestToPDF, getUserDisplayName } from "@/lib/utils/pdf-export";

export default function CSRShortlistPage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);

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
      .eq("shortlisted_by", authUser.id)
      .eq("shortlisted", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching requests:", error);
    } else {
      setRequests(data || []);
    }
  };

  const handleAssign = (requestId: string) => {
    setSelectedRequest(requestId);
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
      await fetchRequests();
      alert("Volunteer assigned successfully!");
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred. Please try again.");
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
            <h1 className="text-2xl font-bold text-black">My Shortlist</h1>
          </div>
        </div>

        {/* Requests Grid */}
        {requests.length === 0 ? (
          <div className="rounded-lg bg-white p-8 text-center shadow">
            <p className="text-black">No shortlisted requests</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {requests.map((request) => {
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
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAssign(request.id)}
                      className="flex-1 rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-700"
                    >
                      Assign CV
                    </button>
                    <button
                      onClick={() => handleExportPDF(request)}
                      className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-zinc-50"
                    >
                      Export
                    </button>
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
          }}
          onConfirm={handleConfirmAssign}
        />
      )}
    </>
  );
}

