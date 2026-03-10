"use client";

import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import ReportBuilder from "../components/ReportBuilder";

export default function InjuriesPage() {
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
        <div className="text-white">Loading...</div>
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
              Injuries Dashboard
            </h1>
            <p className="text-gray-400 text-sm mt-1">Welcome, {displayName}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg border border-gray-700 transition"
            >
              ← Back to Dashboard
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
        {/* Page Info */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">
            Injury Management & Analytics
          </h2>
          <p className="text-gray-400">
            View, track, and analyze injury data for all athletes in the system.
          </p>
        </div>

        {/* Report Builder Component */}
        <div className="mb-8">
          <ReportBuilder entityType="injuries" />
        </div>

        {/* Additional Info */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-bold text-white mb-4">How to Use</h3>
          <div className="space-y-3 text-gray-300 text-sm">
            <div className="flex items-start gap-3">
              <span className="text-lime-400 font-bold">1.</span>
              <p>
                <strong className="text-white">
                  Expand the Report Builder
                </strong>{" "}
                above by clicking on it
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-lime-400 font-bold">2.</span>
              <p>
                <strong className="text-white">Apply filters</strong> (status,
                severity, injury type, body part, date range)
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-lime-400 font-bold">3.</span>
              <p>
                <strong className="text-white">Select metrics</strong> you want
                to see (injury counts, recovery times, distributions, etc.)
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-lime-400 font-bold">4.</span>
              <p>
                <strong className="text-white">
                  Choose an aggregate function
                </strong>{" "}
                (Count, Average, Total, Min, Max)
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-lime-400 font-bold">5.</span>
              <p>
                <strong className="text-white">Generate the report</strong> and
                export to CSV if needed
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
