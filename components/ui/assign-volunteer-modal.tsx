"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

interface AssignVolunteerModalProps {
  requestId: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: {
    volunteerName: string;
    volunteerMobile: string;
    volunteerNote: string;
    volunteerImageUrl?: string;
  }) => Promise<void>;
  existingData?: {
    volunteerName?: string;
    volunteerMobile?: string;
    volunteerNote?: string;
    volunteerImageUrl?: string;
  };
}

export default function AssignVolunteerModal({
  requestId,
  isOpen,
  onClose,
  onConfirm,
  existingData,
}: AssignVolunteerModalProps) {
  const supabase = createClient();
  const [volunteerName, setVolunteerName] = useState(
    existingData?.volunteerName || ""
  );
  const [volunteerMobile, setVolunteerMobile] = useState(
    existingData?.volunteerMobile || ""
  );
  const [volunteerNote, setVolunteerNote] = useState(
    existingData?.volunteerNote || ""
  );
  const [volunteerImage, setVolunteerImage] = useState<File | null>(null);
  const [volunteerImageUrl, setVolunteerImageUrl] = useState<string | null>(
    existingData?.volunteerImageUrl || null
  );
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && existingData) {
      setVolunteerName(existingData.volunteerName || "");
      setVolunteerMobile(existingData.volunteerMobile || "");
      setVolunteerNote(existingData.volunteerNote || "");
      setVolunteerImageUrl(existingData.volunteerImageUrl || null);
    }
  }, [isOpen, existingData]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size must be less than 5MB");
        return;
      }
      // Validate file type
      if (!file.type.startsWith("image/")) {
        alert("Please select an image file");
        return;
      }
      setVolunteerImage(file);
      // Preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setVolunteerImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setVolunteerImage(null);
    setVolunteerImageUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!volunteerName.trim() || !volunteerNote.trim()) {
      alert("Please fill in volunteer name and note");
      return;
    }

    setSaving(true);

    try {
      let finalImageUrl = volunteerImageUrl;

      // Upload new image if selected
      if (volunteerImage) {
        setUploading(true);
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (!authUser) {
          alert("You must be logged in to upload images");
          setSaving(false);
          setUploading(false);
          return;
        }

        // Delete old image if exists
        if (existingData?.volunteerImageUrl && existingData.volunteerImageUrl.includes("/volunteer-images/")) {
          try {
            const urlParts = existingData.volunteerImageUrl.split("/volunteer-images/");
            if (urlParts.length > 1) {
              const filePath = urlParts[1].split("?")[0];
              await supabase.storage.from("volunteer-images").remove([filePath]);
            }
          } catch (error) {
            console.warn("Could not delete old image:", error);
          }
        }

        // Upload new image
        const fileExt = volunteerImage.name.split(".").pop();
        const fileName = `${requestId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("volunteer-images")
          .upload(fileName, volunteerImage, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          console.error("Error uploading image:", uploadError);
          alert("Failed to upload image. Please try again.");
          setSaving(false);
          setUploading(false);
          return;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("volunteer-images").getPublicUrl(fileName);

        finalImageUrl = publicUrl;
        setUploading(false);
      }

      await onConfirm({
        volunteerName: volunteerName.trim(),
        volunteerMobile: volunteerMobile.trim(),
        volunteerNote: volunteerNote.trim(),
        volunteerImageUrl: finalImageUrl || undefined,
      });

      // Reset form
      setVolunteerName("");
      setVolunteerMobile("");
      setVolunteerNote("");
      setVolunteerImage(null);
      setVolunteerImageUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Error assigning volunteer:", error);
      alert("Failed to assign volunteer. Please try again.");
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl animate-in fade-in zoom-in duration-300">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-black hover:text-black"
          disabled={saving || uploading}
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Title */}
        <h3 className="mb-4 text-xl font-semibold text-black">
          {existingData ? "Edit Volunteer Assignment" : "Assign Volunteer"}
        </h3>

        {/* Form */}
        <div className="space-y-4">
          {/* Volunteer Name */}
          <div>
            <label className="mb-2 block text-sm font-medium text-black">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={volunteerName}
              onChange={(e) => setVolunteerName(e.target.value)}
              placeholder="Enter volunteer's name"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-black focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              required
              disabled={saving || uploading}
            />
          </div>

          {/* Volunteer Mobile */}
          <div>
            <label className="mb-2 block text-sm font-medium text-black">
              Mobile number
            </label>
            <input
              type="tel"
              value={volunteerMobile}
              onChange={(e) => setVolunteerMobile(e.target.value)}
              placeholder="+65 Enter volunteer's number"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-black focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              disabled={saving || uploading}
            />
          </div>

          {/* Volunteer Note */}
          <div>
            <label className="mb-2 block text-sm font-medium text-black">
              Note <span className="text-red-500">*</span>
            </label>
            <textarea
              value={volunteerNote}
              onChange={(e) => setVolunteerNote(e.target.value)}
              placeholder="Enter notes about the volunteer assignment"
              rows={4}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-black focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              required
              disabled={saving || uploading}
            />
          </div>

          {/* Volunteer Image */}
          <div>
            <label className="mb-2 block text-sm font-medium text-black">
              Image (Optional)
            </label>
            {volunteerImageUrl ? (
              <div className="space-y-2">
                <img
                  src={volunteerImageUrl}
                  alt="Volunteer"
                  className="h-32 w-32 rounded-full object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="text-sm text-red-600 hover:underline"
                  disabled={saving || uploading}
                >
                  Remove image
                </button>
              </div>
            ) : (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  disabled={saving || uploading}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-md border border-zinc-300 px-4 py-2 text-sm text-black hover:bg-zinc-50"
                  disabled={saving || uploading}
                >
                  Upload Image
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={saving || uploading}
            className="rounded-md border border-zinc-300 px-6 py-2 text-sm font-medium text-black transition-colors hover:bg-zinc-50 disabled:opacity-50"
          >
            Close
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || uploading || !volunteerName.trim() || !volunteerNote.trim()}
            className="rounded-md bg-orange-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-orange-700 disabled:opacity-50"
          >
            {saving || uploading ? "Processing..." : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

