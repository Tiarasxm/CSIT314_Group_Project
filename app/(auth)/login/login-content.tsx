"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const errorParam = searchParams.get("error");
    const messageParam = searchParams.get("message");
    if (errorParam) {
      setError(errorParam);
    }
    if (messageParam) {
      setMessage(messageParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (signInError) throw signInError;

      if (data.user) {
        // Get user role from metadata
        const { data: userData } = await supabase
          .from("users")
          .select("role")
          .eq("id", data.user.id)
          .single();

        // Redirect based on role
        const role = userData?.role || data.user.user_metadata?.role || "user";
        router.push(`/${role === "user" ? "user" : role}/dashboard`);
      }
    } catch (err: any) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      const { error: googleError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (googleError) throw googleError;
    } catch (err: any) {
      setError(err.message || "An error occurred with Google sign-in");
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
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
                {error}
              </div>
            )}

            {message && (
              <div className="rounded-md bg-green-50 p-3 text-sm text-green-800">
                {message}
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
                  placeholder="you@example.com"
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

              <div className="flex items-center justify-between">
                <Link
                  href="/forgot-password"
                  className="text-sm font-medium text-black hover:underline"
                >
                  Forgot your password?
                </Link>
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

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-zinc-500">Or</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="flex w-full items-center justify-center gap-2 rounded-md border border-zinc-300 bg-white px-4 py-2 text-black transition-colors hover:bg-zinc-50"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>

            <div className="pt-4 text-center text-sm">
              <span className="text-zinc-600">Don't have an account? </span>
              <Link
                href="/register"
                className="font-medium text-black hover:underline"
              >
                Sign up
              </Link>
            </div>

            <div className="border-t border-zinc-200 pt-4 text-center">
              <p className="text-sm text-zinc-600">
                Are you a Admin, or Manager?{" "}
                <Link
                  href="/staff/login"
                  className="font-medium text-black hover:underline"
                >
                  Go to Staff Portal →
                </Link>
              </p>
            </div>
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

