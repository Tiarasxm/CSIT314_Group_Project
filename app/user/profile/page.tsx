"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPasswordFields, setShowPasswordFields] = useState(false);
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
    const fetchUser = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        router.push("/login");
        return;
      }

      const { data: userData } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (userData?.role !== "user") {
        router.push("/login");
        return;
      }

      const userInfo = userData || authUser;
      setUser(userInfo);

      const data = {
        first_name: userInfo.first_name || "",
        last_name: userInfo.last_name || "",
        email: userInfo.email || authUser.email || "",
        password: "",
        confirmPassword: "",
        contact_number: userInfo.contact_number || "",
        date_of_birth: userInfo.date_of_birth || "",
        gender: userInfo.gender || "",
        language: userInfo.language || "",
        address: userInfo.address || "",
        medical_condition: userInfo.medical_condition || "",
      };

      setFormData(data);
      setInitialData(data);
      setLoading(false);
    };

    fetchUser();
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

      setHasChanges(changed);
    }
  }, [formData, initialData]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        router.push("/login");
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

      // Update user profile
      const { error } = await supabase
        .from("users")
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          contact_number: formData.contact_number || null,
          date_of_birth: formData.date_of_birth || null,
          gender: formData.gender || null,
          language: formData.language || null,
          address: formData.address || null,
          medical_condition: formData.medical_condition || null,
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
        <p>Loading...</p>
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
                <div className="h-32 w-32 rounded-full bg-zinc-200"></div>
                <button
                  type="button"
                  className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-yellow-400 shadow-md transition-colors hover:bg-yellow-500"
                >
                  <svg
                    className="h-4 w-4 text-black"
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
                </button>
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
                    <button
                      type="button"
                      onClick={() => setShowPasswordFields(!showPasswordFields)}
                      className="text-sm font-medium text-orange-600 hover:text-orange-700"
                    >
                      Change Password
                    </button>
                  </div>
                  {showPasswordFields ? (
                    <div className="grid gap-4 md:grid-cols-2">
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
                    </div>
                  ) : (
                    <input
                      type="password"
                      value="********"
                      disabled
                      className="w-full rounded-md border border-zinc-300 bg-zinc-100 px-3 py-2 text-black"
                    />
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-black">
                    Phone Number
                  </label>
                  <div className="flex">
                    <div className="flex items-center rounded-l-md border border-r-0 border-zinc-300 bg-zinc-50 px-3 text-black">
                      +65
                    </div>
                    <input
                      type="tel"
                      name="contact_number"
                      value={formData.contact_number}
                      onChange={handleInputChange}
                      placeholder="Enter your number"
                      className="w-full rounded-r-md border border-zinc-300 px-3 py-2 text-black focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    />
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
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows={3}
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
                    rows={3}
                    placeholder="Relevant health notes...."
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
                className="rounded-md bg-orange-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
    </>
  );
}
