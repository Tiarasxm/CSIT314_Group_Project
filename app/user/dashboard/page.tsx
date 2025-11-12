"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function UserDashboard() {
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
        router.push("/login");
        return;
      }

      // Get user data from users table
      const { data: userData } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      setUser(userData || user);
      setLoading(false);
    };

    getUser();
  }, [supabase, router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
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
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-black">CSR Platform</h1>
              <p className="text-sm text-zinc-600">User Dashboard</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-zinc-600">
                {user?.name || user?.email}
              </span>
              <button
                onClick={handleLogout}
                className="rounded-md border border-zinc-300 px-4 py-2 text-sm text-zinc-700 transition-colors hover:bg-zinc-50"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-black">My Requests</h2>
          <p className="mt-2 text-zinc-600">
            Submit and track your requests for help
          </p>
        </div>

        <div className="mb-6">
          <button className="rounded-md bg-black px-6 py-3 text-white transition-colors hover:bg-zinc-800">
            Submit New Request
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-xl font-semibold text-black">
              Pending Requests
            </h3>
            <p className="mt-2 text-sm text-zinc-600">
              Requests waiting for acceptance
            </p>
            <p className="mt-4 text-2xl font-bold text-zinc-900">0</p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-xl font-semibold text-black">
              Accepted Requests
            </h3>
            <p className="mt-2 text-sm text-zinc-600">
              Requests accepted by CSR representatives
            </p>
            <p className="mt-4 text-2xl font-bold text-zinc-900">0</p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-xl font-semibold text-black">
              Completed Requests
            </h3>
            <p className="mt-2 text-sm text-zinc-600">
              Requests that have been fulfilled
            </p>
            <p className="mt-4 text-2xl font-bold text-zinc-900">0</p>
          </div>
        </div>
      </main>
    </div>
  );
}

