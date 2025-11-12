export default function UserAdminDashboard() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black dark:text-zinc-50">
            User Admin Dashboard
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Manage user accounts and permissions
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg bg-white p-6 shadow dark:bg-zinc-900">
            <h2 className="text-xl font-semibold text-black dark:text-zinc-50">
              All Users
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              View and manage all user accounts
            </p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow dark:bg-zinc-900">
            <h2 className="text-xl font-semibold text-black dark:text-zinc-50">
              Create User
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Create new user accounts, including Platform Manager and User Admin
            </p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow dark:bg-zinc-900">
            <h2 className="text-xl font-semibold text-black dark:text-zinc-50">
              Role Management
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Assign and modify user roles and permissions
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Note:</strong> Only User Admins can manage user accounts. This
            includes creating Platform Manager and User Admin accounts.
          </p>
        </div>
      </div>
    </div>
  );
}

