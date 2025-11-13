"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Category {
  id: string;
  name: string;
  display_order: number;
  is_active: boolean;
}

export default function CategoriesPage() {
  const supabase = createClient();
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("display_order", { ascending: true });

    if (!error && data) {
      setCategories(data);
    }
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!newCategory.trim()) return;

    // Check if category already exists
    if (
      categories.some(
        (cat) => cat.name.toLowerCase() === newCategory.trim().toLowerCase()
      )
    ) {
      alert("This category already exists!");
      return;
    }

    const maxOrder = Math.max(...categories.map((c) => c.display_order), 0);

    const { error } = await supabase.from("categories").insert({
      name: newCategory.trim(),
      display_order: maxOrder + 1,
      is_active: true,
    });

    if (error) {
      alert("Failed to add category. Please try again.");
      console.error(error);
      return;
    }

    setNewCategory("");
    await fetchCategories();
  };

  const handleRemove = async (id: string, name: string) => {
    if (
      !confirm(
        `Are you sure you want to remove "${name}"? This will affect all users.`
      )
    ) {
      return;
    }

    const { error } = await supabase.from("categories").delete().eq("id", id);

    if (error) {
      alert("Failed to remove category. Please try again.");
      console.error(error);
      return;
    }

    await fetchCategories();
  };

  const handleEdit = (id: string, name: string) => {
    setEditingId(id);
    setEditValue(name);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editValue.trim()) return;

    // Check if new name conflicts with existing category
    if (
      categories.some(
        (cat) =>
          cat.id !== id &&
          cat.name.toLowerCase() === editValue.trim().toLowerCase()
      )
    ) {
      alert("A category with this name already exists!");
      return;
    }

    const { error } = await supabase
      .from("categories")
      .update({ name: editValue.trim() })
      .eq("id", id);

    if (error) {
      alert("Failed to update category. Please try again.");
      console.error(error);
      return;
    }

    setEditingId(null);
    setEditValue("");
    await fetchCategories();
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValue("");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Service Categories</h1>
        <p className="text-sm text-zinc-600">
          Manage service categories available to all users
        </p>
      </div>

      {/* Add New Category */}
      <div className="mb-6 rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900">
          Add New Category
        </h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="Enter category name..."
            className="flex-1 rounded-md border border-zinc-300 px-3 py-2 text-black focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
          <button
            onClick={handleAdd}
            disabled={!newCategory.trim()}
            className="rounded-md bg-orange-600 px-6 py-2 text-white transition-colors hover:bg-orange-700 disabled:opacity-50"
          >
            Add Category
          </button>
        </div>
      </div>

      {/* Current Categories */}
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-4 text-lg font-semibold text-zinc-900">
          Current Service Categories ({categories.length})
        </h2>
        {categories.length === 0 ? (
          <p className="text-center text-zinc-500 py-8">
            No categories yet. Add your first category above.
          </p>
        ) : (
          <div className="space-y-2">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 p-3"
              >
                {editingId === category.id ? (
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveEdit(category.id);
                      if (e.key === "Escape") handleCancelEdit();
                    }}
                    className="flex-1 rounded-md border border-zinc-300 px-3 py-1 text-black focus:border-orange-500 focus:outline-none"
                    autoFocus
                  />
                ) : (
                  <span className="text-zinc-900">{category.name}</span>
                )}
                <div className="flex gap-2">
                  {editingId === category.id ? (
                    <>
                      <button
                        onClick={() => handleSaveEdit(category.id)}
                        className="rounded-md bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="rounded-md border border-zinc-300 px-3 py-1 text-sm text-black hover:bg-zinc-100"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleEdit(category.id, category.name)}
                        className="rounded-md border border-zinc-300 px-3 py-1 text-sm text-black hover:bg-zinc-100"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleRemove(category.id, category.name)}
                        className="rounded-md bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700"
                      >
                        Remove
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Note */}
      <div className="mt-6 rounded-lg bg-blue-50 p-4">
        <p className="text-sm text-blue-900">
          <strong>Note:</strong> Changes to categories will immediately affect
          all users when they submit new requests. Existing requests will retain
          their original category.
        </p>
      </div>
    </div>
  );
}
