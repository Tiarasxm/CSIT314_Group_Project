"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function CSRRepresentativeDashboard() {
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

      if (userData?.role !== "csr-representative") {
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
              <p className="text-sm text-zinc-600">CSR Representative Dashboard</p>
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
          <h2 className="text-3xl font-bold text-black">
            CSR Representative Dashboard
          </h2>
          <p className="mt-2 text-zinc-600">
            Find volunteer opportunities for your corporate volunteers
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-xl font-semibold text-black">
              Available Requests
            </h3>
            <p className="mt-2 text-sm text-zinc-600">
              Browse requests from persons in need
            </p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-xl font-semibold text-black">
              Accepted Requests
            </h3>
            <p className="mt-2 text-sm text-zinc-600">
              View requests you've accepted on behalf of corporate volunteers
            </p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-xl font-semibold text-black">
              Corporate Volunteers
            </h3>
            <p className="mt-2 text-sm text-zinc-600">
              Manage your company's corporate volunteers
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-lg bg-green-50 p-4">
          <p className="text-sm text-green-800">
            <strong>Note:</strong> As a CSR Representative, you accept requests on
            behalf of your company's corporate volunteers (CVs). You find volunteer
            opportunities for them to fulfill.
          </p>
        </div>
      </main>
    </div>
  );
}

