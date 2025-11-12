export default function CSRRepresentativeDashboard() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black dark:text-zinc-50">
            CSR Representative Dashboard
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Find volunteer opportunities for your corporate volunteers
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg bg-white p-6 shadow dark:bg-zinc-900">
            <h2 className="text-xl font-semibold text-black dark:text-zinc-50">
              Available Requests
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Browse requests from persons in need
            </p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow dark:bg-zinc-900">
            <h2 className="text-xl font-semibold text-black dark:text-zinc-50">
              Accepted Requests
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              View requests you've accepted on behalf of corporate volunteers
            </p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow dark:bg-zinc-900">
            <h2 className="text-xl font-semibold text-black dark:text-zinc-50">
              Corporate Volunteers
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Manage your company's corporate volunteers
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
          <p className="text-sm text-green-800 dark:text-green-200">
            <strong>Note:</strong> As a CSR Representative, you accept requests on
            behalf of your company's corporate volunteers (CVs). You find volunteer
            opportunities for them to fulfill.
          </p>
        </div>
      </div>
    </div>
  );
}

