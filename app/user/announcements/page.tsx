"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useUserData } from "@/lib/hooks/use-user-data";
import SuspendedBanner from "@/components/ui/suspended-banner";

export default function AnnouncementsPage() {
  const router = useRouter();
  const supabase = createClient();
  const { user } = useUserData();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Fetch announcements from database
      const { data: announcementsData, error } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching announcements:", error);
        setAnnouncements([]);
      } else {
        setAnnouncements(announcementsData || []);
      }

      setLoading(false);
    };

    fetchAnnouncements();
  }, [supabase, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <>
      {user?.is_suspended && <SuspendedBanner />}
      <div
        className={`mx-auto max-w-4xl p-6 ${user?.is_suspended ? "mt-14" : ""}`}
      >
        <h1 className="mb-6 text-2xl font-bold text-zinc-900">Announcements</h1>

        {announcements.length > 0 ? (
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <div
                key={announcement.id}
                className="rounded-lg bg-white p-6 shadow"
              >
                <h3 className="mb-2 text-lg font-semibold text-zinc-900">
                  {announcement.title}
                </h3>
                <p className="text-black">{announcement.content}</p>
                <p className="mt-2 text-xs text-black">
                  {new Date(announcement.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg bg-white p-8 text-center shadow">
            <p className="text-black">No announcements at this time</p>
          </div>
        )}
      </div>
    </>
  );
}
