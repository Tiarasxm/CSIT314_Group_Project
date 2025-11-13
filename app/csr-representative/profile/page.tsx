"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function CSRProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    confirmPassword: "",
    contact_number: "",
    date_of_birth: "",
    gender: "",
    language: "",
    address: "",
    medical_condition: "",
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [initialData, setInitialData] = useState<any>(null);

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

      const data = {
        first_name: userData.first_name || "",
        last_name: userData.last_name || "",
        email: userData.email || "",
        password: "",
        confirmPassword: "",
        contact_number: userData.contact_number || "",
        date_of_birth: userData.date_of_birth || "",
        gender: userData.gender || "",
        language: userData.language || "",
        address: userData.address || "",
        medical_condition: userData.medical_condition || "",
      };

      setFormData(data);
      setInitialData(data);

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

  useEffect(() => {
    if (initialData) {
      const changed =
        formData.first_name !== initialData.first_name ||
        formData.last_name !== initialData.last_name ||
        formData.contact_number !== initialData.contact_number ||
        formData.date_of_birth !== initialData.date_of_birth ||
        formData.gender !== initialData.gender ||
        formData.language !== initialData.language ||
        formData.address !== initialData.address ||
        formData.medical_condition !== initialData.medical_condition ||
        Boolean(formData.password && formData.password.length > 0);

      setHasChanges(Boolean(changed));
    }
  }, [formData, initialData]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Image size must be less than 5MB");
      return;
    }

    setUploadingImage(true);

    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        router.push("/staff/login");
        return;
      }

      // Delete old image if exists
      if (profileImageUrl && profileImageUrl.includes("/profile-images/")) {
        try {
          const urlParts = profileImageUrl.split("/profile-images/");
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
      const fileName = `${authUser.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
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

      // Update user record with new image URL
      const { error: updateError } = await supabase
        .from("users")
        .update({ profile_image_url: publicUrl })
        .eq("id", authUser.id);

      if (updateError) {
        console.error("Error updating profile image:", updateError);
        alert("Failed to save image. Please try again.");
        setUploadingImage(false);
        return;
      }

      setProfileImageUrl(publicUrl);
      setUploadingImage(false);
      alert("Profile image updated successfully!");
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        router.push("/staff/login");
        return;
      }

      // Update password if provided
      if (formData.password && formData.password.length > 0) {
        if (formData.password !== formData.confirmPassword) {
          alert("Passwords do not match");
          setSaving(false);
          return;
        }

        const { error: passwordError } = await supabase.auth.updateUser({
          password: formData.password,
        });

        if (passwordError) {
          console.error("Error updating password:", passwordError);
          alert("Failed to update password. Please try again.");
          setSaving(false);
          return;
        }
      }

      // Construct full name from first_name and last_name
      const fullName = [formData.first_name, formData.last_name]
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
          profile_image_url: profileImageUrl || null,
        })
        .eq("id", authUser.id);

      if (error) {
        console.error("Error updating profile:", error);
        alert("Failed to update profile. Please try again.");
        setSaving(false);
        return;
      }

      // Reset password fields
      setFormData((prev) => ({
        ...prev,
        password: "",
        confirmPassword: "",
      }));
      setShowPasswordFields(false);

      // Update initial data
      setInitialData({
        ...formData,
        password: "",
        confirmPassword: "",
      });

      // Refetch user data
      const { data: userData } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (userData) {
        setUser(userData);
      }

      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setSaving(false);
    }
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
    <>
      <div className="mx-auto max-w-4xl p-6">
        <h1 className="mb-6 text-2xl font-bold text-zinc-900">Profile</h1>

        <form onSubmit={handleSubmit}>
          {/* Profile Picture with Edit Icon */}
          <div className="mb-8 flex justify-center">
            <div className="relative">
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
              <label
                className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-orange-500 shadow-md transition-colors hover:bg-orange-600"
              >
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
            </div>
          </div>

          {/* Basic Information */}
          <div className="mb-8 rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-lg font-semibold text-zinc-900">
              Basic Information
            </h2>

            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-black">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    placeholder="Enter your first name"
                    className="w-full rounded-md border border-zinc-300 px-3 py-2 text-black focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-black">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    placeholder="Enter your last name"
                    className="w-full rounded-md border border-zinc-300 px-3 py-2 text-black focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-black">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  disabled
                  className="w-full rounded-md border border-zinc-300 bg-zinc-100 px-3 py-2 text-black"
                />
                <p className="mt-1 text-xs text-black">
                  Email is disabled (account identifier)
                </p>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-sm font-medium text-black">
                    Password
                  </label>
                  {!showPasswordFields && (
                    <button
                      type="button"
                      onClick={() => setShowPasswordFields(true)}
                      className="text-sm font-medium text-orange-600 hover:text-orange-700"
                    >
                      Change Password
                    </button>
                  )}
                </div>
                {showPasswordFields ? (
                  <div className="space-y-4">
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Enter new password"
                      className="w-full rounded-md border border-zinc-300 px-3 py-2 text-black focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="Confirm new password"
                      className="w-full rounded-md border border-zinc-300 px-3 py-2 text-black focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setShowPasswordFields(false);
                        setFormData((prev) => ({
                          ...prev,
                          password: "",
                          confirmPassword: "",
                        }));
                      }}
                      className="text-sm text-black hover:underline"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <input
                    type="password"
                    value="**********"
                    disabled
                    className="w-full rounded-md border border-zinc-300 bg-zinc-100 px-3 py-2 text-black"
                  />
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-black">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="contact_number"
                  value={formData.contact_number}
                  onChange={handleInputChange}
                  placeholder="+65 Enter your number"
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-black focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
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
                <label className="mb-2 block text-sm font-medium text-black">
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={handleInputChange}
                  placeholder="Enter DOB"
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-black focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-black">
                  Gender
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-black focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-black">
                  Language
                </label>
                <input
                  type="text"
                  name="language"
                  value={formData.language}
                  onChange={handleInputChange}
                  placeholder="Enter preferred language"
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-black focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-black">
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Enter your address"
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-black focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-black">
                  Medical Condition
                </label>
                <textarea
                  name="medical_condition"
                  value={formData.medical_condition}
                  onChange={handleInputChange}
                  placeholder="Relevant health notes..."
                  rows={4}
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-black focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!hasChanges || saving}
              className="rounded-md bg-orange-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
