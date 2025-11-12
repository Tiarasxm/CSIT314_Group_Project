"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function CreatePasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      
      if (!user) {
        router.push("/login");
      }
    };
    getUser();
  }, [supabase, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      // Update password for the user
      const { error: updateError } = await supabase.auth.updateUser({
        password: formData.password,
      });

      if (updateError) throw updateError;

      // Check if user exists in users table
      const { data: userData } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      // If user doesn't exist in users table, create them with default role
      if (!userData) {
        const { error: insertError } = await supabase
          .from("users")
          .insert({
            id: user.id,
            email: user.email || "",
            name: user.user_metadata?.name || user.user_metadata?.full_name || "User",
            first_name: user.user_metadata?.first_name || user.user_metadata?.given_name,
            last_name: user.user_metadata?.last_name || user.user_metadata?.family_name,
            role: "user", // Default role for new signups
          });

        if (insertError) {
          console.error("Error creating user:", insertError);
        }
      }

      // Redirect to user dashboard
      router.push("/user/dashboard");
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="grid w-full max-w-6xl grid-cols-1 overflow-hidden rounded-lg shadow-xl lg:grid-cols-2">
        {/* Left Column - Form */}
        <div className="flex items-center justify-center bg-white p-8 lg:p-12">
          <div className="w-full max-w-md space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-black">Create Password</h2>
              <p className="mt-2 text-sm text-zinc-600">
                Complete your account setup by creating a password
              </p>
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
                {error}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-zinc-700"
                >
                  Create password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-black placeholder-zinc-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-zinc-700"
                >
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      confirmPassword: e.target.value,
                    })
                  }
                  className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-black placeholder-zinc-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-md bg-black px-4 py-2 text-white transition-colors hover:bg-zinc-800 disabled:opacity-50"
                >
                  {loading ? "Creating password..." : "Sign Up"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column - Orange Background with Patterns */}
        <div className="hidden bg-orange-500 lg:block lg:relative">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: '50px 50px'
            }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}

