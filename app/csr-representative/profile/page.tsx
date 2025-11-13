"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import SuspendedBanner from "@/components/ui/suspended-banner";

export default function CSRProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
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

      // Set profile image URL
      const imageUrl =
        userData.profile_image_url && userData.profile_image_url.trim() !== ""
          ? userData.profile_image_url
          : null;
      setProfileImageUrl(imageUrl);

      setLoading(false);
    };

    fetchData();
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
        className={`mx-auto max-w-4xl p-6 ${user?.is_suspended ? "mt-14" : ""}`}
      >
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-zinc-900">Profile</h1>
          <div className="rounded-lg bg-blue-50 px-4 py-2 text-sm text-blue-700">
            ℹ️ Profile editing is managed by User Admin
          </div>
        </div>

        <div>
          {/* Profile Picture (Read-Only) */}
          <div className="mb-8 flex justify-center">
            {profileImageUrl ? (
              <img
                src={profileImageUrl}
                alt="Profile"
                className="h-32 w-32 rounded-full object-cover border-2 border-zinc-200"
                onError={() => {
                  setProfileImageUrl(null);
                }}
              />
            ) : (
              <div className="h-32 w-32 rounded-full bg-zinc-200 flex items-center justify-center text-black text-4xl font-semibold">
                {user?.name ? user.name.charAt(0).toUpperCase() : "C"}
              </div>
            )}
          </div>

          {/* Basic Information */}
          <div className="mb-8 rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-lg font-semibold text-zinc-900">
              Basic Information
            </h2>

            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-600">
                    First Name
                  </label>
                  <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-900">
                    {user?.first_name || "Not specified"}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-600">
                    Last Name
                  </label>
                  <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-900">
                    {user?.last_name || "Not specified"}
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-600">
                  Email Address
                </label>
                <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-900">
                  {user?.email}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-600">
                  Phone Number
                </label>
                <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-900">
                  {user?.contact_number || "Not specified"}
                </div>
              </div>
            </div>
          </div>

          {/* Personal Details */}
          <div className="mb-8 rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-lg font-semibold text-zinc-900">
              Personal Details
            </h2>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-600">
                  Date of Birth
                </label>
                <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-900">
                  {user?.date_of_birth || "Not specified"}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-600">
                  Gender
                </label>
                <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-900">
                  {user?.gender || "Not specified"}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-600">
                  Language
                </label>
                <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-900">
                  {user?.language || "Not specified"}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-600">
                  Address
                </label>
                <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-900">
                  {user?.address || "Not specified"}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-600">
                  Medical Condition
                </label>
                <div className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-900 min-h-[100px]">
                  {user?.medical_condition || "Not specified"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
