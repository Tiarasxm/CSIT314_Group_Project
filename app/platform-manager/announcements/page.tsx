"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export default function AnnouncementsPage() {
  const supabase = createClient();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] =
    useState<Announcement | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
  });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setAnnouncements(data);
    }
    setLoading(false);
  };

  const handleCreate = () => {
    setEditingAnnouncement(null);
    setFormData({ title: "", content: "" });
    setShowModal(true);
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      alert("Please fill in all fields");
      return;
    }

    if (editingAnnouncement) {
      // Update existing
      const { error } = await supabase
        .from("announcements")
        .update({
          title: formData.title,
          content: formData.content,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingAnnouncement.id);

      if (error) {
        alert("Failed to update announcement");
        console.error(error);
        return;
      }
    } else {
      // Create new
      const { error } = await supabase.from("announcements").insert({
        title: formData.title,
        content: formData.content,
      });

      if (error) {
        alert("Failed to create announcement");
        console.error(error);
        return;
      }
    }

    setShowModal(false);
    setFormData({ title: "", content: "" });
    fetchAnnouncements();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this announcement?")) {
      return;
    }

    const { error } = await supabase
      .from("announcements")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Failed to delete announcement");
      console.error(error);
      return;
    }

    fetchAnnouncements();
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Announcements</h1>
          <p className="text-sm text-zinc-600">
            Manage announcements visible to all users
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="rounded-md bg-orange-600 px-4 py-2 text-white transition-colors hover:bg-orange-700"
        >
          Create Announcement
        </button>
      </div>

      {/* Announcements List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-600 border-t-transparent"></div>
        </div>
      ) : announcements.length === 0 ? (
        <div className="rounded-lg bg-white p-12 text-center shadow">
          <p className="text-zinc-600">No announcements yet</p>
          <button
            onClick={handleCreate}
            className="mt-4 text-orange-600 hover:underline"
          >
            Create your first announcement
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <div
              key={announcement.id}
              className="rounded-lg bg-white p-6 shadow"
            >
              <div className="mb-4 flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-zinc-900">
                    {announcement.title}
                  </h3>
                  <p className="mt-2 text-sm text-zinc-600">
                    {announcement.content}
                  </p>
                </div>
                <div className="ml-4 flex gap-2">
                  <button
                    onClick={() => handleEdit(announcement)}
                    className="rounded-md border border-zinc-300 px-3 py-1 text-sm text-black hover:bg-zinc-100"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(announcement.id)}
                    className="rounded-md bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="text-xs text-zinc-400">
                Created:{" "}
                {new Date(announcement.created_at).toLocaleDateString()}{" "}
                {new Date(announcement.created_at).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-xl font-bold text-zinc-900">
              {editingAnnouncement
                ? "Edit Announcement"
                : "Create Announcement"}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-black focus:border-orange-500 focus:outline-none"
                  placeholder="Enter announcement title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700">
                  Content
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  rows={6}
                  className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-black focus:border-orange-500 focus:outline-none"
                  placeholder="Enter announcement content"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setFormData({ title: "", content: "" });
                }}
                className="rounded-md border border-zinc-300 px-4 py-2 text-black hover:bg-zinc-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="rounded-md bg-orange-600 px-4 py-2 text-white hover:bg-orange-700"
              >
                {editingAnnouncement ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
