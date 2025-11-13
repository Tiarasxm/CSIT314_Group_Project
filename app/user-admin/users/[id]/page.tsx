"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import ConfirmationModal from "@/components/ui/confirmation-modal";

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const supabase = createClient();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);
  const [requestStats, setRequestStats] = useState({
    total: 0,
    pending: 0,
    completed: 0,
  });
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showReactivateModal, setShowReactivateModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    contact_number: "",
    date_of_birth: "",
    gender: "",
    language: "",
    address: "",
    medical_condition: "",
    profile_image_url: "",
  });

  const userId = params?.id as string;

  useEffect(() => {
    const fetchData = async () => {
      // Check if current user is admin
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        router.push("/staff/login");
        return;
      }

      const { data: currentUserData } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (currentUserData?.role !== "user-admin") {
        router.push("/staff/login");
        return;
      }

      setCurrentUser(currentUserData);

      // Fetch user details
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (userError || !userData) {
        console.error("Error fetching user:", userError);
        router.push("/user-admin/users");
        return;
      }

      setUser(userData);

      // Initialize form data for editing
      setFormData({
        first_name: userData.first_name || "",
        last_name: userData.last_name || "",
        contact_number: userData.contact_number || "",
        date_of_birth: userData.date_of_birth || "",
        gender: userData.gender || "",
        language: userData.language || "",
        address: userData.address || "",
        medical_condition: userData.medical_condition || "",
        profile_image_url: userData.profile_image_url || "",
      });

      // Fetch request statistics for regular users
      if (userData.role === "user") {
        const [totalResult, inProgressResult, completedResult, recentResult] =
          await Promise.all([
            supabase
              .from("requests")
              .select("*", { count: "exact", head: true })
              .eq("user_id", userId),
            supabase
              .from("requests")
              .select("*", { count: "exact", head: true })
              .eq("user_id", userId)
              .in("status", ["accepted", "in-progress"]),
            supabase
              .from("requests")
              .select("*", { count: "exact", head: true })
              .eq("user_id", userId)
              .eq("status", "completed"),
            supabase
              .from("requests")
              .select("*")
              .eq("user_id", userId)
              .order("created_at", { ascending: false })
              .limit(5),
          ]);

        // Debug logging
        if (totalResult.error) {
          console.error("Error fetching total requests:", totalResult.error);
        }
        if (inProgressResult.error) {
          console.error(
            "Error fetching in-progress requests:",
            inProgressResult.error
          );
        }
        if (completedResult.error) {
          console.error(
            "Error fetching completed requests:",
            completedResult.error
          );
        }
        if (recentResult.error) {
          console.error("Error fetching recent requests:", recentResult.error);
        }

        console.log("Request stats for user:", userId, {
          total: totalResult.count,
          inProgress: inProgressResult.count,
          completed: completedResult.count,
          recentCount: recentResult.data?.length,
        });

        setRequestStats({
          total: totalResult.count || 0,
          pending: inProgressResult.count || 0,
          completed: completedResult.count || 0,
        });
        setRequests(recentResult.data || []);
      }

      // Fetch CSR statistics
      if (userData.role === "csr-representative") {
        const [managedResult, inProgressResult, completedResult] =
          await Promise.all([
            supabase
              .from("requests")
              .select("*", { count: "exact", head: true })
              .eq("accepted_by", userId),
            supabase
              .from("requests")
              .select("*", { count: "exact", head: true })
              .eq("accepted_by", userId)
              .in("status", ["accepted", "in-progress"]),
            supabase
              .from("requests")
              .select("*", { count: "exact", head: true })
              .eq("accepted_by", userId)
              .eq("status", "completed"),
          ]);

        // Debug logging
        if (managedResult.error) {
          console.error(
            "Error fetching CSR managed requests:",
            managedResult.error
          );
        }
        if (inProgressResult.error) {
          console.error(
            "Error fetching CSR in-progress requests:",
            inProgressResult.error
          );
        }
        if (completedResult.error) {
          console.error(
            "Error fetching CSR completed requests:",
            completedResult.error
          );
        }

        console.log("CSR request stats for user:", userId, {
          total: managedResult.count,
          inProgress: inProgressResult.count,
          completed: completedResult.count,
        });

        setRequestStats({
          total: managedResult.count || 0,
          pending: inProgressResult.count || 0,
          completed: completedResult.count || 0,
        });
      }

      setLoading(false);
    };

    if (userId) {
      fetchData();
    }
  }, [supabase, router, userId]);

  const getRoleLabel = (role: string) => {
    const roleMap: { [key: string]: string } = {
      user: "Person in Need",
      "csr-representative": "CSR Representative",
      "platform-manager": "Platform Manager",
      "user-admin": "User Admin",
    };
    return roleMap[role] || role;
  };

  const handleSuspend = async () => {
    try {
      const { error } = await supabase
        .from("users")
        .update({ is_suspended: true })
        .eq("id", userId);

      if (error) {
        console.error("Error suspending user:", error);
        alert("Failed to suspend user. Please try again.");
        return;
      }

      setShowSuspendModal(false);
      setUser({ ...user, is_suspended: true });
      alert("User suspended successfully!");
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred. Please try again.");
    }
  };

  const handleReactivate = async () => {
    try {
      const { error } = await supabase
        .from("users")
        .update({ is_suspended: false })
        .eq("id", userId);

      if (error) {
        console.error("Error reactivating user:", error);
        alert("Failed to reactivate user. Please try again.");
        return;
      }

      setShowReactivateModal(false);
      setUser({ ...user, is_suspended: false });
      alert("User reactivated successfully!");
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred. Please try again.");
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image size must be less than 5MB");
      return;
    }

    setUploadingImage(true);

    try {
      // Delete old image if exists
      if (
        formData.profile_image_url &&
        formData.profile_image_url.includes("/profile-images/")
      ) {
        try {
          const urlParts = formData.profile_image_url.split("/profile-images/");
          if (urlParts.length > 1) {
            const filePath = urlParts[1].split("?")[0];
            await supabase.storage.from("profile-images").remove([filePath]);
          }
        } catch (error) {
          console.warn("Could not delete old image:", error);
        }
      }

      // Upload new image
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}/${Date.now()}_${Math.random()
        .toString(36)
        .substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("profile-images")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("Error uploading image:", uploadError);
        alert("Failed to upload image. Please try again.");
        setUploadingImage(false);
        return;
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("profile-images").getPublicUrl(fileName);

      setFormData((prev) => ({ ...prev, profile_image_url: publicUrl }));
      setUploadingImage(false);
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred. Please try again.");
      setUploadingImage(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);

    try {
      // Construct full name
      const fullName =
        [formData.first_name, formData.last_name]
          .filter(Boolean)
          .join(" ")
          .trim() || null;

      // Update user profile
      const { error } = await supabase
        .from("users")
        .update({
          name: fullName,
          first_name: formData.first_name,
          last_name: formData.last_name,
          contact_number: formData.contact_number || null,
          date_of_birth: formData.date_of_birth || null,
          gender: formData.gender || null,
          language: formData.language || null,
          address: formData.address || null,
          medical_condition: formData.medical_condition || null,
          profile_image_url: formData.profile_image_url || null,
        })
        .eq("id", userId);

      if (error) {
        console.error("Error updating profile:", error);
        alert("Failed to update profile. Please try again.");
        setSaving(false);
        return;
      }

      // Refetch user data
      const { data: updatedUser } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (updatedUser) {
        setUser(updatedUser);
      }

      setIsEditing(false);
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    // Reset form data to current user data
    setFormData({
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      contact_number: user.contact_number || "",
      date_of_birth: user.date_of_birth || "",
      gender: user.gender || "",
      language: user.language || "",
      address: user.address || "",
      medical_condition: user.medical_condition || "",
      profile_image_url: user.profile_image_url || "",
    });
    setIsEditing(false);
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

  if (!user) {
    return null;
  }

  const canSuspend =
    user.role !== "platform-manager" && user.role !== "user-admin";

  return (
    <>
      <div className="mx-auto max-w-7xl p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/user-admin/users"
              className="text-black hover:text-orange-600"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </Link>
            <h1 className="text-2xl font-bold text-zinc-900">
              User Management
            </h1>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* User Information Card */}
          <div className="rounded-lg bg-white p-6 shadow md:col-span-1">
            <h2 className="mb-4 text-lg font-semibold text-zinc-900">
              Personal Information
            </h2>

            <div className="mb-4 flex justify-center">
              <div className="relative">
                {(
                  isEditing
                    ? formData.profile_image_url
                    : user.profile_image_url
                ) ? (
                  <img
                    src={
                      isEditing
                        ? formData.profile_image_url
                        : user.profile_image_url
                    }
                    alt={user.name}
                    className="h-24 w-24 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-24 w-24 rounded-full bg-zinc-200"></div>
                )}
                {isEditing && user.role === "csr-representative" && (
                  <label className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-orange-500 shadow-md transition-colors hover:bg-orange-600">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                    {uploadingImage ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    ) : (
                      <svg
                        className="h-4 w-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    )}
                  </label>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {isEditing && user.role === "csr-representative" ? (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                        First Name
                      </label>
                      <input
                        type="text"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleInputChange}
                        className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                        Last Name
                      </label>
                      <input
                        type="text"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleInputChange}
                        className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Name
                  </div>
                  <div className="mt-1 text-sm font-medium text-zinc-900">
                    {user.name ||
                      `${user.first_name || ""} ${
                        user.last_name || ""
                      }`.trim() ||
                      "N/A"}
                  </div>
                </div>
              )}

              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Role
                </div>
                <div className="mt-1 text-sm text-zinc-900">
                  {getRoleLabel(user.role)}
                </div>
              </div>

              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Email
                </div>
                <div className="mt-1 text-sm text-zinc-900">{user.email}</div>
              </div>

              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Status
                </div>
                <div className="mt-1">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                      user.is_suspended
                        ? "bg-red-100 text-red-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {user.is_suspended ? "Suspended" : "Active"}
                  </span>
                </div>
              </div>

              {isEditing && user.role === "csr-representative" ? (
                <>
                  <div>
                    <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                      Contact Number
                    </label>
                    <input
                      type="tel"
                      name="contact_number"
                      value={formData.contact_number}
                      onChange={handleInputChange}
                      placeholder="+65"
                      className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      name="date_of_birth"
                      value={formData.date_of_birth}
                      onChange={handleInputChange}
                      className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                      Gender
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
                    >
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">
                        Prefer not to say
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                      Language
                    </label>
                    <input
                      type="text"
                      name="language"
                      value={formData.language}
                      onChange={handleInputChange}
                      className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                      Address
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                      Medical Condition
                    </label>
                    <textarea
                      name="medical_condition"
                      value={formData.medical_condition}
                      onChange={handleInputChange}
                      rows={3}
                      className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
                    />
                  </div>
                </>
              ) : (
                <>
                  {user.contact_number && (
                    <div>
                      <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                        Contact Number
                      </div>
                      <div className="mt-1 text-sm text-zinc-900">
                        +65 {user.contact_number}
                      </div>
                    </div>
                  )}

                  {user.date_of_birth && (
                    <div>
                      <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                        Date of Birth
                      </div>
                      <div className="mt-1 text-sm text-zinc-900">
                        {new Date(user.date_of_birth).toLocaleDateString()}
                      </div>
                    </div>
                  )}

                  {user.gender && (
                    <div>
                      <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                        Gender
                      </div>
                      <div className="mt-1 text-sm text-zinc-900">
                        {user.gender}
                      </div>
                    </div>
                  )}

                  {user.language && (
                    <div>
                      <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                        Language
                      </div>
                      <div className="mt-1 text-sm text-zinc-900">
                        {user.language}
                      </div>
                    </div>
                  )}

                  {user.address && (
                    <div>
                      <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                        Address
                      </div>
                      <div className="mt-1 text-sm text-zinc-900">
                        {user.address}
                      </div>
                    </div>
                  )}

                  {user.medical_condition && (
                    <div>
                      <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                        Medical Condition
                      </div>
                      <div className="mt-1 text-sm text-zinc-900">
                        {user.medical_condition}
                      </div>
                    </div>
                  )}
                </>
              )}

              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Date Joined
                </div>
                <div className="mt-1 text-sm text-zinc-900">
                  {new Date(user.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 space-y-2">
              {isEditing && user.role === "csr-representative" ? (
                <>
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="w-full rounded-md bg-orange-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-700 disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    disabled={saving}
                    className="w-full rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  {user.role === "csr-representative" && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                    >
                      Edit Profile
                    </button>
                  )}
                  {user.is_suspended ? (
                    <button
                      onClick={() => setShowReactivateModal(true)}
                      className="w-full rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
                    >
                      Reactivate Account
                    </button>
                  ) : canSuspend ? (
                    <button
                      onClick={() => setShowSuspendModal(true)}
                      className="w-full rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
                    >
                      Suspend Account
                    </button>
                  ) : null}
                </>
              )}
            </div>

            {!canSuspend && (
              <div className="mt-4 rounded-md bg-yellow-50 p-3">
                <p className="text-xs text-yellow-800">
                  Platform Manager and User Admin accounts cannot be suspended.
                </p>
              </div>
            )}
          </div>

          {/* Account Summary Card */}
          <div className="md:col-span-2">
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-lg font-semibold text-zinc-900">
                Account Summary
              </h2>

              {user.role === "user" && (
                <>
                  <div className="mb-6 grid gap-4 md:grid-cols-3">
                    <div className="rounded-lg bg-zinc-50 p-4">
                      <div className="text-sm text-zinc-600">
                        Request Managed
                      </div>
                      <div className="mt-1 text-2xl font-bold text-zinc-900">
                        {requestStats.total}
                      </div>
                    </div>
                    <div className="rounded-lg bg-zinc-50 p-4">
                      <div className="text-sm text-zinc-600">In-Progress</div>
                      <div className="mt-1 text-2xl font-bold text-zinc-900">
                        {requestStats.pending}
                      </div>
                    </div>
                    <div className="rounded-lg bg-zinc-50 p-4">
                      <div className="text-sm text-zinc-600">Completed</div>
                      <div className="mt-1 text-2xl font-bold text-zinc-900">
                        {requestStats.completed}
                      </div>
                    </div>
                  </div>

                  {/* Recent Requests */}
                  <div>
                    <h3 className="mb-3 text-base font-semibold text-zinc-900">
                      Recent Requests
                    </h3>
                    {requests.length > 0 ? (
                      <div className="space-y-2">
                        {requests.map((request) => (
                          <div
                            key={request.id}
                            className="flex items-center justify-between rounded-md border border-zinc-200 p-3"
                          >
                            <div>
                              <div className="text-sm font-medium text-zinc-900">
                                #{request.id.slice(0, 8)} -{" "}
                                {request.category || request.title}
                              </div>
                              <div className="text-xs text-zinc-500">
                                {new Date(
                                  request.created_at
                                ).toLocaleDateString()}
                              </div>
                            </div>
                            <span
                              className={`rounded-full px-2 py-1 text-xs font-semibold ${
                                request.status === "pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : request.status === "completed"
                                  ? "bg-green-100 text-green-800"
                                  : request.status === "accepted" ||
                                    request.status === "in-progress"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-zinc-100 text-zinc-800"
                              }`}
                            >
                              {request.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-zinc-500">No requests yet</p>
                    )}
                  </div>
                </>
              )}

              {user.role === "csr-representative" && (
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-lg bg-zinc-50 p-4">
                    <div className="text-sm text-zinc-600">Request Managed</div>
                    <div className="mt-1 text-2xl font-bold text-zinc-900">
                      {requestStats.total}
                    </div>
                  </div>
                  <div className="rounded-lg bg-zinc-50 p-4">
                    <div className="text-sm text-zinc-600">In-Progress</div>
                    <div className="mt-1 text-2xl font-bold text-zinc-900">
                      {requestStats.pending}
                    </div>
                  </div>
                  <div className="rounded-lg bg-zinc-50 p-4">
                    <div className="text-sm text-zinc-600">Completed</div>
                    <div className="mt-1 text-2xl font-bold text-zinc-900">
                      {requestStats.completed}
                    </div>
                  </div>
                </div>
              )}

              {(user.role === "platform-manager" ||
                user.role === "user-admin") && (
                <div className="rounded-md bg-zinc-50 p-4">
                  <p className="text-sm text-zinc-600">
                    No viewing details for Admin & Platform Manager
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Suspend Confirmation Modal */}
      {showSuspendModal && (
        <ConfirmationModal
          title="Suspend User Account"
          message={`Are you sure you want to suspend ${
            user.name || user.email
          }? They will not be able to access the system until reactivated.`}
          confirmText="Suspend"
          cancelText="Cancel"
          onConfirm={handleSuspend}
          onCancel={() => setShowSuspendModal(false)}
          isDestructive={true}
        />
      )}

      {/* Reactivate Confirmation Modal */}
      {showReactivateModal && (
        <ConfirmationModal
          title="Reactivate User Account"
          message={`Are you sure you want to reactivate ${
            user.name || user.email
          }? They will regain full access to the system.`}
          confirmText="Reactivate"
          cancelText="Cancel"
          onConfirm={handleReactivate}
          onCancel={() => setShowReactivateModal(false)}
          isDestructive={false}
        />
      )}
    </>
  );
}
