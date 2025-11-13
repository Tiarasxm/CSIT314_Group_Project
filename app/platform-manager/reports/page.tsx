"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { exportReportsToPDF } from "@/lib/utils/reports-pdf-export";

interface ReportStats {
  // User Statistics
  totalCSRReps: number;
  csrAccountsCreated: number;
  csrActive: number;
  csrSuspended: number;
  totalPIN: number;
  pinAccountsCreated: number;
  pinActive: number;
  pinSuspended: number;

  // Request Statistics
  totalRequests: number;
  unassignedRequests: number;
  pendingRequests: number;
  completedRequests: number;
  fulfillmentRate: number;

  // Category Breakdown (dynamic)
  categoryBreakdown: { [categoryName: string]: number };
}

export default function PlatformReportsPage() {
  const supabase = createClient();
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState("all");

  useEffect(() => {
    fetchReports();
  }, [dateFilter]);

  const fetchReports = async () => {
    setLoading(true);

    try {
      // Fetch user statistics using safe RPC function (bypasses RLS)
      const { data: userCounts, error: userCountsError } = await supabase.rpc(
        "get_user_counts"
      );

      if (userCountsError) {
        console.error("Error fetching user counts:", userCountsError);
      }

      // Try to fetch suspended counts (may be blocked by RLS, default to 0)
      let suspendedUsersCount = 0;
      let suspendedCSRsCount = 0;
      try {
        const [usersResult, csrResult] = await Promise.all([
          supabase
            .from("users")
            .select("*", { count: "exact", head: true })
            .eq("role", "user")
            .eq("is_suspended", true),
          supabase
            .from("users")
            .select("*", { count: "exact", head: true })
            .eq("role", "csr-representative")
            .eq("is_suspended", true),
        ]);
        suspendedUsersCount = usersResult.count || 0;
        suspendedCSRsCount = csrResult.count || 0;
      } catch (error) {
        console.error("Error fetching suspended counts:", error);
      }

      // Fetch request statistics
      let requestQuery = supabase.from("requests").select("*");

      // Apply date filter
      if (dateFilter !== "all") {
        const now = new Date();
        let startDate = new Date();

        if (dateFilter === "7days") {
          startDate.setDate(now.getDate() - 7);
        } else if (dateFilter === "30days") {
          startDate.setDate(now.getDate() - 30);
        } else if (dateFilter === "90days") {
          startDate.setDate(now.getDate() - 90);
        }

        requestQuery = requestQuery.gte("created_at", startDate.toISOString());
      }

      const { data: requests, error: requestsError } = await requestQuery;

      if (requestsError) {
        console.error("Error fetching requests:", requestsError);
        return;
      }

      // Calculate statistics
      const totalRequests = requests?.length || 0;
      const pendingRequests =
        requests?.filter((r) => r.status === "pending").length || 0;
      const completedRequests =
        requests?.filter((r) => r.status === "completed").length || 0;
      const unassignedRequests =
        requests?.filter((r) => !r.accepted_by).length || 0;
      const fulfillmentRate =
        totalRequests > 0
          ? Math.round((completedRequests / totalRequests) * 100)
          : 0;

      // Fetch all categories from database
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("categories")
        .select("name")
        .eq("is_active", true)
        .order("display_order", { ascending: true });

      if (categoriesError) {
        console.error("Error fetching categories:", categoriesError);
      }

      // Build dynamic category breakdown
      const categoryBreakdown: { [categoryName: string]: number } = {};
      if (categoriesData && requests) {
        categoriesData.forEach((cat) => {
          const count = requests.filter((r) => r.category === cat.name).length;
          categoryBreakdown[cat.name] = count;
        });
      }

      // Extract user counts from RPC result
      const totalCSRs = Number(userCounts?.[0]?.total_csrs) || 0;
      const totalUsers = Number(userCounts?.[0]?.total_users) || 0;

      setStats({
        totalCSRReps: totalCSRs,
        csrAccountsCreated: totalCSRs,
        csrActive: totalCSRs - suspendedCSRsCount,
        csrSuspended: suspendedCSRsCount,
        totalPIN: totalUsers,
        pinAccountsCreated: totalUsers,
        pinActive: totalUsers - suspendedUsersCount,
        pinSuspended: suspendedUsersCount,
        totalRequests,
        unassignedRequests,
        pendingRequests,
        completedRequests,
        fulfillmentRate,
        categoryBreakdown,
      });
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    if (!stats) return;
    exportReportsToPDF(stats, dateFilter);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6">
        <p className="text-zinc-600">Failed to load reports</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Platform Reports</h1>
          <p className="text-sm text-zinc-600">
            Analytics and insights for the platform
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Date Filter */}
          <button
            onClick={() => setDateFilter("all")}
            className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
              dateFilter === "all"
                ? "bg-orange-600 text-white"
                : "border border-zinc-300 text-zinc-700 hover:bg-zinc-50"
            }`}
          >
            All Time
          </button>
          <button
            onClick={() => setDateFilter("7days")}
            className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
              dateFilter === "7days"
                ? "bg-orange-600 text-white"
                : "border border-zinc-300 text-zinc-700 hover:bg-zinc-50"
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setDateFilter("30days")}
            className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
              dateFilter === "30days"
                ? "bg-orange-600 text-white"
                : "border border-zinc-300 text-zinc-700 hover:bg-zinc-50"
            }`}
          >
            Last 30 Days
          </button>
          <button
            onClick={() => setDateFilter("90days")}
            className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
              dateFilter === "90days"
                ? "bg-orange-600 text-white"
                : "border border-zinc-300 text-zinc-700 hover:bg-zinc-50"
            }`}
          >
            Last 90 Days
          </button>
        </div>
      </div>

      {/* User Statistics */}
      <div className="mb-6 rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900">
          User Statistics
        </h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="mb-3 text-sm font-medium text-zinc-600">
              Total CSR Reps
            </div>
            <div className="text-3xl font-bold text-zinc-900">
              {stats.totalCSRReps}
            </div>
            <div className="mt-2 space-y-1 text-sm text-zinc-600">
              <div className="flex justify-between">
                <span>Account Created</span>
                <span className="font-medium">{stats.csrAccountsCreated}</span>
              </div>
              <div className="flex justify-between">
                <span>Active</span>
                <span className="font-medium text-green-600">
                  {stats.csrActive}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Suspended</span>
                <span className="font-medium text-red-600">
                  {stats.csrSuspended}
                </span>
              </div>
            </div>
          </div>
          <div>
            <div className="mb-3 text-sm font-medium text-zinc-600">
              Total PIN
            </div>
            <div className="text-3xl font-bold text-zinc-900">
              {stats.totalPIN}
            </div>
            <div className="mt-2 space-y-1 text-sm text-zinc-600">
              <div className="flex justify-between">
                <span>Account Created</span>
                <span className="font-medium">{stats.pinAccountsCreated}</span>
              </div>
              <div className="flex justify-between">
                <span>Active</span>
                <span className="font-medium text-green-600">
                  {stats.pinActive}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Suspended</span>
                <span className="font-medium text-red-600">
                  {stats.pinSuspended}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* All Requests */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900">
            All Requests
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-600">Total Requests:</span>
              <span className="text-lg font-bold text-zinc-900">
                {stats.totalRequests}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-600">Unassigned:</span>
              <span className="text-lg font-bold text-zinc-900">
                {stats.unassignedRequests}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-600">Pending:</span>
              <span className="text-lg font-bold text-zinc-900">
                {stats.pendingRequests}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-600">Completed:</span>
              <span className="text-lg font-bold text-zinc-900">
                {stats.completedRequests}
              </span>
            </div>
            <div className="mt-4 border-t border-zinc-200 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-600">
                  Fulfillment Rate:
                </span>
                <span className="text-xl font-bold text-orange-600">
                  {stats.fulfillmentRate}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Request by Category */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900">
            Request by Category
          </h2>
          <div className="space-y-3">
            {Object.entries(stats.categoryBreakdown).map(
              ([category, count]) => (
                <div
                  key={category}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm text-zinc-600">{category}:</span>
                  <span className="text-lg font-bold text-zinc-900">
                    {count}
                  </span>
                </div>
              )
            )}
            {Object.keys(stats.categoryBreakdown).length === 0 && (
              <p className="text-sm text-zinc-500">No categories found</p>
            )}
          </div>
        </div>
      </div>

      {/* Export Button */}
      <div className="mt-6 flex justify-center">
        <button
          onClick={handleExportPDF}
          className="rounded-md border-2 border-orange-600 bg-white px-6 py-3 font-semibold text-orange-600 transition-colors hover:bg-orange-50"
        >
          Export Reports
        </button>
      </div>
    </div>
  );
}
