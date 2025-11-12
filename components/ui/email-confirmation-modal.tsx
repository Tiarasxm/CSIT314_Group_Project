"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { createClient } from "@/lib/supabase/client";

interface EmailConfirmationModalProps {
  email: string;
  onClose: () => void;
}

export default function EmailConfirmationModal({
  email,
  onClose,
}: EmailConfirmationModalProps) {
  const supabase = createClient();
  const [mounted, setMounted] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Trigger animation after mount
    setTimeout(() => setShowAnimation(true), 10);
  }, []);

  const handleResend = async () => {
    setResending(true);
    setResendSuccess(false);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email,
      });

      if (error) throw error;
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 3000);
    } catch (err: any) {
      console.error("Error resending email:", err);
    } finally {
      setResending(false);
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div
        className={`relative w-full max-w-md rounded-lg bg-white p-8 shadow-2xl transition-all duration-500 ${
          showAnimation
            ? "scale-100 opacity-100"
            : "scale-95 opacity-0"
        }`}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-zinc-400 transition-colors hover:text-zinc-600"
          aria-label="Close"
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

        {/* Animated envelope icon */}
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <div
              className={`h-20 w-20 rounded-full bg-blue-100 transition-all duration-700 ${
                showAnimation ? "scale-100" : "scale-0"
              }`}
            >
              <svg
                className="h-full w-full p-4 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            {/* Floating animation */}
            <div
              className={`absolute inset-0 animate-ping rounded-full bg-blue-200 opacity-75 ${
                showAnimation ? "animate-ping" : ""
              }`}
              style={{ animationDelay: "0.5s" }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="text-center">
          <h2 className="mb-3 text-2xl font-bold text-zinc-900">
            Check Your Email
          </h2>
          <p className="mb-4 text-zinc-600">
            We've sent a confirmation link to
          </p>
          <p className="mb-6 font-semibold text-blue-600">{email}</p>
          <p className="mb-6 text-sm text-zinc-500">
            Please click the link in the email to confirm your account. The
            link will expire in 24 hours.
          </p>

          {/* Action buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={onClose}
              className="w-full rounded-md bg-black px-4 py-2 text-white transition-colors hover:bg-zinc-800"
            >
              Got it!
            </button>
            <button
              onClick={handleResend}
              disabled={resending || resendSuccess}
              className="text-sm text-zinc-500 underline transition-colors hover:text-zinc-700 disabled:opacity-50"
            >
              {resending
                ? "Sending..."
                : resendSuccess
                ? "Email sent! ✓"
                : "Resend confirmation email"}
            </button>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute -left-4 -top-4 h-24 w-24 rounded-full bg-blue-100/30 blur-2xl" />
        <div className="absolute -bottom-4 -right-4 h-24 w-24 rounded-full bg-blue-100/30 blur-2xl" />
      </div>
    </div>,
    document.body
  );
}

