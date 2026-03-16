"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { apiClient, UserActivity } from "@/lib/api";
import { useRouter, useSearchParams } from "next/navigation";

export default function ClientUserActivity() {
  const { isAuthenticated, user, checkAuth } = useAuthStore();
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const searchParams = useSearchParams();
  const [userIdInput, setUserIdInput] = useState("");
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

  useEffect(() => {
    const param = searchParams?.get("userId");
    if (param) {
      setUserIdInput(param);
      // auto fetch
      fetchActivity(param);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const fetchActivity = async (userId?: string) => {
    setError(null);
    setLoading(true);
    try {
      const data = await apiClient.getUserActivity(userId || undefined, 100, 0);
      setActivities(data);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Failed to fetch activity");
      setActivities(null);
    } finally {
      setLoading(false);
    }
  };

  const computeDayStreak = (items: UserActivity[] | null) => {
    if (!items || items.length === 0) return 0;

    const successDays = new Set<string>();
    for (const it of items) {
      if (!it.success) continue;
      const d = new Date(it.occurredAt);
      const day = d.toISOString().slice(0, 10);
      successDays.add(day);
    }

    if (successDays.size === 0) return 0;

    const dates = Array.from(successDays).sort((a, b) => (a < b ? 1 : -1));
    let streak = 0;
    let current = new Date(dates[0]);

    while (true) {
      const dayStr = current.toISOString().slice(0, 10);
      if (successDays.has(dayStr)) {
        streak += 1;
        current.setUTCDate(current.getUTCDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  };

  if (!hydrated || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div>
      <section className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-white mb-3">Lookup</h2>
        <div className="flex gap-2 items-center">
          <input
            className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white w-full"
            placeholder="Enter user id"
            value={userIdInput}
            onChange={(e) => setUserIdInput(e.target.value)}
          />
          <button
            onClick={() => fetchActivity(userIdInput)}
            className="px-4 py-2 bg-lime-600 hover:bg-lime-500 text-black rounded"
          >
            Fetch
          </button>
        </div>
        <p className="text-sm text-gray-400 mt-2">
          You can paste a `user_accounts.id` here.
        </p>
      </section>

      <section className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">Activity</h3>
          <div className="text-sm text-gray-400">
            Day-based streak:{" "}
            <span className="text-lime-400 font-semibold">
              {computeDayStreak(activities)}
            </span>
          </div>
        </div>

        {loading && <div className="text-gray-400">Loading...</div>}
        {error && <div className="text-red-500">{error}</div>}

        {!loading && activities && activities.length === 0 && (
          <div className="text-gray-400">No activity found for this user.</div>
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
