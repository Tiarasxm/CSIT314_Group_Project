"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import SuspendedBanner from "@/components/ui/suspended-banner";

export default function CSRAnnouncementsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        router.push("/staff/login");
        return;
      }

      const { data: userData } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (userData?.role !== "csr-representative") {
        router.push("/staff/login");
        return;
      }

      setUser(userData);
      setLoading(false);
    };

    checkAuth();
  }, [supabase, router]);

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
      {user?.is_suspended && <SuspendedBanner />}
      <div
        className={`mx-auto max-w-7xl p-6 ${user?.is_suspended ? "mt-14" : ""}`}
      >
        <h1 className="mb-6 text-2xl font-bold text-black">Announcements</h1>
        <div className="rounded-lg bg-white p-8 text-center shadow">
          <p className="text-black">No announcements available</p>
        </div>
      </div>
    </>
  );
}
