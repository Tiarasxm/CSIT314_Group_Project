"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { exportRequestsToPDF } from "@/lib/utils/pdf-export";

interface Request {
  id: string;
  user_id: string;
  title: string;
  category: string;
  description: string;
  additional_notes: string | null;
  status: string;
  scheduled_at: string | null;
  created_at: string;
  accepted_by: string | null;
  volunteer_name: string | null;
  volunteer_mobile: string | null;
  volunteer_note: string | null;
  volunteer_image_url: string | null;
  attachments: string[] | null;
  user?: {
    name: string;
    email: string;
  };
  csr?: {
    name: string;
    email: string;
  };
}

export default function AllRequestsPage() {
  const supabase = createClient();
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequests, setSelectedRequests] = useState<Set<string>>(
    new Set()
  );
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);

    // First fetch all requests
    const { data: requestsData, error: requestsError } = await supabase
      .from("requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (requestsError) {
      console.error("Error fetching requests:", requestsError);
      setLoading(false);
      return;
    }

    // Fetch user data for all requests
    if (requestsData && requestsData.length > 0) {
      const userIds = [...new Set(requestsData.map((r) => r.user_id))];
      const csrIds = [
        ...new Set(requestsData.map((r) => r.accepted_by).filter(Boolean)),
      ];

      // Fetch users
      const { data: usersData } = await supabase
        .from("users")
        .select("id, name, email")
        .in("id", userIds);

      // Fetch CSR data using safe function
      const csrMap = new Map();
      for (const csrId of csrIds) {
        const { data: csrResult } = await supabase.rpc("get_csr_info", {
          csr_id: csrId,
        });

        if (csrResult && csrResult.length > 0) {
          csrMap.set(csrId, csrResult[0]);
        }
      }

      // Map user and CSR data to requests
      const userMap = new Map(usersData?.map((u) => [u.id, u]));
      requestsData.forEach((request: any) => {
        request.user = userMap.get(request.user_id);
        if (request.accepted_by) {
          request.csr = csrMap.get(request.accepted_by);
        }
      });
    }

    setRequests(requestsData || []);
    setLoading(false);
  };

  const handleSelectAll = () => {
    const filtered = getFilteredRequests();
    if (selectedRequests.size === filtered.length) {
      setSelectedRequests(new Set());
    } else {
      setSelectedRequests(new Set(filtered.map((r) => r.id)));
    }
  };

  const handleSelectRequest = (id: string) => {
    const newSelected = new Set(selectedRequests);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRequests(newSelected);
  };

  const handleExport = () => {
    if (selectedRequests.size === 0) {
      alert("Please select at least one request to export");
      return;
    }

    const requestsToExport = requests.filter((r) => selectedRequests.has(r.id));
    exportRequestsToPDF(requestsToExport);
  };

  const getFilteredRequests = () => {
    return requests.filter((request) => {
      // Filter by status
      if (filter !== "all" && request.status !== filter) return false;

      // Filter by search term
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return (
          request.title.toLowerCase().includes(search) ||
          request.category.toLowerCase().includes(search) ||
          request.user?.name.toLowerCase().includes(search) ||
          request.user?.email.toLowerCase().includes(search)
        );
      }

      return true;
    });
  };

  const filteredRequests = getFilteredRequests();

  const getStatusBadge = (status: string) => {
    const statusColors: { [key: string]: string } = {
      pending: "bg-yellow-100 text-yellow-800",
      accepted: "bg-blue-100 text-blue-800",
      "in-progress": "bg-purple-100 text-purple-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };

    return (
      <span
        className={`rounded-full px-2 py-1 text-xs font-medium ${
          statusColors[status] || "bg-zinc-100 text-zinc-800"
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">
          All Service Requests
        </h1>
        <p className="text-sm text-zinc-600">
          View and export all service requests from all users
        </p>
      </div>

      {/* Filters and Actions */}
      <div className="mb-6 rounded-lg bg-white p-4 shadow">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title, category, or user..."
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-black focus:border-orange-500 focus:outline-none"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-md border border-zinc-300 px-3 py-2 text-black focus:border-orange-500 focus:outline-none"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Export Button */}
          <button
            onClick={handleExport}
            disabled={selectedRequests.size === 0}
            className="rounded-md bg-orange-600 px-4 py-2 text-white transition-colors hover:bg-orange-700 disabled:opacity-50"
          >
            Export Selected ({selectedRequests.size})
          </button>
        </div>
      </div>

      {/* Results Summary */}
      <div className="mb-4 text-sm text-zinc-600">
        Showing {filteredRequests.length} of {requests.length} requests
      </div>

      {/* Requests Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-600 border-t-transparent"></div>
        </div>
      ) : (
        <div className="rounded-lg bg-white shadow">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-zinc-200 bg-zinc-50">
                <tr>
                  <th className="p-3 text-left">
                    <input
                      type="checkbox"
                      checked={
                        filteredRequests.length > 0 &&
                        selectedRequests.size === filteredRequests.length
                      }
                      onChange={handleSelectAll}
                      className="h-4 w-4 rounded border-zinc-300"
                    />
                  </th>
                  <th className="p-3 text-left text-sm font-medium text-zinc-700">
                    Title
                  </th>
                  <th className="p-3 text-left text-sm font-medium text-zinc-700">
                    User
                  </th>
                  <th className="p-3 text-left text-sm font-medium text-zinc-700">
                    Category
                  </th>
                  <th className="p-3 text-left text-sm font-medium text-zinc-700">
                    Status
                  </th>
                  <th className="p-3 text-left text-sm font-medium text-zinc-700">
                    Date
                  </th>
                  <th className="p-3 text-left text-sm font-medium text-zinc-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-zinc-600">
                      No requests found
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((request) => (
                    <React.Fragment key={request.id}>
                      <tr className="hover:bg-zinc-50">
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={selectedRequests.has(request.id)}
                            onChange={() => handleSelectRequest(request.id)}
                            className="h-4 w-4 rounded border-zinc-300"
                          />
                        </td>
                        <td className="p-3 text-sm text-zinc-900">
                          {request.title}
                        </td>
                        <td className="p-3 text-sm text-zinc-900">
                          <div>{request.user?.name || "Unknown"}</div>
                          <div className="text-xs text-zinc-500">
                            {request.user?.email || ""}
                          </div>
                        </td>
                        <td className="p-3 text-sm text-zinc-900">
                          {request.category}
                        </td>
                        <td className="p-3">
                          {getStatusBadge(request.status)}
                        </td>
                        <td className="p-3 text-sm text-zinc-600">
                          {new Date(request.created_at).toLocaleDateString()}
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() =>
                              setExpandedRequest(
                                expandedRequest === request.id
                                  ? null
                                  : request.id
                              )
                            }
                            className="text-sm text-orange-600 hover:underline"
                          >
                            {expandedRequest === request.id ? "Hide" : "View"}
                          </button>
                        </td>
                      </tr>
                      {expandedRequest === request.id && (
                        <tr>
                          <td colSpan={7} className="bg-zinc-50 p-6">
                            <div className="space-y-6">
                              {/* Request ID */}
                              <div>
                                <h4 className="mb-1 text-xs font-medium uppercase text-zinc-500">
                                  Request ID
                                </h4>
                                <p className="text-sm font-mono text-zinc-900">
                                  #{request.id.slice(0, 8)}
                                </p>
                              </div>

                              {/* Description */}
                              <div>
                                <h4 className="mb-2 font-semibold text-zinc-900">
                                  Description
                                </h4>
                                <p className="text-sm text-zinc-700">
                                  {request.description}
                                </p>
                              </div>

                              {/* Additional Notes */}
                              {request.additional_notes && (
                                <div>
                                  <h4 className="mb-2 font-semibold text-zinc-900">
                                    Additional Notes
                                  </h4>
                                  <p className="text-sm text-zinc-700">
                                    {request.additional_notes}
                                  </p>
                                </div>
                              )}

                              {/* Scheduled Time */}
                              {request.scheduled_at && (
                                <div>
                                  <h4 className="mb-2 font-semibold text-zinc-900">
                                    Scheduled Time
                                  </h4>
                                  <p className="text-sm text-zinc-700">
                                    {new Date(
                                      request.scheduled_at
                                    ).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}{" "}
                                    {new Date(
                                      request.scheduled_at
                                    ).toLocaleDateString()}
                                  </p>
                                </div>
                              )}

                              {/* CSR Representative */}
                              {request.csr && (
                                <div className="rounded-lg border border-zinc-200 bg-white p-4">
                                  <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
                                    CSR Representative
                                  </h4>
                                  <p className="text-sm font-semibold text-zinc-900">
                                    {request.csr.name}
                                  </p>
                                  <p className="text-sm text-zinc-600">
                                    {request.csr.email}
                                  </p>
                                </div>
                              )}

                              {/* Volunteer */}
                              {request.volunteer_name && (
                                <div className="rounded-lg border border-zinc-200 bg-white p-4">
                                  <h4 className="mb-3 text-xs font-medium uppercase tracking-wide text-zinc-500">
                                    Volunteer Assigned
                                  </h4>
                                  <div className="flex items-center gap-4">
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
                                      <p className="text-sm font-semibold text-zinc-900">
                                        {request.volunteer_name}
                                      </p>
                                      {request.volunteer_mobile && (
                                        <p className="text-sm text-zinc-600">
                                          +65 {request.volunteer_mobile}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  {request.volunteer_note && (
                                    <div className="mt-3 border-l-2 border-orange-300 pl-3">
                                      <p className="text-xs font-medium text-zinc-500">
                                        Note:
                                      </p>
                                      <p className="text-sm text-zinc-700">
                                        {request.volunteer_note}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Attachments */}
                              {request.attachments &&
                                request.attachments.length > 0 && (
                                  <div>
                                    <h4 className="mb-3 font-semibold text-zinc-900">
                                      Attachments ({request.attachments.length})
                                    </h4>
                                    <div className="grid grid-cols-2 gap-3">
                                      {request.attachments.map(
                                        (url: string, index: number) => {
                                          const isImage =
                                            /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(
                                              url
                                            );
                                          return (
                                            <div key={index}>
                                              {isImage ? (
                                                <a
                                                  href={url}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="block"
                                                >
                                                  <img
                                                    src={url}
                                                    alt={`Attachment ${
                                                      index + 1
                                                    }`}
                                                    className="h-48 w-full rounded-lg border border-zinc-200 object-cover transition-opacity hover:opacity-75"
                                                  />
                                                </a>
                                              ) : (
                                                <a
                                                  href={url}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white p-3 text-sm text-orange-600 transition-colors hover:bg-orange-50"
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
                                                      d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                                                    />
                                                  </svg>
                                                  View File
                                                </a>
                                              )}
                                            </div>
                                          );
                                        }
                                      )}
                                    </div>
                                  </div>
                                )}

                              {/* Created Date */}
                              <div className="border-t border-zinc-200 pt-3">
                                <p className="text-xs text-zinc-500">
                                  Submitted on{" "}
                                  {new Date(
                                    request.created_at
                                  ).toLocaleDateString()}{" "}
                                  at{" "}
                                  {new Date(
                                    request.created_at
                                  ).toLocaleTimeString()}
                                </p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
