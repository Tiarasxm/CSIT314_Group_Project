"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function CSRSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/staff/login");
  };

  const navItems = [
    { href: "/csr-representative/dashboard", label: "Dashboard" },
    { href: "/csr-representative/announcements", label: "Announcements" },
    { href: "/csr-representative/profile", label: "Profile" },
  ];

  return (
    <div className="fixed left-0 top-0 h-screen w-64 border-r border-zinc-200 bg-white">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="border-b border-zinc-200 p-6">
          <h1 className="text-xl font-bold text-black">LOGO</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={true}
                className={`block rounded-md px-4 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-orange-100 text-orange-600"
                    : "text-black hover:bg-zinc-100"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="border-t border-zinc-200 p-4">
          <button
            onClick={handleLogout}
            className="w-full rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-zinc-50"
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}

