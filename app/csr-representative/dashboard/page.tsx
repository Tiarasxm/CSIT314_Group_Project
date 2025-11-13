"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SuspendedBanner from "@/components/ui/suspended-banner";

export default function CSRRepresentativeDashboard() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    newRequests: 0,
    activeAssignments: 0,
    shortlisted: 0,
    completed: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        router.push("/staff/login");
        return;
      }

      const { data: userData } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (userData?.role !== "csr-representative") {
        router.push("/staff/login");
        return;
      }

      setUser(userData);

      // Fetch stats
      const [
        newRequestsResult,
        activeResult,
        shortlistedResult,
        completedResult,
      ] = await Promise.all([
        supabase
          .from("requests")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending"),
        supabase
          .from("requests")
          .select("*", { count: "exact", head: true })
          .eq("accepted_by", authUser.id)
          .in("status", ["accepted", "in-progress"]),
        supabase
          .from("requests")
          .select("*", { count: "exact", head: true })
          .eq("shortlisted", true)
          .eq("shortlisted_by", authUser.id),
        supabase
          .from("requests")
          .select("*", { count: "exact", head: true })
          .eq("accepted_by", authUser.id)
          .eq("status", "completed"),
      ]);

      setStats({
        newRequests: newRequestsResult.count || 0,
        activeAssignments: activeResult.count || 0,
        shortlisted: shortlistedResult.count || 0,
        completed: completedResult.count || 0,
      });

      setLoading(false);
    };

    fetchData();
  }, [supabase, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-600 border-t-transparent"></div>
          <p className="text-sm text-black">Loading...</p>
        </div>
      </div>
    );
  }

  const userName = user?.name || user?.first_name || "CSR Representative";

  const cards = [
    {
      title: "New Requests",
      description: "Awaiting review and matching",
      value: stats.newRequests,
      href: "/csr-representative/requests/new",
      icon: (
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
            d="M12 4v16m8-8H4"
          />
        </svg>
      ),
    },
    {
      title: "Active Assignments",
      description: "Current requests you’re managing",
      value: stats.activeAssignments,
      href: "/csr-representative/requests/active",
      icon: (
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
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      ),
    },
    {
      title: "My Shortlists",
      description: "Track your saved opportunities",
      value: stats.shortlisted,
      href: "/csr-representative/requests/shortlist",
      icon: (
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
            d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
          />
        </svg>
      ),
    },
    {
      title: "Completed Services",
      description: "All confirmed appointments",
      value: stats.completed,
      href: "/csr-representative/requests/completed",
      icon: (
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
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
  ];

  return (
    <>
      {user?.is_suspended && <SuspendedBanner />}
      <div
        className={`mx-auto max-w-6xl px-6 py-10 space-y-10 ${
          user?.is_suspended ? "mt-14" : ""
        }`}
      >
        <section className="rounded-3xl bg-gradient-to-r from-[#f8b75c] via-[#f59c34] to-[#f07b1f] p-10 text-white shadow-lg">
          <p className="text-sm uppercase tracking-wider text-white/80">
            Welcome back
          </p>
          <h2 className="mt-2 text-3xl font-bold leading-snug">
            Hi, {userName || "there"}! Here's what's happening today.
          </h2>
          <p className="mt-4 max-w-2xl text-white/90">
            Let us know what you need. Our team and volunteers are here to help
            you every step of the way.
          </p>
          <Link
            href="/csr-representative/requests/new"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-white/90 px-5 py-2 text-sm font-semibold text-orange-600 shadow transition hover:bg-white"
          >
            All New Requests
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          {cards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group rounded-3xl border border-orange-100 bg-white/95 p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
                    {card.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-zinc-900">
                      {card.title}
                    </h3>
                    <p className="text-sm text-zinc-500">{card.description}</p>
                  </div>
                </div>
                <svg
                  className="h-5 w-5 text-orange-300 transition group-hover:text-orange-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
              <div className="mt-8 text-4xl font-bold text-zinc-900">
                {card.value}
              </div>
            </Link>
          ))}
        </section>
      </div>
    </>
  );
}
