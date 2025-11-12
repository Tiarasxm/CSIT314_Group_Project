"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function EmailConfirmedPage() {
  const router = useRouter();
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    // Trigger animation after mount
    setTimeout(() => setShowAnimation(true), 10);
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <div className="relative w-full max-w-md">
        <div
          className={`relative rounded-lg bg-white p-8 shadow-xl transition-all duration-700 ${
            showAnimation ? "scale-100 opacity-100" : "scale-95 opacity-0"
          }`}
        >
          {/* Success icon with animation */}
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <div
                className={`h-24 w-24 rounded-full bg-green-100 transition-all duration-700 ${
                  showAnimation ? "scale-100 rotate-0" : "scale-0 rotate-180"
                }`}
              >
                <svg
                  className="h-full w-full p-5 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              {/* Ripple effect */}
              {showAnimation && (
                <>
                  <div className="absolute inset-0 animate-ping rounded-full bg-green-200 opacity-75" />
                  <div
                    className="absolute inset-0 animate-ping rounded-full bg-green-200 opacity-50"
                    style={{ animationDelay: "0.3s" }}
                  />
                </>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="text-center">
            <h1 className="mb-3 text-3xl font-bold text-zinc-900">
              Email Confirmed!
            </h1>
            <p className="mb-2 text-lg text-zinc-600">
              Your email has been successfully verified.
            </p>
            <p className="mb-8 text-sm text-zinc-500">
              You can now log in to your account and start using the platform.
            </p>

            {/* Action button */}
            <Link
              href="/login"
              className="inline-block w-full rounded-md bg-black px-6 py-3 text-center font-medium text-white transition-all duration-300 hover:bg-zinc-800 hover:shadow-lg"
            >
              Go to Login
            </Link>

            {/* Additional info */}
            <p className="mt-6 text-xs text-zinc-400">
              You will be redirected automatically in a few seconds...
            </p>
          </div>

          {/* Decorative elements */}
          <div className="absolute -left-8 -top-8 h-32 w-32 rounded-full bg-green-100/20 blur-3xl" />
          <div className="absolute -bottom-8 -right-8 h-32 w-32 rounded-full bg-green-100/20 blur-3xl" />
        </div>

        {/* Auto-redirect after 5 seconds */}
        {showAnimation && (
          <AutoRedirect delay={5000} />
        )}
      </div>
    </div>
  );
}

function AutoRedirect({ delay }: { delay: number }) {
  const router = useRouter();
  
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/login");
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, router]);

  return null;
}

