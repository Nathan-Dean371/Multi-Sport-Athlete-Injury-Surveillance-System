"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { apiClient, UserActivity } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function ClientUserActivity() {
  const { isAuthenticated, user, checkAuth } = useAuthStore();
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activities, setActivities] = useState<UserActivity[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
    setHydrated(true);
  }, [checkAuth]);

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.push("/");
    }
  }, [hydrated, isAuthenticated, router]);

  const fetchActivity = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await apiClient.getUserActivity(undefined, 100, 0);
      setActivities(data);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to fetch activity");
      setActivities(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hydrated || !isAuthenticated) return;
    fetchActivity();
  }, [fetchActivity, hydrated, isAuthenticated]);

  if (!hydrated || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div>
      <section className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">Activity</h3>
        </div>

        {loading && <div className="text-gray-400">Loading...</div>}
        {error && <div className="text-red-500">{error}</div>}

        {!loading && activities && activities.length === 0 && (
          <div className="text-gray-400">No activity found.</div>
        )}

        {!loading && activities && activities.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead>
                <tr className="text-gray-400">
                  <th className="px-4 py-2">Pseudonym</th>
                  <th className="px-4 py-2">Time (UTC)</th>
                  <th className="px-4 py-2">Success</th>
                  <th className="px-4 py-2">IP</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((a) => (
                  <tr key={a.id} className="border-t border-gray-800">
                    <td className="px-4 py-2 text-gray-200 font-mono">
                      {a.pseudonymId || "-"}
                    </td>
                    <td className="px-4 py-2 text-gray-200">
                      {new Date(a.occurredAt).toISOString()}
                    </td>
                    <td
                      className={`px-4 py-2 ${a.success ? "text-green-400" : "text-red-400"}`}
                    >
                      {a.success ? "Success" : "Failed"}
                    </td>
                    <td className="px-4 py-2 text-gray-200">
                      {a.ipAddress || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
