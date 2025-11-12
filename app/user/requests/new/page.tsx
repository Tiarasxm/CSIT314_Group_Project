"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import SuccessModal from "@/components/ui/success-modal";

const CATEGORIES = [
  "Household Support",
  "Transportation",
  "Medical Assistance",
  "Food & Groceries",
  "Technology Support",
  "Other",
];

export default function SubmitRequestPage() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({
    category: "",
    description: "",
    date: "",
    time: "",
    additionalNotes: "",
    files: [] as File[],
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData((prev) => ({
        ...prev,
        files: Array.from(e.target.files || []),
      }));
    }
  };

  const handleNext = () => {
    if (step === 1) {
      // Validate step 1
      if (!formData.category || !formData.description || !formData.date || !formData.time) {
        alert("Please fill in all required fields");
        return;
      }
    }
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Combine date and time into scheduled_at
      const scheduledAt = new Date(`${formData.date}T${formData.time}`).toISOString();

      // Upload files if any
      let fileUrls: string[] = [];
      if (formData.files.length > 0) {
        for (const file of formData.files) {
          try {
            const fileExt = file.name.split(".").pop();
            const fileName = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from("request-files")
              .upload(fileName, file);

            if (!uploadError && uploadData) {
              const { data: urlData } = supabase.storage
                .from("request-files")
                .getPublicUrl(fileName);
              if (urlData?.publicUrl) {
                fileUrls.push(urlData.publicUrl);
              }
            } else {
              console.warn("File upload failed:", uploadError);
              if (uploadError?.message?.includes("Bucket not found")) {
                console.warn("Storage bucket 'request-files' not found. Please create it in Supabase Storage. See STORAGE_SETUP.md");
              }
              // Continue without this file
            }
          } catch (error) {
            console.warn("Error uploading file:", error);
            // Continue without this file
          }
        }
      }

      // Create request (only include additional_notes if column exists)
      const requestData: any = {
        user_id: user.id,
        title: formData.category, // Use category as title
        description: formData.description,
        scheduled_at: scheduledAt,
        status: "pending",
      };

      // Only add these fields if they exist in the schema
      // (migration 006_add_request_fields.sql adds these)
      if (formData.category) {
        requestData.category = formData.category;
      }
      if (formData.additionalNotes) {
        requestData.additional_notes = formData.additionalNotes;
      }
      if (fileUrls.length > 0) {
        requestData.attachments = fileUrls;
      }

      const { error } = await supabase.from("requests").insert(requestData);

      if (error) {
        console.error("Error submitting request:", error);
        alert("Failed to submit request. Please try again.");
        setLoading(false);
        return;
      }

      setShowSuccess(true);
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    router.push("/user/dashboard");
  };

  return (
    <>
        <div className="mx-auto max-w-3xl p-6">
          <h1 className="mb-6 text-2xl font-bold text-zinc-900">
            Submit New Request
          </h1>

          {/* Progress Indicator */}
          <div className="mb-8 flex items-center">
            <div className="flex flex-1 items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  step >= 1 ? "bg-orange-600 text-white" : "bg-zinc-200 text-black"
                }`}
              >
                1
              </div>
              <div
                className={`h-1 flex-1 ${
                  step >= 2 ? "bg-orange-600" : "bg-zinc-200"
                }`}
              ></div>
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  step >= 2 ? "bg-orange-600 text-white" : "bg-zinc-200 text-black"
                }`}
              >
                2
              </div>
            </div>
          </div>

          <div className="mb-4 text-sm text-black">
            {step === 1 ? "Description of Need" : "Additional Notes"}
          </div>

          {/* Step 1: Description of Need */}
          {step === 1 && (
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-lg font-semibold text-zinc-900">
                Please tell us more about what you need
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-black">
                    Select your category <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-zinc-300 px-3 py-2 text-black focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    required
                  >
                    <option value="">Select a category</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-black">
                    Describe your need <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={5}
                    placeholder="e.g., Need help cleaning my home after returning from the hospital..."
                    className="w-full rounded-md border border-zinc-300 px-3 py-2 text-black focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                    required
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-black">
                      Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full rounded-md border border-zinc-300 px-3 py-2 text-black focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-black">
                      Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      name="time"
                      value={formData.time}
                      onChange={handleInputChange}
                      className="w-full rounded-md border border-zinc-300 px-3 py-2 text-black focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-4">
                <button
                  onClick={() => router.back()}
                  className="rounded-md border border-zinc-300 px-6 py-2 text-sm font-medium text-black transition-colors hover:bg-zinc-50"
                >
                  Back
                </button>
                <button
                  onClick={handleNext}
                  className="rounded-md bg-orange-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-700"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Additional Notes */}
          {step === 2 && (
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-lg font-semibold text-zinc-900">
                Additional Notes
              </h2>
              <p className="mb-4 text-sm text-black">
                This step is optional. You can leave it blank.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-black">
                    Additional Notes
                  </label>
                  <textarea
                    name="additionalNotes"
                    value={formData.additionalNotes}
                    onChange={handleInputChange}
                    rows={5}
                    placeholder="Any additional information you'd like to provide..."
                    className="w-full rounded-md border border-zinc-300 px-3 py-2 text-black focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-black">
                    Optional: Attach Supporting Files
                  </label>
                  <div className="mt-2 flex items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 p-8">
                    <div className="text-center">
                      <svg
                        className="mx-auto h-12 w-12 text-black"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                      <div className="mt-4">
                        <label className="cursor-pointer">
                          <span className="text-sm font-medium text-orange-600 hover:text-orange-500">
                            Click to upload
                          </span>
                          <input
                            type="file"
                            multiple
                            onChange={handleFileChange}
                            className="hidden"
                          />
                        </label>
                        <p className="mt-2 text-xs text-black">
                          or drag and drop
                        </p>
                      </div>
                      {formData.files.length > 0 && (
                        <p className="mt-2 text-sm text-black">
                          {formData.files.length} file(s) selected
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-4">
                <button
                  onClick={handleBack}
                  className="rounded-md border border-zinc-300 px-6 py-2 text-sm font-medium text-black transition-colors hover:bg-zinc-50"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="rounded-md bg-orange-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-700 disabled:opacity-50"
                >
                  {loading ? "Submitting..." : "Submit"}
                </button>
              </div>
            </div>
          )}
        </div>

      {showSuccess && (
        <SuccessModal
          title="Your request has been submitted successfully!"
          message="Our CSR representatives will review it and reach out to you soon."
          onClose={handleSuccessClose}
        />
      )}
    </>
  );
}

