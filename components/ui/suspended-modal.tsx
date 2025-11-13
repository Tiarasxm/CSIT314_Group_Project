"use client";

import { useEffect } from "react";

interface SuspendedModalProps {
  onClose: () => void;
}

export default function SuspendedModal({ onClose }: SuspendedModalProps) {
  useEffect(() => {
    // Prevent body scroll when modal is open
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        {/* Icon */}
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <svg
            className="h-10 w-10 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        {/* Content */}
        <h3 className="mb-2 text-center text-xl font-bold text-zinc-900">
          Account Suspended
        </h3>
        <p className="mb-6 text-center text-sm text-zinc-600">
          Your account has been suspended by the administrator. You cannot
          submit new requests or mark requests as completed while your account
          is suspended. Please contact support if you believe this is an error.
        </p>

        {/* Button */}
        <button
          onClick={onClose}
          className="w-full rounded-md bg-red-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-red-700"
        >
          Yes, I Understand
        </button>
      </div>
    </div>
  );
}
