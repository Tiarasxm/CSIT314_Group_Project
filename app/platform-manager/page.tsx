export default function PlatformManagerDashboard() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black dark:text-zinc-50">
            Platform Manager Dashboard
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Manage the website and platform settings
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg bg-white p-6 shadow dark:bg-zinc-900">
            <h2 className="text-xl font-semibold text-black dark:text-zinc-50">
              Website Settings
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Configure website content, themes, and general settings
            </p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow dark:bg-zinc-900">
            <h2 className="text-xl font-semibold text-black dark:text-zinc-50">
              Platform Analytics
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              View platform usage statistics and metrics
            </p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow dark:bg-zinc-900">
            <h2 className="text-xl font-semibold text-black dark:text-zinc-50">
              Content Management
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Manage website content, pages, and announcements
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-lg bg-yellow-50 p-4 dark:bg-yellow-900/20">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Note:</strong> Platform Managers manage the website, NOT user
            accounts. User accounts are managed by User Admins.
          </p>
        </div>
      </div>
    </div>
  );
}

