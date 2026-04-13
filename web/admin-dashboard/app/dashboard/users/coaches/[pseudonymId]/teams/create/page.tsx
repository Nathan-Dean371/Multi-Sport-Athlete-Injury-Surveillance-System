"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";
import type { CreateTeamAdminRequest, Organization } from "@/lib/api";

export default function CreateTeamForCoachPage() {
  const router = useRouter();
  const params = useParams();

  const coachPseudonymId = useMemo(() => {
    const raw = (params as any)?.pseudonymId;
    return Array.isArray(raw) ? raw[0] : raw;
  }, [params]);

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loadingOrganizations, setLoadingOrganizations] = useState(true);

  const [form, setForm] = useState<CreateTeamAdminRequest>({
    name: "",
    sport: "",
    organizationId: "",
    coachPseudonymId: coachPseudonymId || "",
    ageGroup: "",
    gender: "",
    seasonStart: "",
    seasonEnd: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ teamId: string } | null>(null);

  useEffect(() => {
    setForm((p) => ({ ...p, coachPseudonymId: coachPseudonymId || "" }));
  }, [coachPseudonymId]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingOrganizations(true);
        const res = await apiClient.getOrganizations();
        setOrganizations(res.organizations);
      } catch (err: any) {
        console.error("Failed to load organizations:", err);
        setOrganizations([]);
      } finally {
        setLoadingOrganizations(false);
      }
    };

    load();
  }, []);

  const canSubmit =
    !!coachPseudonymId &&
    form.name.trim() &&
    form.sport.trim() &&
    form.organizationId &&
    !loadingOrganizations;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coachPseudonymId) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await apiClient.createTeam({
        name: form.name.trim(),
        sport: form.sport.trim(),
        organizationId: form.organizationId,
        coachPseudonymId,
        ageGroup: form.ageGroup?.trim() || undefined,
        gender: form.gender?.trim() || undefined,
        seasonStart: form.seasonStart?.trim() || undefined,
        seasonEnd: form.seasonEnd?.trim() || undefined,
      });

      setSuccess({ teamId: res.teamId });
      setForm((p) => ({
        ...p,
        name: "",
        sport: "",
        organizationId: "",
        ageGroup: "",
        gender: "",
        seasonStart: "",
        seasonEnd: "",
      }));
    } catch (err: any) {
      console.error("Failed to create team:", err);
      setError(err.message || "Failed to create team");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() =>
              router.push(
                `/dashboard/users/coaches/${encodeURIComponent(coachPseudonymId)}/edit`,
              )
            }
            className="text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Coach
          </button>
        </div>

        <div className="bg-gray-800 rounded-xl shadow-xl border border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5">
            <h1 className="text-2xl font-bold text-white">Create Team</h1>
            <p className="text-blue-100 mt-1">
              Coach pseudonym:{" "}
              <span className="font-mono">{coachPseudonymId}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Team Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                required
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="ATU U23"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Sport <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.sport}
                onChange={(e) =>
                  setForm((p) => ({ ...p, sport: e.target.value }))
                }
                required
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Rugby"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Organization <span className="text-red-400">*</span>
              </label>
              <select
                value={form.organizationId}
                onChange={(e) =>
                  setForm((p) => ({ ...p, organizationId: e.target.value }))
                }
                required
                disabled={loadingOrganizations}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white disabled:text-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">
                  {loadingOrganizations
                    ? "Loading organizations..."
                    : "Select an organization..."}
                </option>
                {organizations.map((o) => (
                  <option key={o.organizationId} value={o.organizationId}>
                    {o.organizationName}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Age Group <span className="text-gray-500">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={form.ageGroup || ""}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, ageGroup: e.target.value }))
                  }
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="U23"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Gender <span className="text-gray-500">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={form.gender || ""}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, gender: e.target.value }))
                  }
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Male"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Season Start <span className="text-gray-500">(Optional)</span>
                </label>
                <input
                  type="date"
                  value={form.seasonStart || ""}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, seasonStart: e.target.value }))
                  }
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Season End <span className="text-gray-500">(Optional)</span>
                </label>
                <input
                  type="date"
                  value={form.seasonEnd || ""}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, seasonEnd: e.target.value }))
                  }
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
                <p className="text-green-300 text-sm font-medium">
                  Team created successfully
                </p>
                <p className="text-green-200 text-sm mt-2">
                  Team ID: <span className="font-mono">{success.teamId}</span>
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading || !canSubmit}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2.5 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
              >
                {loading ? "Creating..." : "Create Team"}
              </button>
              <button
                type="button"
                onClick={() =>
                  router.push(
                    `/dashboard/users/coaches/${encodeURIComponent(coachPseudonymId)}/edit`,
                  )
                }
                className="px-6 py-2.5 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-800"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
