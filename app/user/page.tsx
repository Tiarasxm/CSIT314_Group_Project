export default function UserDashboard() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black dark:text-zinc-50">
            My Requests
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Submit and track your requests for help
          </p>
        </div>

        <div className="mb-6">
          <button className="rounded-md bg-black px-4 py-2 text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200">
            Submit New Request
          </button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg bg-white p-6 shadow dark:bg-zinc-900">
            <h2 className="text-xl font-semibold text-black dark:text-zinc-50">
              Pending Requests
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Requests waiting for acceptance
            </p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow dark:bg-zinc-900">
            <h2 className="text-xl font-semibold text-black dark:text-zinc-50">
              Accepted Requests
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Requests accepted by CSR representatives
            </p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow dark:bg-zinc-900">
            <h2 className="text-xl font-semibold text-black dark:text-zinc-50">
              Completed Requests
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Requests that have been fulfilled
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

