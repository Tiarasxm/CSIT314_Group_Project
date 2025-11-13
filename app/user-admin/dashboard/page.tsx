"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function UserAdminDashboard() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    personInNeed: 0,
    csrRepresentative: 0,
    platformManager: 0,
    userAdmin: 0,
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

      if (userData?.role !== "user-admin") {
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
    try {
      const [pinResult, csrResult, pmResult, adminResult] = await Promise.all([
        supabase
          .from("users")
          .select("*", { count: "exact", head: true })
          .eq("role", "user"),
        supabase
          .from("users")
          .select("*", { count: "exact", head: true })
          .eq("role", "csr-representative"),
        supabase
          .from("users")
          .select("*", { count: "exact", head: true })
          .eq("role", "platform-manager"),
        supabase
          .from("users")
          .select("*", { count: "exact", head: true })
          .eq("role", "user-admin"),
      ]);

      setStats({
        personInNeed: pinResult.count || 0,
        csrRepresentative: csrResult.count || 0,
        platformManager: pmResult.count || 0,
        userAdmin: adminResult.count || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/staff/login");
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
    <div className="mx-auto max-w-7xl p-6">
      {/* Welcome Banner */}
      <div className="mb-8 rounded-lg bg-orange-500 p-6 text-white">
        <h2 className="mb-2 text-2xl font-bold">Welcome, Admin!</h2>
        <p className="text-orange-50">
          Manage all system users and monitor account activities.
        </p>
        <button
          onClick={handleLogout}
          className="mt-4 rounded-md bg-white px-4 py-2 text-sm font-medium text-orange-600 transition-colors hover:bg-orange-50"
        >
          Log Out
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="text-sm font-medium text-zinc-600">Person in Need</div>
          <div className="mt-2 text-3xl font-bold text-zinc-900">{stats.personInNeed}</div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="text-sm font-medium text-zinc-600">CSR Representative</div>
          <div className="mt-2 text-3xl font-bold text-zinc-900">{stats.csrRepresentative}</div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="text-sm font-medium text-zinc-600">Platform Manager</div>
          <div className="mt-2 text-3xl font-bold text-zinc-900">{stats.platformManager}</div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <div className="text-sm font-medium text-zinc-600">User Admin</div>
          <div className="mt-2 text-3xl font-bold text-zinc-900">{stats.userAdmin}</div>
        </div>
      </div>

      {/* User Management Section */}
      <div className="rounded-lg bg-white p-6 shadow">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-semibold text-zinc-900">User Management</h3>
          <Link
            href="/user-admin/users"
            className="rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-700"
          >
            View All Users
          </Link>
        </div>
        <p className="text-sm text-zinc-600">
          View, suspend, and reactivate user accounts across all roles.
        </p>
      </div>
    </div>
  );
}

