"use client";

export default function SuspendedBanner() {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 px-4 py-3 text-center text-white shadow-lg">
      <div className="flex items-center justify-center gap-2">
        <svg
          className="h-5 w-5"
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
        <span className="font-semibold">
          Your account has been suspended. You cannot submit or complete
          requests.
        </span>
      </div>
    </div>
  );
}
