"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import ConfirmationModal from "@/components/ui/confirmation-modal";

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);
  const [requestStats, setRequestStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
  });
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showReactivateModal, setShowReactivateModal] = useState(false);

  const userId = params?.id as string;

  useEffect(() => {
    const fetchData = async () => {
      // Check if current user is admin
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        router.push("/staff/login");
        return;
      }

      const { data: currentUserData } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (currentUserData?.role !== "user-admin") {
        router.push("/staff/login");
        return;
      }

      setCurrentUser(currentUserData);

      // Fetch user details
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (userError || !userData) {
        console.error("Error fetching user:", userError);
        router.push("/user-admin/users");
        return;
      }

      setUser(userData);

      // Fetch request statistics for regular users
      if (userData.role === "user") {
        const [totalResult, inProgressResult, completedResult, recentResult] =
          await Promise.all([
            supabase
              .from("requests")
              .select("*", { count: "exact", head: true })
              .eq("user_id", userId),
            supabase
              .from("requests")
              .select("*", { count: "exact", head: true })
              .eq("user_id", userId)
              .in("status", ["accepted", "in-progress"]),
            supabase
              .from("requests")
              .select("*", { count: "exact", head: true })
              .eq("user_id", userId)
              .eq("status", "completed"),
            supabase
              .from("requests")
              .select("*")
              .eq("user_id", userId)
              .order("created_at", { ascending: false })
              .limit(5),
          ]);

        // Debug logging
        if (totalResult.error) {
          console.error("Error fetching total requests:", totalResult.error);
        }
        if (inProgressResult.error) {
          console.error(
            "Error fetching in-progress requests:",
            inProgressResult.error
          );
        }
        if (completedResult.error) {
          console.error(
            "Error fetching completed requests:",
            completedResult.error
          );
        }
        if (recentResult.error) {
          console.error("Error fetching recent requests:", recentResult.error);
        }

        console.log("Request stats for user:", userId, {
          total: totalResult.count,
          inProgress: inProgressResult.count,
          completed: completedResult.count,
          recentCount: recentResult.data?.length,
        });

        setRequestStats({
          total: totalResult.count || 0,
          pending: inProgressResult.count || 0,
          completed: completedResult.count || 0,
        });
        setRequests(recentResult.data || []);
      }

      // Fetch CSR statistics
      if (userData.role === "csr-representative") {
        const [managedResult, inProgressResult, completedResult] =
          await Promise.all([
            supabase
              .from("requests")
              .select("*", { count: "exact", head: true })
              .eq("accepted_by", userId),
            supabase
              .from("requests")
              .select("*", { count: "exact", head: true })
              .eq("accepted_by", userId)
              .in("status", ["accepted", "in-progress"]),
            supabase
              .from("requests")
              .select("*", { count: "exact", head: true })
              .eq("accepted_by", userId)
              .eq("status", "completed"),
          ]);

        // Debug logging
        if (managedResult.error) {
          console.error(
            "Error fetching CSR managed requests:",
            managedResult.error
          );
        }
        if (inProgressResult.error) {
          console.error(
            "Error fetching CSR in-progress requests:",
            inProgressResult.error
          );
        }
        if (completedResult.error) {
          console.error(
            "Error fetching CSR completed requests:",
            completedResult.error
          );
        }

        console.log("CSR request stats for user:", userId, {
          total: managedResult.count,
          inProgress: inProgressResult.count,
          completed: completedResult.count,
        });

        setRequestStats({
          total: managedResult.count || 0,
          pending: inProgressResult.count || 0,
          completed: completedResult.count || 0,
        });
      }

      setLoading(false);
    };

    if (userId) {
      fetchData();
    }
  }, [supabase, router, userId]);

  const getRoleLabel = (role: string) => {
    const roleMap: { [key: string]: string } = {
      user: "Person in Need",
      "csr-representative": "CSR Representative",
      "platform-manager": "Platform Manager",
      "user-admin": "User Admin",
    };
    return roleMap[role] || role;
  };

  const handleSuspend = async () => {
    try {
      const { error } = await supabase
        .from("users")
        .update({ is_suspended: true })
        .eq("id", userId);

      if (error) {
        console.error("Error suspending user:", error);
        alert("Failed to suspend user. Please try again.");
        return;
      }

      setShowSuspendModal(false);
      setUser({ ...user, is_suspended: true });
      alert("User suspended successfully!");
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred. Please try again.");
    }
  };

  const handleReactivate = async () => {
    try {
      const { error } = await supabase
        .from("users")
        .update({ is_suspended: false })
        .eq("id", userId);

      if (error) {
        console.error("Error reactivating user:", error);
        alert("Failed to reactivate user. Please try again.");
        return;
      }

      setShowReactivateModal(false);
      setUser({ ...user, is_suspended: false });
      alert("User reactivated successfully!");
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred. Please try again.");
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

  if (!user) {
    return null;
  }

  const canSuspend =
    user.role !== "platform-manager" && user.role !== "user-admin";

  return (
    <>
      <div className="mx-auto max-w-7xl p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/user-admin/users"
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
            <h1 className="text-2xl font-bold text-zinc-900">
              User Management
            </h1>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* User Information Card */}
          <div className="rounded-lg bg-white p-6 shadow md:col-span-1">
            <h2 className="mb-4 text-lg font-semibold text-zinc-900">
              Personal Information
            </h2>

            <div className="mb-4 flex justify-center">
              {user.profile_image_url ? (
                <img
                  src={user.profile_image_url}
                  alt={user.name}
                  className="h-24 w-24 rounded-full object-cover"
                />
              ) : (
                <div className="h-24 w-24 rounded-full bg-zinc-200"></div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Name
                </div>
                <div className="mt-1 text-sm font-medium text-zinc-900">
                  {user.name ||
                    `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
                    "N/A"}
                </div>
              </div>

              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Role
                </div>
                <div className="mt-1 text-sm text-zinc-900">
                  {getRoleLabel(user.role)}
                </div>
              </div>

              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Email
                </div>
                <div className="mt-1 text-sm text-zinc-900">{user.email}</div>
              </div>

              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Status
                </div>
                <div className="mt-1">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                      user.is_suspended
                        ? "bg-red-100 text-red-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {user.is_suspended ? "Suspended" : "Active"}
                  </span>
                </div>
              </div>

              {user.contact_number && (
                <div>
                  <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Contact Number
                  </div>
                  <div className="mt-1 text-sm text-zinc-900">
                    +65 {user.contact_number}
                  </div>
                </div>
              )}

              {user.date_of_birth && (
                <div>
                  <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Date of Birth
                  </div>
                  <div className="mt-1 text-sm text-zinc-900">
                    {new Date(user.date_of_birth).toLocaleDateString()}
                  </div>
                </div>
              )}

              {user.gender && (
                <div>
                  <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Gender
                  </div>
                  <div className="mt-1 text-sm text-zinc-900">
                    {user.gender}
                  </div>
                </div>
              )}

              {user.language && (
                <div>
                  <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Language
                  </div>
                  <div className="mt-1 text-sm text-zinc-900">
                    {user.language}
                  </div>
                </div>
              )}

              {user.address && (
                <div>
                  <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Address
                  </div>
                  <div className="mt-1 text-sm text-zinc-900">
                    {user.address}
                  </div>
                </div>
              )}

              {user.medical_condition && (
                <div>
                  <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Medical Condition
                  </div>
                  <div className="mt-1 text-sm text-zinc-900">
                    {user.medical_condition}
                  </div>
                </div>
              )}

              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Date Joined
                </div>
                <div className="mt-1 text-sm text-zinc-900">
                  {new Date(user.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 space-y-2">
              {user.is_suspended ? (
                <button
                  onClick={() => setShowReactivateModal(true)}
                  className="w-full rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
                >
                  Reactivate Account
                </button>
              ) : canSuspend ? (
                <button
                  onClick={() => setShowSuspendModal(true)}
                  className="w-full rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
                >
                  Suspend Account
                </button>
              ) : null}
            </div>

            {!canSuspend && (
              <div className="mt-4 rounded-md bg-yellow-50 p-3">
                <p className="text-xs text-yellow-800">
                  Platform Manager and User Admin accounts cannot be suspended.
                </p>
              </div>
            )}
          </div>

          {/* Account Summary Card */}
          <div className="md:col-span-2">
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-lg font-semibold text-zinc-900">
                Account Summary
              </h2>

              {user.role === "user" && (
                <>
                  <div className="mb-6 grid gap-4 md:grid-cols-3">
                    <div className="rounded-lg bg-zinc-50 p-4">
                      <div className="text-sm text-zinc-600">
                        Request Managed
                      </div>
                      <div className="mt-1 text-2xl font-bold text-zinc-900">
                        {requestStats.total}
                      </div>
                    </div>
                    <div className="rounded-lg bg-zinc-50 p-4">
                      <div className="text-sm text-zinc-600">In-Progress</div>
                      <div className="mt-1 text-2xl font-bold text-zinc-900">
                        {requestStats.pending}
                      </div>
                    </div>
                    <div className="rounded-lg bg-zinc-50 p-4">
                      <div className="text-sm text-zinc-600">Completed</div>
                      <div className="mt-1 text-2xl font-bold text-zinc-900">
                        {requestStats.completed}
                      </div>
                    </div>
                  </div>

                  {/* Recent Requests */}
                  <div>
                    <h3 className="mb-3 text-base font-semibold text-zinc-900">
                      Recent Requests
                    </h3>
                    {requests.length > 0 ? (
                      <div className="space-y-2">
                        {requests.map((request) => (
                          <div
                            key={request.id}
                            className="flex items-center justify-between rounded-md border border-zinc-200 p-3"
                          >
                            <div>
                              <div className="text-sm font-medium text-zinc-900">
                                #{request.id.slice(0, 8)} -{" "}
                                {request.category || request.title}
                              </div>
                              <div className="text-xs text-zinc-500">
                                {new Date(
                                  request.created_at
                                ).toLocaleDateString()}
                              </div>
                            </div>
                            <span
                              className={`rounded-full px-2 py-1 text-xs font-semibold ${
                                request.status === "pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : request.status === "completed"
                                  ? "bg-green-100 text-green-800"
                                  : request.status === "accepted" ||
                                    request.status === "in-progress"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-zinc-100 text-zinc-800"
                              }`}
                            >
                              {request.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-zinc-500">No requests yet</p>
                    )}
                  </div>
                </>
              )}

              {user.role === "csr-representative" && (
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-lg bg-zinc-50 p-4">
                    <div className="text-sm text-zinc-600">Request Managed</div>
                    <div className="mt-1 text-2xl font-bold text-zinc-900">
                      {requestStats.total}
                    </div>
                  </div>
                  <div className="rounded-lg bg-zinc-50 p-4">
                    <div className="text-sm text-zinc-600">In-Progress</div>
                    <div className="mt-1 text-2xl font-bold text-zinc-900">
                      {requestStats.pending}
                    </div>
                  </div>
                  <div className="rounded-lg bg-zinc-50 p-4">
                    <div className="text-sm text-zinc-600">Completed</div>
                    <div className="mt-1 text-2xl font-bold text-zinc-900">
                      {requestStats.completed}
                    </div>
                  </div>
                </div>
              )}

              {(user.role === "platform-manager" ||
                user.role === "user-admin") && (
                <div className="rounded-md bg-zinc-50 p-4">
                  <p className="text-sm text-zinc-600">
                    No viewing details for Admin & Platform Manager
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Suspend Confirmation Modal */}
      {showSuspendModal && (
        <ConfirmationModal
          title="Suspend User Account"
          message={`Are you sure you want to suspend ${
            user.name || user.email
          }? They will not be able to access the system until reactivated.`}
          confirmText="Suspend"
          cancelText="Cancel"
          onConfirm={handleSuspend}
          onCancel={() => setShowSuspendModal(false)}
          isDestructive={true}
        />
      )}

      {/* Reactivate Confirmation Modal */}
      {showReactivateModal && (
        <ConfirmationModal
          title="Reactivate User Account"
          message={`Are you sure you want to reactivate ${
            user.name || user.email
          }? They will regain full access to the system.`}
          confirmText="Reactivate"
          cancelText="Cancel"
          onConfirm={handleReactivate}
          onCancel={() => setShowReactivateModal(false)}
          isDestructive={false}
        />
      )}
    </>
  );
}
