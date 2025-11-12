"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function PlatformManagerDashboard() {
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

      if (userData?.role !== "platform-manager") {
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
              <p className="text-sm text-zinc-600">Platform Manager Dashboard</p>
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
            Platform Manager Dashboard
          </h2>
          <p className="mt-2 text-zinc-600">
            Manage the website and platform settings
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-xl font-semibold text-black">
              Website Settings
            </h3>
            <p className="mt-2 text-sm text-zinc-600">
              Configure website content, themes, and general settings
            </p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-xl font-semibold text-black">
              Platform Analytics
            </h3>
            <p className="mt-2 text-sm text-zinc-600">
              View platform usage statistics and metrics
            </p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-xl font-semibold text-black">
              Content Management
            </h3>
            <p className="mt-2 text-sm text-zinc-600">
              Manage website content, pages, and announcements
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-lg bg-yellow-50 p-4">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> Platform Managers manage the website, NOT user
            accounts. User accounts are managed by User Admins.
          </p>
        </div>
      </main>
    </div>
  );
}

