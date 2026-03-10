"use client";

import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const { isAuthenticated, user, logout, checkAuth } = useAuthStore();
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    checkAuth();
    setHydrated(true);
  }, [checkAuth]);

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.push("/");
    }
  }, [hydrated, isAuthenticated, router]);

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
              href="/dashboard/injuries"
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg border border-red-500/30 transition"
            >
              🏥 Injuries
            </Link>
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

        {/* Quick Navigation */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-white mb-4">Quick Access</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/dashboard/injuries"
              className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-red-500/50 hover:bg-red-500/5 transition group"
            >
              <div className="text-3xl mb-3">🏥</div>
              <h4 className="text-lg font-bold text-white mb-2 group-hover:text-red-400 transition">
                Injuries Dashboard
              </h4>
              <p className="text-sm text-gray-400">
                View and analyze injury data with custom reports
              </p>
            </Link>

            <Link
              href="/dashboard/users/players"
              className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-lime-500/50 hover:bg-lime-500/5 transition group"
            >
              <div className="text-3xl mb-3">👥</div>
              <h4 className="text-lg font-bold text-white mb-2 group-hover:text-lime-400 transition">
                Players
              </h4>
              <p className="text-sm text-gray-400">
                Manage players and analyze their injury patterns
              </p>
            </Link>

            <Link
              href="/dashboard/users/coaches"
              className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-blue-500/50 hover:bg-blue-500/5 transition group"
            >
              <div className="text-3xl mb-3">👨‍🏫</div>
              <h4 className="text-lg font-bold text-white mb-2 group-hover:text-blue-400 transition">
                Coaches
              </h4>
              <p className="text-sm text-gray-400">
                Manage coaches and view team injury reports
              </p>
            </Link>

            <Link
              href="/dashboard/users/parents"
              className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-purple-500/50 hover:bg-purple-500/5 transition group"
            >
              <div className="text-3xl mb-3">👪</div>
              <h4 className="text-lg font-bold text-white mb-2 group-hover:text-purple-400 transition">
                Parents
              </h4>
              <p className="text-sm text-gray-400">
                Manage parents and track child injury information
              </p>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
