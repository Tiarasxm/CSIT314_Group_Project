"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function PlatformManagerDashboard() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRequests: 0,
    totalAnnouncements: 0,
    totalUsers: 0,
    totalCSRs: 0,
  });

  useEffect(() => {
    const getUser = async () => {
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

      if (userData?.role !== "platform-manager") {
        router.push("/staff/login");
        return;
      }

      setUser(userData || user);
      await fetchStats();
      setLoading(false);
    };

    getUser();
  }, [supabase, router]);

  const fetchStats = async () => {
    // Fetch requests and announcements counts
    const [requestsResult, announcementsResult] = await Promise.all([
      supabase.from("requests").select("*", { count: "exact", head: true }),
      supabase
        .from("announcements")
        .select("*", { count: "exact", head: true }),
    ]);

    // Use the safe RPC function to get user counts (bypasses RLS)
    const { data: userCounts, error: userCountsError } = await supabase.rpc(
      "get_user_counts"
    );

    if (userCountsError) {
      console.error("Error fetching user counts:", userCountsError);
    }

    setStats({
      totalRequests: requestsResult.count || 0,
      totalAnnouncements: announcementsResult.count || 0,
      totalUsers: Number(userCounts?.[0]?.total_users) || 0,
      totalCSRs: Number(userCounts?.[0]?.total_csrs) || 0,
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Welcome Banner */}
      <div className="mb-6 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white shadow-lg">
        <h1 className="text-2xl font-bold">
          Welcome, {user?.name || "Platform Manager"}!
        </h1>
        <p className="mt-1 text-orange-100">
          Manage your platform's categories, announcements, and view all service
          requests
        </p>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-600">
                Total Requests
              </p>
              <p className="mt-2 text-3xl font-bold text-zinc-900">
                {stats.totalRequests}
              </p>
            </div>
            <div className="rounded-full bg-blue-100 p-3">
              <svg
                className="h-6 w-6 text-blue-600"
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
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-600">Announcements</p>
              <p className="mt-2 text-3xl font-bold text-zinc-900">
                {stats.totalAnnouncements}
              </p>
            </div>
            <div className="rounded-full bg-purple-100 p-3">
              <svg
                className="h-6 w-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-600">Total Users</p>
              <p className="mt-2 text-3xl font-bold text-zinc-900">
                {stats.totalUsers}
              </p>
            </div>
            <div className="rounded-full bg-green-100 p-3">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-600">CSR Reps</p>
              <p className="mt-2 text-3xl font-bold text-zinc-900">
                {stats.totalCSRs}
              </p>
            </div>
            <div className="rounded-full bg-orange-100 p-3">
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
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-6">
        <h2 className="mb-4 text-xl font-bold text-zinc-900">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Link
            href="/platform-manager/categories"
            className="group rounded-lg border-2 border-zinc-200 bg-white p-6 shadow transition-all hover:border-orange-500 hover:shadow-lg"
          >
            <div className="mb-3 flex items-center gap-3">
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
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              <h3 className="text-lg font-semibold text-zinc-900">
                Manage Categories
              </h3>
            </div>
            <p className="text-sm text-zinc-600">
              Add, edit, or remove service categories available to all users
            </p>
            <div className="mt-4 flex items-center text-sm font-medium text-orange-600 group-hover:underline">
              Go to Categories
              <svg
                className="ml-1 h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </Link>

          <Link
            href="/platform-manager/announcements"
            className="group rounded-lg border-2 border-zinc-200 bg-white p-6 shadow transition-all hover:border-orange-500 hover:shadow-lg"
          >
            <div className="mb-3 flex items-center gap-3">
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
                  d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                />
              </svg>
              <h3 className="text-lg font-semibold text-zinc-900">
                Announcements
              </h3>
            </div>
            <p className="text-sm text-zinc-600">
              Create and manage announcements visible to all users
            </p>
            <div className="mt-4 flex items-center text-sm font-medium text-orange-600 group-hover:underline">
              Go to Announcements
              <svg
                className="ml-1 h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </Link>

          <Link
            href="/platform-manager/requests"
            className="group rounded-lg border-2 border-zinc-200 bg-white p-6 shadow transition-all hover:border-orange-500 hover:shadow-lg"
          >
            <div className="mb-3 flex items-center gap-3">
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="text-lg font-semibold text-zinc-900">
                View All Requests
              </h3>
            </div>
            <p className="text-sm text-zinc-600">
              View and export all service requests from all users
            </p>
            <div className="mt-4 flex items-center text-sm font-medium text-orange-600 group-hover:underline">
              Go to Requests
              <svg
                className="ml-1 h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
