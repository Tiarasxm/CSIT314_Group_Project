"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function StaffLoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Check if Supabase is configured
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        setError("Supabase configuration is missing. Please check your environment variables.");
        setLoading(false);
        return;
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (signInError) {
        // Provide more detailed error messages
        if (signInError.message?.includes('Failed to fetch') || signInError.message?.includes('NetworkError')) {
          setError("Network error: Unable to connect to Supabase. Please check your internet connection and Supabase URL configuration.");
          console.error("Supabase connection error:", {
            url: supabaseUrl,
            hasKey: !!supabaseKey,
            error: signInError
          });
        } else {
          throw signInError;
        }
        setLoading(false);
        return;
      }

      if (data.user) {
        // Get user role from users table
        // Use .eq("id", data.user.id) to read own data (allowed by RLS)
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("role, email, name")
          .eq("id", data.user.id)
          .single();
        
        // Debug logging
        console.log("Auth user ID:", data.user.id);
        console.log("User data from DB:", userData);
        console.log("User error:", userError);

        // If user doesn't exist in users table, it's not a staff account
        if (userError) {
          // Check if it's a "not found" error or a different error
          if (userError.code === 'PGRST116' || userError.message?.includes('No rows')) {
            setError("This account is not authorized for staff access. Staff accounts must be pre-created in the database. Run: supabase/migrations/003_add_admin_accounts.sql");
          } else {
            setError(`Database error: ${userError.message}. Check browser console for details.`);
            console.error("Database error:", userError);
          }
          await supabase.auth.signOut();
          setLoading(false);
          return;
        }

        if (!userData) {
          setError("This account is not authorized for staff access. Staff accounts must be pre-created in the database. Run: supabase/migrations/003_add_admin_accounts.sql");
          await supabase.auth.signOut();
          setLoading(false);
          return;
        }

        const role = userData.role;

        // Only allow staff roles (platform-manager, user-admin, csr-representative)
        if (
          role === "platform-manager" ||
          role === "user-admin" ||
          role === "csr-representative"
        ) {
          // Redirect based on role
          if (role === "platform-manager") {
            router.push("/platform-manager/dashboard");
          } else if (role === "user-admin") {
            router.push("/user-admin/dashboard");
          } else if (role === "csr-representative") {
            router.push("/csr-representative/dashboard");
          }
        } else {
          setError("This account is not authorized for staff access. Your role is: " + role);
          await supabase.auth.signOut();
        }
      }
    } catch (err: any) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="grid w-full max-w-6xl grid-cols-1 overflow-hidden rounded-lg shadow-xl lg:grid-cols-2">
        {/* Left Column - Form */}
        <div className="flex items-center justify-center bg-white p-8 lg:p-12">
          <div className="w-full max-w-md space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-black">Log In</h2>
              <p className="mt-2 text-sm text-zinc-600">
                Staff Portal - Pre-created accounts only
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
                  htmlFor="email"
                  className="block text-sm font-medium text-zinc-700"
                >
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-black placeholder-zinc-400 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
                  placeholder="staff@example.com"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-zinc-700"
                >
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
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
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-md bg-black px-4 py-2 text-white transition-colors hover:bg-zinc-800 disabled:opacity-50"
                >
                  {loading ? "Logging in..." : "Log In"}
                </button>
              </div>
            </form>

            <div className="border-t border-zinc-200 pt-4 text-center">
              <p className="text-sm text-zinc-600">
                Are you a person in need of Help or a CSR Rep?{" "}
                <Link
                  href="/login"
                  className="font-medium text-black hover:underline"
                >
                  Go to Client Portal →
                </Link>
              </p>
            </div>

            <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-800">
              <p className="font-semibold">Note:</p>
              <p>
                Staff accounts are pre-created by developers. No public
                registration available.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column - Light Grey Background */}
        <div className="hidden bg-zinc-100 lg:block"></div>
      </div>
    </div>
  );
}

