"use client";

import { useAuthStore } from "@/store/authStore";
import { apiClient } from "@/lib/api";
import type { InjuryStats } from "@/lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const { isAuthenticated, user, logout, checkAuth } = useAuthStore();
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [stats, setStats] = useState<InjuryStats | null>(null);
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
    if (isAuthenticated) {
      const fetchStats = async () => {
        try {
          const data = await apiClient.getStats();
          setStats(data);
        } catch (error) {
          console.error("Failed to fetch stats:", error);
        } finally {
          setStatsLoading(false);
        }
      };
      fetchStats();
    }
  }, [isAuthenticated]);

  if (!hydrated || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        Loading...
      </div>
    );
  }

  const displayName = user.email.split("@")[0] || "User";

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Injury Surveillance Dashboard
            </h1>
            <p className="text-gray-400 text-sm mt-1">Welcome, {displayName}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/users"
              className="px-4 py-2 bg-lime-500/20 hover:bg-lime-500/30 text-lime-300 rounded-lg border border-lime-500/30 transition"
            >
              User Management
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Account Info */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">
            Welcome to Admin Dashboard
          </h2>
          <div className="space-y-3 text-gray-400">
            <p>
              Email: <span className="text-lime-400">{user.email}</span>
            </p>
            <p>
              ID:{" "}
              <span className="text-gray-500 font-mono text-sm">{user.id}</span>
            </p>
            <p>
              Role:{" "}
              <span className="text-lime-400 capitalize">
                {user.identity_type}
              </span>
            </p>
          </div>
        </div>

        {/* Statistics Section */}
        <div>
          <h3 className="text-xl font-bold text-white mb-4">
            Injury Statistics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Total Players Card */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-400 text-sm font-medium">
                    Total Players
                  </p>
                  <p className="text-3xl font-bold text-lime-400 mt-2">
                    {statsLoading ? "-" : stats?.totalPlayers || 0}
                  </p>
                </div>
                <div className="text-2xl">👥</div>
              </div>
            </div>

            {/* Total Injuries Card */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-400 text-sm font-medium">
                    Total Injuries
                  </p>
                  <p className="text-3xl font-bold text-orange-400 mt-2">
                    {statsLoading ? "-" : stats?.totalInjuries || 0}
                  </p>
                </div>
                <div className="text-2xl">🏥</div>
              </div>
            </div>

            {/* Active Injuries Card */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-400 text-sm font-medium">
                    Active Injuries
                  </p>
                  <p className="text-3xl font-bold text-red-400 mt-2">
                    {statsLoading ? "-" : stats?.activeInjuries || 0}
                  </p>
                </div>
                <div className="text-2xl">⚠️</div>
              </div>
            </div>

            {/* Resolved Injuries Card */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-400 text-sm font-medium">
                    Resolved Injuries
                  </p>
                  <p className="text-3xl font-bold text-green-400 mt-2">
                    {statsLoading ? "-" : stats?.resolvedInjuries || 0}
                  </p>
                </div>
                <div className="text-2xl">✅</div>
              </div>
            </div>
          </div>

          {/* Breakdown Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Injuries by Type */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <h4 className="text-lg font-bold text-white mb-4">
                Injuries by Type
              </h4>
              <div className="space-y-3">
                {statsLoading ? (
                  <p className="text-gray-400">Loading...</p>
                ) : stats?.injuriesByType ? (
                  Object.entries(stats.injuriesByType).map(([type, count]) => (
                    <div
                      key={type}
                      className="flex justify-between items-center"
                    >
                      <span className="text-gray-400">{type}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-800 rounded-full h-2">
                          <div
                            className="bg-lime-400 h-2 rounded-full"
                            style={{
                              width: `${Math.min((count / 10) * 100, 100)}%`,
                            }}
                          />
                        </div>
                        <span className="text-white font-semibold w-6 text-right">
                          {count}
                        </span>
                      </div>
                    </div>
                  ))
                ) : null}
              </div>
            </div>

            {/* Injuries by Severity */}
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <h4 className="text-lg font-bold text-white mb-4">
                Injuries by Severity
              </h4>
              <div className="space-y-3">
                {statsLoading ? (
                  <p className="text-gray-400">Loading...</p>
                ) : stats?.injuriesBySeverity ? (
                  Object.entries(stats.injuriesBySeverity).map(
                    ([severity, count]) => {
                      let color = "bg-green-500";
                      if (severity === "Moderate") color = "bg-orange-500";
                      if (severity === "Severe") color = "bg-red-500";

                      return (
                        <div
                          key={severity}
                          className="flex justify-between items-center"
                        >
                          <span className="text-gray-400">{severity}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-gray-800 rounded-full h-2">
                              <div
                                className={`${color} h-2 rounded-full`}
                                style={{
                                  width: `${Math.min((count / 15) * 100, 100)}%`,
                                }}
                              />
                            </div>
                            <span className="text-white font-semibold w-6 text-right">
                              {count}
                            </span>
                          </div>
                        </div>
                      );
                    },
                  )
                ) : null}
              </div>
            </div>
          </div>

          {/* Recent Injuries Table */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-800">
              <h4 className="text-lg font-bold text-white">Recent Injuries</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800 border-b border-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">
                      Player
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">
                      Injury Type
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">
                      Reported
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {statsLoading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-gray-400">
                        Loading...
                      </td>
                    </tr>
                  ) : stats?.recentInjuries ? (
                    stats.recentInjuries.map((injury) => (
                      <tr
                        key={injury.id}
                        className="hover:bg-gray-800/50 transition"
                      >
                        <td className="px-6 py-4 text-sm text-white">
                          {injury.playerName}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-400">
                          {injury.type}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span
                            className={`inline-block px-3 py-1 rounded border text-xs font-medium ${
                              injury.status === "Active"
                                ? "bg-red-500/20 text-red-400 border-red-500/30"
                                : "bg-green-500/20 text-green-400 border-green-500/30"
                            }`}
                          >
                            {injury.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {new Date(injury.reportedDate).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
