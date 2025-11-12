"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function UserAdminDashboard() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
      setLoading(false);
    };

    getUser();
  }, [supabase, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/staff/login");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-black">CSR Platform</h1>
              <p className="text-sm text-zinc-600">User Admin Dashboard</p>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm text-zinc-700 transition-colors hover:bg-zinc-50"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-black">User Admin Dashboard</h2>
          <p className="mt-2 text-zinc-600">
            Manage user accounts and permissions
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-xl font-semibold text-black">All Users</h3>
            <p className="mt-2 text-sm text-zinc-600">
              View and manage all user accounts
            </p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-xl font-semibold text-black">Create User</h3>
            <p className="mt-2 text-sm text-zinc-600">
              Create new user accounts, including Platform Manager and User Admin
            </p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-xl font-semibold text-black">Role Management</h3>
            <p className="mt-2 text-sm text-zinc-600">
              Assign and modify user roles and permissions
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-lg bg-blue-50 p-4">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Only User Admins can manage user accounts. This
            includes creating Platform Manager and User Admin accounts.
          </p>
        </div>
      </main>
    </div>
  );
}

