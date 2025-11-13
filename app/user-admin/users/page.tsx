"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ConfirmationModal from "@/components/ui/confirmation-modal";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  first_name?: string;
  last_name?: string;
  is_suspended?: boolean;
  created_at: string;
};

export default function UserManagementPage() {
  const router = useRouter();
  const supabase = createClient();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showReactivateModal, setShowReactivateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const fetchUsers = useCallback(async () => {
    console.log("Fetching all users...");
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching users:", error);
    } else {
      console.log("Fetched users count:", data?.length);
      console.log("Users data:", data);
      setUsers(data || []);
      // Don't set filteredUsers here - let the useEffect handle it
    }
  }, [supabase]);

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/staff/login");
        return;
      }

      const { data: userData } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (userData?.role !== "user-admin") {
        router.push("/staff/login");
        return;
      }

      setCurrentUser(userData);
      await fetchUsers();
      setLoading(false);
    };

    checkUser();
  }, [supabase, router, fetchUsers]);

  useEffect(() => {
    let filtered = [...users];

    // Apply role filter
    if (roleFilter !== "All") {
      const roleMap: { [key: string]: string } = {
        PIN: "user",
        "CSR Rep": "csr-representative",
        PM: "platform-manager",
        "User Admin": "user-admin",
      };
      filtered = filtered.filter((user) => user.role === roleMap[roleFilter]);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.name?.toLowerCase().includes(query) ||
          user.email?.toLowerCase().includes(query) ||
          user.first_name?.toLowerCase().includes(query) ||
          user.last_name?.toLowerCase().includes(query)
      );
    }

    setFilteredUsers(filtered);
  }, [users, roleFilter, searchQuery]);

  const getRoleLabel = (role: string) => {
    const roleMap: { [key: string]: string } = {
      user: "PIN",
      "csr-representative": "CSR Rep",
      "platform-manager": "PM",
      "user-admin": "User Admin",
    };
    return roleMap[role] || role;
  };

  const getStatusLabel = (user: User) => {
    if (user.is_suspended) return "Suspended";
    return "Active";
  };

  const getStatusColor = (user: User) => {
    if (user.is_suspended) return "bg-red-100 text-red-800";
    return "bg-green-100 text-green-800";
  };

  const handleSuspendClick = (user: User) => {
    // Don't allow suspending platform managers or user admins
    if (user.role === "platform-manager" || user.role === "user-admin") {
      alert("Cannot suspend Platform Manager or User Admin accounts.");
      return;
    }
    setSelectedUser(user);
    setShowSuspendModal(true);
  };

  const handleReactivateClick = (user: User) => {
    setSelectedUser(user);
    setShowReactivateModal(true);
  };

  const handleConfirmSuspend = async () => {
    if (!selectedUser) return;

    try {
      const { error } = await supabase
        .from("users")
        .update({ is_suspended: true })
        .eq("id", selectedUser.id);

      if (error) {
        console.error("Error suspending user:", error);
        alert("Failed to suspend user. Please try again.");
        return;
      }

      setShowSuspendModal(false);
      setSelectedUser(null);
      await fetchUsers();
      alert("User suspended successfully!");
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred. Please try again.");
    }
  };

  const handleConfirmReactivate = async () => {
    if (!selectedUser) return;

    try {
      const { error } = await supabase
        .from("users")
        .update({ is_suspended: false })
        .eq("id", selectedUser.id);

      if (error) {
        console.error("Error reactivating user:", error);
        alert("Failed to reactivate user. Please try again.");
        return;
      }

      setShowReactivateModal(false);
      setSelectedUser(null);
      await fetchUsers();
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

  return (
    <>
      <div className="mx-auto max-w-7xl p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/user-admin/dashboard"
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

        {/* Search and Filter */}
        <div className="mb-6 flex gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by name or email..."
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
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-md border border-zinc-300 px-4 py-2 text-black focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          >
            <option value="All">All Roles</option>
            <option value="PIN">PIN</option>
            <option value="CSR Rep">CSR Rep</option>
            <option value="PM">PM</option>
            <option value="User Admin">User Admin</option>
          </select>
        </div>

        {/* Users Table */}
        <div className="rounded-lg bg-white shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-zinc-50 border-b border-zinc-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-700">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-700">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-700">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-700">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-700">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 bg-white">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-8 text-center text-zinc-500"
                    >
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-zinc-50">
                      <td className="px-6 py-4 text-sm font-medium text-zinc-900">
                        {user.name ||
                          `${user.first_name || ""} ${
                            user.last_name || ""
                          }`.trim() ||
                          "N/A"}
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-700">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-700">
                        {getRoleLabel(user.role)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusColor(
                            user
                          )}`}
                        >
                          {getStatusLabel(user)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/user-admin/users/${user.id}`}
                            className="rounded-md border border-orange-600 px-3 py-1 text-orange-600 transition-colors hover:bg-orange-50"
                          >
                            View
                          </Link>
                          {user.is_suspended ? (
                            <button
                              onClick={() => handleReactivateClick(user)}
                              className="rounded-md bg-green-600 px-3 py-1 text-white transition-colors hover:bg-green-700"
                            >
                              Reactivate
                            </button>
                          ) : user.role !== "platform-manager" &&
                            user.role !== "user-admin" ? (
                            <button
                              onClick={() => handleSuspendClick(user)}
                              className="rounded-md bg-red-600 px-3 py-1 text-white transition-colors hover:bg-red-700"
                            >
                              Suspend
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Suspend Confirmation Modal */}
      {showSuspendModal && selectedUser && (
        <ConfirmationModal
          title="Suspend User Account"
          message={`Are you sure you want to suspend ${
            selectedUser.name || selectedUser.email
          }? They will not be able to access the system until reactivated.`}
          confirmText="Suspend"
          cancelText="Cancel"
          onConfirm={handleConfirmSuspend}
          onCancel={() => {
            setShowSuspendModal(false);
            setSelectedUser(null);
          }}
          isDestructive={true}
        />
      )}

      {/* Reactivate Confirmation Modal */}
      {showReactivateModal && selectedUser && (
        <ConfirmationModal
          title="Reactivate User Account"
          message={`Are you sure you want to reactivate ${
            selectedUser.name || selectedUser.email
          }? They will regain full access to the system.`}
          confirmText="Reactivate"
          cancelText="Cancel"
          onConfirm={handleConfirmReactivate}
          onCancel={() => {
            setShowReactivateModal(false);
            setSelectedUser(null);
          }}
          isDestructive={false}
        />
      )}
    </>
  );
}
