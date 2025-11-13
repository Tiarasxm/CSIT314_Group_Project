"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import ConfirmationModal from "@/components/ui/confirmation-modal";
import SuccessConfirmationModal from "@/components/ui/success-confirmation-modal";
import { useRequestsCache } from "@/lib/hooks/use-requests-cache";
import { useUserData } from "@/lib/hooks/use-user-data";
import SuspendedBanner from "@/components/ui/suspended-banner";
import SuspendedModal from "@/components/ui/suspended-modal";

export default function RequestDetailPage() {
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();
  const { invalidateCache } = useRequestsCache();
  const { user } = useUserData();
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    description: "",
    additional_notes: "",
    attachments: [] as string[],
  });
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [filesToRemove, setFilesToRemove] = useState<string[]>([]);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [showSuspendedModal, setShowSuspendedModal] = useState(false);

  useEffect(() => {
    // Don't fetch if we're in the process of deleting
    if (isDeleting) return;

    const fetchRequest = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // First fetch the request
      const { data: requestData, error: requestError } = await supabase
        .from("requests")
        .select("*")
        .eq("id", params.id)
        .eq("user_id", user.id)
        .single();

      if (requestError) {
        console.error("Error fetching request:", requestError);
        router.push("/user/requests");
        return;
      }

      // If request has a CSR assigned, fetch CSR details using safe function
      let csrData = null;
      if (requestData?.accepted_by) {
        const { data: csrResult, error: csrError } = await supabase.rpc(
          "get_csr_info",
          { csr_id: requestData.accepted_by }
        );

        if (!csrError && csrResult && csrResult.length > 0) {
          csrData = csrResult[0];
        }
      }

      // Fetch shortlist count for this request
      let shortlistCount = 0;
      if (requestData?.id) {
        const { data: shortlistCounts } = await supabase.rpc(
          "get_request_shortlist_counts",
          { request_ids: [requestData.id] }
        );

        if (shortlistCounts && shortlistCounts.length > 0) {
          shortlistCount = shortlistCounts[0].shortlist_count || 0;
        }
      }

      // Combine the data
      const data = {
        ...requestData,
        csr: csrData,
        shortlist_count: shortlistCount,
      };

      // Debug: Log CSR data to check if it's being fetched
      console.log("Request data:", data);
      console.log("CSR data:", csrData);
      console.log("CSR accepted_by:", requestData.accepted_by);

      setRequest(data);
      setFormData({
        description: data.description || "",
        additional_notes: data.additional_notes || "",
        attachments: data.attachments || [],
      });
      setLoading(false);
    };

    if (params.id) {
      fetchRequest();
    }
  }, [supabase, router, params.id, isDeleting]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setNewFiles(Array.from(e.target.files));
    }
  };

  const handleRemoveAttachment = (url: string) => {
    setFilesToRemove((prev) => [...prev, url]);
    setFormData((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((att) => att !== url),
    }));
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    // Reset form data to original request data
    if (request) {
      setFormData({
        description: request.description || "",
        additional_notes: request.additional_notes || "",
        attachments: request.attachments || [],
      });
    }
    setNewFiles([]);
    setFilesToRemove([]);
  };

  const handleSave = async () => {
    if (!request || request.status !== "pending") return;

    setSaving(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Upload new files
      let newFileUrls: string[] = [];
      if (newFiles.length > 0) {
        for (const file of newFiles) {
          try {
            const fileExt = file.name.split(".").pop();
            const fileName = `${user.id}/${Date.now()}_${Math.random()
              .toString(36)
              .substring(7)}.${fileExt}`;
            const { data: uploadData, error: uploadError } =
              await supabase.storage
                .from("request-files")
                .upload(fileName, file);

            if (!uploadError && uploadData) {
              const { data: urlData } = supabase.storage
                .from("request-files")
                .getPublicUrl(fileName);
              if (urlData?.publicUrl) {
                newFileUrls.push(urlData.publicUrl);
              }
            } else {
              console.warn("File upload failed:", uploadError);
            }
          } catch (error) {
            console.warn("Error uploading file:", error);
          }
        }
      }

      // Remove old files from storage
      if (filesToRemove.length > 0) {
        for (const url of filesToRemove) {
          try {
            if (url.includes("/request-files/")) {
              const urlParts = url.split("/request-files/");
              if (urlParts.length > 1) {
                const filePath = urlParts[1].split("?")[0];
                await supabase.storage.from("request-files").remove([filePath]);
              }
            }
          } catch (error) {
            console.warn("Error removing file:", error);
          }
        }
      }

      // Combine existing attachments (minus removed ones) with new ones
      const updatedAttachments = [
        ...formData.attachments.filter((url) => !filesToRemove.includes(url)),
        ...newFileUrls,
      ];

      // Update request
      const { error: updateError } = await supabase
        .from("requests")
        .update({
          description: formData.description,
          additional_notes: formData.additional_notes || null,
          attachments:
            updatedAttachments.length > 0 ? updatedAttachments : null,
        })
        .eq("id", request.id)
        .eq("user_id", user.id);

      if (updateError) {
        console.error("Error updating request:", updateError);
        alert("Failed to update request. Please try again.");
        setSaving(false);
        return;
      }

      // Refresh request data
      const { data: updatedRequestData } = await supabase
        .from("requests")
        .select("*")
        .eq("id", request.id)
        .single();

      // Fetch CSR details if assigned using safe function
      let updatedCsrData = null;
      if (updatedRequestData?.accepted_by) {
        const { data: csrResult } = await supabase.rpc("get_csr_info", {
          csr_id: updatedRequestData.accepted_by,
        });

        if (csrResult && csrResult.length > 0) {
          updatedCsrData = csrResult[0];
        }
      }

      const updatedRequest = {
        ...updatedRequestData,
        csr: updatedCsrData,
      };

      if (updatedRequest) {
        setRequest(updatedRequest);
        setFormData({
          description: updatedRequest.description || "",
          additional_notes: updatedRequest.additional_notes || "",
          attachments: updatedRequest.attachments || [],
        });
      }

      setIsEditing(false);
      setNewFiles([]);
      setFilesToRemove([]);
      alert("Request updated successfully!");
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleWithdraw = async () => {
    if (!request || request.status !== "pending") return;

    setWithdrawing(true);
    setIsDeleting(true); // Prevent refetching

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Delete associated files from storage
      if (request.attachments && request.attachments.length > 0) {
        for (const url of request.attachments) {
          try {
            if (url.includes("/request-files/")) {
              const urlParts = url.split("/request-files/");
              if (urlParts.length > 1) {
                const filePath = urlParts[1].split("?")[0];
                await supabase.storage.from("request-files").remove([filePath]);
              }
            }
          } catch (error) {
            console.warn("Error removing file:", error);
            // Continue with deletion even if file removal fails
          }
        }
      }

      // Delete the request
      const { error: deleteError } = await supabase
        .from("requests")
        .delete()
        .eq("id", request.id)
        .eq("user_id", user.id)
        .eq("status", "pending"); // Extra safety check

      if (deleteError) {
        console.error("Error deleting request:", deleteError);
        console.error(
          "Delete error details:",
          JSON.stringify(deleteError, null, 2)
        );
        alert(
          `Failed to withdraw request: ${
            deleteError.message || "Unknown error"
          }. Please check if the DELETE policy is set up correctly.`
        );
        setIsDeleting(false);
        setWithdrawing(false);
        return;
      }

      // Invalidate all request caches to ensure fresh data
      invalidateCache();

      // Close modal
      setShowWithdrawModal(false);

      // Use hard redirect to ensure page fully reloads with fresh data
      // This guarantees the withdrawn request is gone from the list
      window.location.href = "/user/requests";
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred. Please try again.");
      setIsDeleting(false);
      setWithdrawing(false);
    }
  };

  const handleMarkComplete = async () => {
    // Check if user is suspended
    if (user?.is_suspended) {
      setShowSuspendedModal(true);
      return;
    }

    if (!request) return;
    if (request.status !== "accepted" && request.status !== "in-progress")
      return;

    setCompleting(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Update request status to completed
      const { error: updateError } = await supabase
        .from("requests")
        .update({ status: "completed" })
        .eq("id", request.id)
        .eq("user_id", user.id);

      if (updateError) {
        console.error("Error marking request as completed:", updateError);
        alert("Failed to mark request as completed. Please try again.");
        setCompleting(false);
        return;
      }

      // Invalidate all request caches to ensure fresh data
      invalidateCache();

      // Close modal
      setShowCompleteModal(false);

      // Refresh the page to show updated status
      window.location.reload();
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred. Please try again.");
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!request) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
      case "in-progress":
        return "bg-green-100 text-green-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "completed":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-zinc-100 text-black";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "accepted":
        return "Confirmed";
      case "in-progress":
        return "In Progress";
      case "pending":
        return "Pending";
      case "completed":
        return "Completed";
      default:
        return status;
    }
  };

  return (
    <>
      {user?.is_suspended && <SuspendedBanner />}
      <div
        className={`mx-auto max-w-4xl p-6 ${user?.is_suspended ? "mt-14" : ""}`}
      >
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/user/requests"
            className="text-sm text-orange-600 hover:underline"
          >
            ← Back to Requests
          </Link>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between border-b border-zinc-200 pb-4">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <svg
                  className="h-6 w-6 text-orange-600"
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
                <h1 className="text-2xl font-bold text-zinc-900">
                  {request.category || "Household Support"}
                </h1>
              </div>
              <p className="text-sm text-black">
                Request ID: #{request.id.slice(0, 8)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {request.status === "pending" && !isEditing && (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-700"
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
                    Edit Request
                  </button>
                  <button
                    onClick={() => setShowWithdrawModal(true)}
                    disabled={withdrawing}
                    className="flex items-center gap-2 rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
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
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    Withdraw Request
                  </button>
                </>
              )}
              {(request.status === "accepted" ||
                request.status === "in-progress") && (
                <button
                  onClick={() => {
                    if (user?.is_suspended) {
                      setShowSuspendedModal(true);
                    } else {
                      setShowCompleteModal(true);
                    }
                  }}
                  disabled={completing}
                  className="flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
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
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {completing ? "Marking..." : "Mark Complete"}
                </button>
              )}
              <span
                className={`rounded-full px-3 py-1 text-sm font-medium ${getStatusColor(
                  request.status
                )}`}
              >
                {getStatusLabel(request.status)}
              </span>

              {/* Shortlist Count */}
              {request.shortlist_count > 0 && (
                <div className="flex items-center gap-1.5 text-yellow-600">
                  <svg className="h-5 w-5 fill-current" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-sm font-medium">
                    Shortlisted by {request.shortlist_count}{" "}
                    {request.shortlist_count === 1 ? "CSR" : "CSRs"}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* CSR Rep and Volunteer Info */}
          {request.accepted_by && (
            <div className="mb-6 space-y-4 rounded-lg bg-zinc-50 p-4">
              <div className="rounded-lg border border-zinc-200 bg-white p-3">
                <div className="mb-1 text-xs font-medium uppercase tracking-wide text-zinc-500">
                  CSR Representative
                </div>
                <div className="text-base font-semibold text-zinc-900">
                  {request.csr?.name ||
                    request.csr?.[0]?.name ||
                    "CSR Representative"}
                </div>
                <div className="mt-1 flex items-center gap-1 text-sm text-zinc-600">
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
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  {request.csr?.email ||
                    request.csr?.[0]?.email ||
                    "Email not available"}
                </div>
              </div>
              {request.volunteer_name && (
                <div>
                  <div className="flex items-center gap-4 mb-3">
                    {request.volunteer_image_url ? (
                      <img
                        src={request.volunteer_image_url}
                        alt={request.volunteer_name}
                        className="h-16 w-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-full bg-zinc-200"></div>
                    )}
                    <div>
                      <div className="mb-1 text-xs font-medium text-black">
                        Volunteer
                      </div>
                      <div className="text-sm font-semibold text-zinc-900">
                        {request.volunteer_name}
                      </div>
                      <div className="text-xs text-black">
                        {request.volunteer_mobile
                          ? `+65 ${request.volunteer_mobile}`
                          : "Mobile"}
                      </div>
                    </div>
                  </div>
                  {request.volunteer_note && (
                    <div className="pl-2 border-l-2 border-orange-300">
                      <div className="mb-1 text-xs font-medium text-black">
                        Note:
                      </div>
                      <p className="text-sm text-black">
                        {request.volunteer_note}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Time and Date */}
          {request.scheduled_at && (
            <div className="mb-6">
              <div className="mb-1 text-xs font-medium text-black">
                Scheduled Time
              </div>
              <div className="text-lg font-semibold text-zinc-900">
                {new Date(request.scheduled_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                {new Date(request.scheduled_at).toLocaleDateString()}
              </div>
            </div>
          )}

          {/* Description */}
          <div className="mb-6">
            <div className="mb-2 text-sm font-medium text-black">Your Note</div>
            {isEditing && request.status === "pending" ? (
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={5}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-black focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                required
              />
            ) : (
              <p className="text-black">{request.description}</p>
            )}
          </div>

          {/* Additional Notes */}
          <div className="mb-6">
            <div className="mb-2 text-sm font-medium text-black">
              Additional Notes
            </div>
            {isEditing && request.status === "pending" ? (
              <textarea
                name="additional_notes"
                value={formData.additional_notes}
                onChange={handleInputChange}
                rows={5}
                placeholder="Any additional information you'd like to provide..."
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-black focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            ) : request.additional_notes ? (
              <p className="text-black">{request.additional_notes}</p>
            ) : (
              <p className="text-zinc-400 italic">No additional notes</p>
            )}
          </div>

          {/* Attachments */}
          <div className="mb-6">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-medium text-black">Attachments</div>
              {isEditing && request.status === "pending" && (
                <label className="cursor-pointer text-sm text-orange-600 hover:underline">
                  <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  + Add Files
                </label>
              )}
            </div>
            {(formData.attachments.length > 0 || newFiles.length > 0) && (
              <div className="space-y-4">
                {/* Existing attachments */}
                {formData.attachments.map((url: string, index: number) => {
                  // Check if the file is an image
                  const isImage =
                    /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(url) ||
                    url.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)/i);

                  return (
                    <div key={index} className="space-y-2">
                      {isImage ? (
                        <div className="space-y-2">
                          <div className="relative">
                            <img
                              src={url}
                              alt={`Attachment ${index + 1}`}
                              className="max-h-96 w-full rounded-lg border border-zinc-200 object-contain"
                              onError={(e) => {
                                // Fallback to link if image fails to load
                                const target = e.target as HTMLImageElement;
                                target.style.display = "none";
                                const link =
                                  target.nextElementSibling as HTMLElement;
                                if (link) link.style.display = "block";
                              }}
                            />
                            {isEditing && request.status === "pending" && (
                              <button
                                onClick={() => handleRemoveAttachment(url)}
                                className="absolute top-2 right-2 rounded-full bg-red-500 p-1.5 text-white transition-colors hover:bg-red-600"
                                title="Remove attachment"
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
                                    d="M6 18L18 6M6 6l12 12"
                                  />
                                </svg>
                              </button>
                            )}
                          </div>
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-orange-600 hover:underline"
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
                                d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                              />
                            </svg>
                            Open image in new tab
                          </a>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex flex-1 items-center gap-2 rounded-md bg-zinc-100 px-4 py-3 text-sm text-orange-600 transition-colors hover:bg-zinc-200 hover:underline"
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
                                d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                              />
                            </svg>
                            <span>Attachment {index + 1}</span>
                            <svg
                              className="ml-auto h-4 w-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                              />
                            </svg>
                          </a>
                          {isEditing && request.status === "pending" && (
                            <button
                              onClick={() => handleRemoveAttachment(url)}
                              className="rounded-md bg-red-500 p-2 text-white transition-colors hover:bg-red-600"
                              title="Remove attachment"
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
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                {/* New files to be uploaded */}
                {newFiles.map((file, index) => (
                  <div
                    key={`new-${index}`}
                    className="flex items-center gap-2 rounded-md bg-zinc-50 px-4 py-2 text-sm text-black"
                  >
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
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <span className="flex-1">{file.name}</span>
                    <button
                      onClick={() =>
                        setNewFiles(newFiles.filter((_, i) => i !== index))
                      }
                      className="text-red-500 hover:text-red-700"
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
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
            {formData.attachments.length === 0 && newFiles.length === 0 && (
              <p className="text-sm text-zinc-400 italic">No attachments</p>
            )}
          </div>

          {/* Edit Actions */}
          {isEditing && request.status === "pending" && (
            <div className="mb-6 flex justify-end gap-3 border-t border-zinc-200 pt-4">
              <button
                onClick={handleCancelEdit}
                disabled={saving}
                className="rounded-md border border-zinc-300 px-6 py-2 text-sm font-medium text-black transition-colors hover:bg-zinc-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !formData.description.trim()}
                className="rounded-md bg-orange-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          )}

          {/* Metadata */}
          <div className="border-t border-zinc-200 pt-4">
            <div className="grid gap-4 text-sm md:grid-cols-2">
              <div>
                <div className="text-xs font-medium text-black">Created on</div>
                <div className="text-black">
                  {new Date(request.created_at).toLocaleDateString()}
                </div>
              </div>
              {request.updated_at && (
                <div>
                  <div className="text-xs font-medium text-black">
                    Last updated
                  </div>
                  <div className="text-black">
                    {new Date(request.updated_at).toLocaleDateString()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Withdraw Confirmation Modal */}
      {showWithdrawModal && (
        <ConfirmationModal
          title="Withdraw Request"
          message="Are you sure you want to withdraw this request? This action cannot be undone. All associated files will be permanently deleted."
          confirmText="Withdraw Request"
          cancelText="Cancel"
          onConfirm={handleWithdraw}
          onCancel={() => setShowWithdrawModal(false)}
          isDestructive={true}
        />
      )}

      {/* Mark Complete Confirmation Modal */}
      {showCompleteModal && (
        <SuccessConfirmationModal
          title="Mark Request as Completed"
          message="Are you sure you want to mark this request as completed? This will move it to your past requests."
          confirmText="Yes, Mark Complete"
          cancelText="Cancel"
          onConfirm={handleMarkComplete}
          onCancel={() => setShowCompleteModal(false)}
        />
      )}

      {/* Suspended Modal */}
      {showSuspendedModal && (
        <SuspendedModal onClose={() => setShowSuspendedModal(false)} />
      )}
    </>
  );
}
