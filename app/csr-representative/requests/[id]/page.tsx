"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import AssignVolunteerModal from "@/components/ui/assign-volunteer-modal";

function formatDateTime(value?: string | null) {
  if (!value) {
    return {
      date: "Not specified",
      time: "Not specified",
    };
  }
  const dateObj = new Date(value);
  return {
    date: dateObj.toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    time: dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  };
}

export default function CSRRequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState<any>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignContext, setAssignContext] = useState<any>(null);
  const [processingShortlist, setProcessingShortlist] = useState(false);

  const requestId = useMemo(() => (params?.id ? String(params.id) : ""), [params?.id]);

  useEffect(() => {
    if (!requestId) return;

    const fetchRequest = async () => {
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
              contact_number,
              profile_image_url,
              language,
              address,
              medical_condition
            )
          `
        )
        .eq("id", requestId)
        .single();

      if (error || !data) {
        console.error("Error fetching request:", error);
        router.push("/csr-representative/requests/new");
        return;
      }

      setRequest(data);
      setLoading(false);
    };

    fetchRequest();
  }, [requestId, router, supabase]);

  const handleToggleShortlist = async () => {
    if (!request) return;
    setProcessingShortlist(true);
    try {
      const { error } = await supabase
        .from("requests")
        .update({ shortlisted: !request.shortlisted })
        .eq("id", request.id);

      if (error) {
        console.error("Error updating shortlist:", error);
        alert("Failed to update shortlist. Please try again.");
        return;
      }

      setRequest((prev: any) => ({
        ...prev,
        shortlisted: !prev.shortlisted,
      }));
    } finally {
      setProcessingShortlist(false);
    }
  };

  const handleAssignVolunteer = (existingData?: any) => {
    if (!request) return;
    setAssignContext(existingData || null);
    setShowAssignModal(true);
  };

  const handleConfirmAssign = async (volunteerData: {
    volunteerName: string;
    volunteerMobile: string;
    volunteerNote: string;
    volunteerImageUrl?: string;
  }) => {
    if (!request) return;

    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      router.push("/staff/login");
      return;
    }

    const { error } = await supabase
      .from("requests")
      .update({
        status: request.status === "pending" ? "accepted" : request.status,
        accepted_by: authUser.id,
        volunteer_name: volunteerData.volunteerName,
        volunteer_mobile: volunteerData.volunteerMobile,
        volunteer_note: volunteerData.volunteerNote,
        volunteer_image_url: volunteerData.volunteerImageUrl || null,
      })
      .eq("id", request.id);

    if (error) {
      console.error("Error assigning volunteer:", error);
      alert("Failed to assign volunteer. Please try again.");
      return;
    }

    const updated = await supabase
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
            contact_number,
            profile_image_url,
            language,
            address,
            medical_condition
          )
        `
      )
      .eq("id", request.id)
      .single();

    setRequest(updated.data);
    setShowAssignModal(false);
    setAssignContext(null);
    alert("Volunteer assignment saved.");
  };

  const handleExportPDF = () => {
    alert("PDF export functionality will be implemented soon.");
  };

  if (loading || !request) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-600 border-t-transparent"></div>
          <p className="text-sm text-black">Loading request...</p>
        </div>
      </div>
    );
  }

  const requester = request.users;
  const requesterName =
    requester?.name ||
    `${requester?.first_name || ""} ${requester?.last_name || ""}`.trim() ||
    "Unknown User";
  const preferred = formatDateTime(request?.scheduled_at || request?.preferred_at);
  const created = formatDateTime(request.created_at);

  return (
    <>
      <div className="mx-auto max-w-5xl p-6">
        <div className="mb-6 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="rounded-full border border-zinc-200 p-2 text-black transition hover:bg-zinc-100"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">{request.category || "Request details"}</h1>
            <p className="text-sm text-zinc-500">Request ID: #{request.id.slice(0, 8)}</p>
          </div>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <button
            onClick={() =>
              handleAssignVolunteer({
                volunteerName: request.volunteer_name,
                volunteerMobile: request.volunteer_mobile,
                volunteerNote: request.volunteer_note,
                volunteerImageUrl: request.volunteer_image_url,
              })
            }
            className="rounded-xl bg-orange-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-orange-700"
          >
            {request.volunteer_name ? "Edit Volunteer" : "Assign Volunteer"}
          </button>
          <button
            onClick={handleToggleShortlist}
            disabled={processingShortlist}
            className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
              request.shortlisted
                ? "border-orange-600 text-orange-600 hover:bg-orange-50"
                : "border-zinc-300 text-black hover:bg-zinc-50"
            }`}
          >
            {processingShortlist ? "Updating..." : request.shortlisted ? "Remove from Shortlist" : "Shortlist"}
          </button>
          <button
            onClick={handleExportPDF}
            className="rounded-xl border border-zinc-300 px-4 py-3 text-sm font-medium text-black transition hover:bg-zinc-50"
          >
            Export as PDF
          </button>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl bg-white p-6 shadow">
            <h2 className="mb-4 text-lg font-semibold text-zinc-900">Request Summary</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Requested By
                </span>
                <div className="mt-2 flex items-center gap-3">
                  {requester?.profile_image_url ? (
                    <img
                      src={requester.profile_image_url}
                      alt={requesterName}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-200 text-sm font-semibold text-black">
                      {requesterName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-zinc-900">{requesterName}</p>
                    <p className="text-xs text-zinc-500">{requester?.email}</p>
                  </div>
                </div>
              </div>
              <div>
                <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Preferred Date &amp; Time
                </span>
                <p className="mt-2 text-sm text-zinc-900">
                  {preferred.date === "Not specified"
                    ? "Not specified"
                    : `${preferred.date} • ${preferred.time}`}
                </p>
              </div>
              <div>
                <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Created On
                </span>
                <p className="mt-2 text-sm text-zinc-900">
                  {created.date} • {created.time}
                </p>
              </div>
              <div>
                <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Status
                </span>
                <p className="mt-2 text-sm font-medium text-orange-600 capitalize">{request.status}</p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow">
            <h2 className="mb-4 text-lg font-semibold text-zinc-900">Description</h2>
            <p className="whitespace-pre-line text-sm text-zinc-800">{request.description}</p>

            {request.additional_notes && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-zinc-900">Additional Notes</h3>
                <p className="mt-2 whitespace-pre-line text-sm text-zinc-700">
                  {request.additional_notes}
                </p>
              </div>
            )}
          </section>

          {request.attachments && request.attachments.length > 0 && (
            <section className="rounded-2xl bg-white p-6 shadow">
              <h2 className="mb-4 text-lg font-semibold text-zinc-900">Attachments</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {request.attachments.map((attachment: string) => {
                  const isImage = /\.(png|jpe?g|gif|webp|svg)$/i.test(attachment);
                  return (
                    <div key={attachment} className="rounded-lg border border-zinc-200 p-4">
                      {isImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={attachment}
                          alt="Request attachment"
                          className="h-48 w-full rounded-md object-cover"
                        />
                      ) : (
                        <div className="flex h-48 items-center justify-center rounded-md bg-zinc-100 text-sm text-zinc-600">
                          File preview not available
                        </div>
                      )}
                      <a
                        href={attachment}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-orange-600 hover:underline"
                      >
                        View Attachment
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 17l9-9m0 0H8m8 0v8"
                          />
                        </svg>
                      </a>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {request.volunteer_name && (
            <section className="rounded-2xl bg-white p-6 shadow">
              <h2 className="mb-4 text-lg font-semibold text-zinc-900">Assigned Volunteer</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Name
                  </span>
                  <p className="mt-2 text-sm font-medium text-zinc-900">{request.volunteer_name}</p>
                </div>
                {request.volunteer_mobile && (
                  <div>
                    <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                      Mobile
                    </span>
                    <p className="mt-2 text-sm text-zinc-900">{request.volunteer_mobile}</p>
                  </div>
                )}
                {request.volunteer_image_url && (
                  <div className="md:col-span-2">
                    <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                      Volunteer Image
                    </span>
                    <div className="mt-2">
                      <img
                        src={request.volunteer_image_url}
                        alt={request.volunteer_name}
                        className="h-32 w-32 rounded-full object-cover"
                      />
                    </div>
                  </div>
                )}
                {request.volunteer_note && (
                  <div className="md:col-span-2">
                    <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                      Notes
                    </span>
                    <p className="mt-2 whitespace-pre-line text-sm text-zinc-700">
                      {request.volunteer_note}
                    </p>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </div>

      {showAssignModal && (
        <AssignVolunteerModal
          requestId={request.id}
          isOpen={showAssignModal}
          onClose={() => {
            setShowAssignModal(false);
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
    </>
  );
}


