"use client";

import { useAuthStore } from "@/store/authStore";
import { apiClient } from "@/lib/api";
import type { UserManagementStats } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function UserManagementPage() {
  const { isAuthenticated, user, logout, checkAuth } = useAuthStore();
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [stats, setStats] = useState<UserManagementStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    setHydrated(true);
  }, [checkAuth]);

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.push("/");
    }
  }, [hydrated, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const fetchUserStats = async () => {
      try {
        const data = await apiClient.getUserManagementStats();
        setStats(data);
      } catch (error) {
        console.error("Failed to fetch user management stats:", error);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchUserStats();
  }, [isAuthenticated]);

  if (!hydrated || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        Loading...
      </div>
    );
  }

  const displayName = user.email.split("@")[0] || "User";

  const formatStat = (value: number | undefined) => {
    if (statsLoading) return "-";
    return typeof value === "number" ? String(value) : "N/A";
  };

  const userGroups = [
    {
      title: "Coaches",
      total: stats?.coaches.total,
      invited: stats?.coaches.invited,
      active: stats?.coaches.active,
      href: "/dashboard/users/coaches",
      buttonLabel: "Manage Coaches",
    },
    {
      title: "Parents",
      total: stats?.parents.total,
      invited: stats?.parents.invited,
      active: stats?.parents.active,
      href: "/dashboard/users/parents",
      buttonLabel: "Manage Parents",
    },
    {
      title: "Players",
      total: stats?.players.total,
      invited: stats?.players.invited,
      active: stats?.players.active,
      href: "/dashboard/users/players",
      buttonLabel: "Manage Players",
    },
  ];

  return (
    <div className="min-h-screen bg-black">
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">User Management</h1>
            <p className="text-gray-400 text-sm mt-1">Welcome, {displayName}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg border border-gray-700 transition"
            >
              Dashboard
            </Link>
            <button
              onClick={() => {
                logout();
                router.push("/");
              }}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg border border-gray-700 transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {userGroups.map((group) => (
            <section
              key={group.title}
              className="bg-gray-900 border border-gray-800 rounded-lg p-6"
            >
              <h2 className="text-2xl font-bold text-white mb-6">
                {group.title}
              </h2>

              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Total</span>
                  <span className="text-lime-400 font-semibold">
                    {formatStat(group.total)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Invited</span>
                  <span className="text-orange-400 font-semibold">
                    {formatStat(group.invited)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Active</span>
                  <span className="text-green-400 font-semibold">
                    {formatStat(group.active)}
                  </span>
                </div>
              </div>

              <Link
                href={group.href}
                className="inline-flex w-full items-center justify-center px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg border border-gray-700 transition"
              >
                {group.buttonLabel}
              </Link>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
