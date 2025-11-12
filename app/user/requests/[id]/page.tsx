"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function RequestDetailPage() {
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequest = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("requests")
        .select("*")
        .eq("id", params.id)
        .eq("user_id", user.id)
        .single();

      if (error || !data) {
        console.error("Error fetching request:", error);
        router.push("/user/requests");
        return;
      }

      setRequest(data);
      setLoading(false);
    };

    if (params.id) {
      fetchRequest();
    }
  }, [supabase, router, params.id]);

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
        <div className="mx-auto max-w-4xl p-6">
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
              <span
                className={`rounded-full px-3 py-1 text-sm font-medium ${getStatusColor(
                  request.status
                )}`}
              >
                {getStatusLabel(request.status)}
              </span>
            </div>

            {/* CSR Rep and Volunteer Info */}
            {request.accepted_by && (
              <div className="mb-6 space-y-4 rounded-lg bg-zinc-50 p-4">
                <div>
                  <div className="mb-1 text-xs font-medium text-black">
                    CSR Rep
                  </div>
                  <div className="text-sm font-semibold text-zinc-900">
                    {request.csr_rep_name || "Name"}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-zinc-200"></div>
                  <div>
                    <div className="mb-1 text-xs font-medium text-black">
                      Volunteer
                    </div>
                    <div className="text-sm font-semibold text-zinc-900">
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
              <div className="mb-2 text-sm font-medium text-black">
                Your Note
              </div>
              <p className="text-black">{request.description}</p>
            </div>

            {/* Additional Notes */}
            {request.additional_notes && (
              <div className="mb-6">
                <div className="mb-2 text-sm font-medium text-black">
                  Additional Notes
                </div>
                <p className="text-black">{request.additional_notes}</p>
              </div>
            )}

            {/* Attachments */}
            {request.attachments && request.attachments.length > 0 && (
              <div className="mb-6">
                <div className="mb-2 text-sm font-medium text-black">
                  Attachments
                </div>
                <div className="space-y-2">
                  {request.attachments.map((url: string, index: number) => (
                    <a
                      key={index}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-sm text-orange-600 hover:underline"
                    >
                      Attachment {index + 1}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="border-t border-zinc-200 pt-4">
              <div className="grid gap-4 text-sm md:grid-cols-2">
                <div>
                  <div className="text-xs font-medium text-black">
                    Created on
                  </div>
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
    </>
  );
}

