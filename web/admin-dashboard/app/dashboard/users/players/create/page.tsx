"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";
import type {
  Coach,
  CreatePlayerAdminRequest,
  CreatePlayerAdminParent,
  TeamDetails,
} from "@/lib/api";

type ParentMode = "existing" | "new";

export default function CreatePlayerPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ pseudonymId: string } | null>(null);

  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [teams, setTeams] = useState<TeamDetails[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);

  const [coachPseudonymId, setCoachPseudonymId] = useState<string>("");
  const [teamId, setTeamId] = useState<string>("");

  const [parentMode, setParentMode] = useState<ParentMode>("existing");

  const [playerForm, setPlayerForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    dateOfBirth: "",
    password: "",
  });

  const [existingParentPseudonymId, setExistingParentPseudonymId] =
    useState<string>("");

  const [newParentForm, setNewParentForm] = useState<CreatePlayerAdminParent>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
  });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiClient.getCoaches();
        setCoaches(res.coaches);
      } catch (err) {
        console.error("Failed to load coaches:", err);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const loadTeams = async () => {
      if (!coachPseudonymId) {
        setTeams([]);
        setTeamId("");
        return;
      }

      try {
        setLoadingTeams(true);
        const res = await apiClient.getCoachTeamsForAdmin(coachPseudonymId);
        setTeams(res);
        setTeamId("");
      } catch (err: any) {
        console.error("Failed to load coach teams:", err);
        setTeams([]);
        setTeamId("");
      } finally {
        setLoadingTeams(false);
      }
    };

    loadTeams();
  }, [coachPseudonymId]);

  const selectedCoach = useMemo(() => {
    return coaches.find((c) => c.pseudonymId === coachPseudonymId) || null;
  }, [coaches, coachPseudonymId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const payload: CreatePlayerAdminRequest = {
        firstName: playerForm.firstName.trim(),
        lastName: playerForm.lastName.trim(),
        email: playerForm.email.trim(),
        password: playerForm.password,
        dateOfBirth: playerForm.dateOfBirth,
        coachPseudonymId,
        teamId,
      };

      if (parentMode === "existing") {
        payload.parentPseudonymId = existingParentPseudonymId.trim();
      } else {
        payload.parent = {
          firstName: newParentForm.firstName.trim(),
          lastName: newParentForm.lastName.trim(),
          email: newParentForm.email.trim(),
          password: newParentForm.password,
          phone: newParentForm.phone?.trim() || undefined,
        };
      }

      const res = await apiClient.createPlayer(payload);
      const createdPseudo = res?.player?.pseudonymId;
      setSuccess({ pseudonymId: createdPseudo || "(created)" });

      setPlayerForm({
        firstName: "",
        lastName: "",
        email: "",
        dateOfBirth: "",
        password: "",
      });
      setCoachPseudonymId("");
      setTeams([]);
      setTeamId("");
      setExistingParentPseudonymId("");
      setNewParentForm({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        phone: "",
      });
      setParentMode("existing");
    } catch (err: any) {
      console.error("Failed to create player:", err);
      setError(err.message || "Failed to create player");
    } finally {
      setLoading(false);
    }
  };

  const canSubmit =
    playerForm.firstName.trim() &&
    playerForm.lastName.trim() &&
    playerForm.email.trim() &&
    playerForm.dateOfBirth &&
    playerForm.password.length >= 8 &&
    coachPseudonymId &&
    teamId &&
    (parentMode === "existing"
      ? !!existingParentPseudonymId.trim()
      : !!newParentForm.firstName.trim() &&
        !!newParentForm.lastName.trim() &&
        !!newParentForm.email.trim() &&
        newParentForm.password.length >= 8);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.push("/dashboard/users/players")}
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
            Back to Players
          </button>
        </div>

        <div className="bg-gray-800 rounded-xl shadow-xl border border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5">
            <h1 className="text-2xl font-bold text-white">Add Player</h1>
            <p className="text-blue-100 mt-1">
              Create a new player linked to a parent, coach, and team
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            <div className="space-y-6">
              <h2 className="text-white font-semibold">Player</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    First Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={playerForm.firstName}
                    onChange={(e) =>
                      setPlayerForm((p) => ({
                        ...p,
                        firstName: e.target.value,
                      }))
                    }
                    required
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Last Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={playerForm.lastName}
                    onChange={(e) =>
                      setPlayerForm((p) => ({ ...p, lastName: e.target.value }))
                    }
                    required
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    value={playerForm.email}
                    onChange={(e) =>
                      setPlayerForm((p) => ({ ...p, email: e.target.value }))
                    }
                    required
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Date of Birth <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={playerForm.dateOfBirth}
                    onChange={(e) =>
                      setPlayerForm((p) => ({
                        ...p,
                        dateOfBirth: e.target.value,
                      }))
                    }
                    required
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Initial Password <span className="text-red-400">*</span>
                </label>
                <input
                  type="password"
                  value={playerForm.password}
                  onChange={(e) =>
                    setPlayerForm((p) => ({ ...p, password: e.target.value }))
                  }
                  required
                  minLength={8}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Minimum 8 characters"
                />
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="text-white font-semibold">Coach & Team</h2>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Coach <span className="text-red-400">*</span>
                </label>
                <select
                  value={coachPseudonymId}
                  onChange={(e) => setCoachPseudonymId(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a coach...</option>
                  {coaches.map((c) => (
                    <option key={c.coachId} value={c.pseudonymId}>
                      {c.firstName && c.lastName
                        ? `${c.firstName} ${c.lastName}`
                        : c.email || c.pseudonymId}
                    </option>
                  ))}
                </select>
                {selectedCoach?.pseudonymId && (
                  <p className="mt-1 text-sm text-gray-400">
                    Selected coach pseudonym:{" "}
                    <span className="font-mono">
                      {selectedCoach.pseudonymId}
                    </span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Team <span className="text-red-400">*</span>
                </label>
                <select
                  value={teamId}
                  onChange={(e) => setTeamId(e.target.value)}
                  required
                  disabled={!coachPseudonymId || loadingTeams}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white disabled:text-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">
                    {loadingTeams
                      ? "Loading teams..."
                      : coachPseudonymId
                        ? teams.length
                          ? "Select a team..."
                          : "No teams found for this coach"
                        : "Select a coach first"}
                  </option>
                  {teams.map((t) => (
                    <option key={t.teamId} value={t.teamId}>
                      {t.name} {t.sport ? `(${t.sport})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="text-white font-semibold">Parent</h2>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm text-gray-300">
                  <input
                    type="radio"
                    name="parentMode"
                    checked={parentMode === "existing"}
                    onChange={() => setParentMode("existing")}
                  />
                  Use existing parent
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-300">
                  <input
                    type="radio"
                    name="parentMode"
                    checked={parentMode === "new"}
                    onChange={() => setParentMode("new")}
                  />
                  Create new parent
                </label>
              </div>

              {parentMode === "existing" ? (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Parent Pseudonym ID <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={existingParentPseudonymId}
                    onChange={(e) =>
                      setExistingParentPseudonymId(e.target.value)
                    }
                    required
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="PSY-PARENT-..."
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Parent First Name{" "}
                        <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={newParentForm.firstName}
                        onChange={(e) =>
                          setNewParentForm((p) => ({
                            ...p,
                            firstName: e.target.value,
                          }))
                        }
                        required
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Parent Last Name <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={newParentForm.lastName}
                        onChange={(e) =>
                          setNewParentForm((p) => ({
                            ...p,
                            lastName: e.target.value,
                          }))
                        }
                        required
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Parent Email <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="email"
                        value={newParentForm.email}
                        onChange={(e) =>
                          setNewParentForm((p) => ({
                            ...p,
                            email: e.target.value,
                          }))
                        }
                        required
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Parent Phone{" "}
                        <span className="text-gray-500">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        value={newParentForm.phone || ""}
                        onChange={(e) =>
                          setNewParentForm((p) => ({
                            ...p,
                            phone: e.target.value,
                          }))
                        }
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Parent Initial Password{" "}
                      <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="password"
                      value={newParentForm.password}
                      onChange={(e) =>
                        setNewParentForm((p) => ({
                          ...p,
                          password: e.target.value,
                        }))
                      }
                      required
                      minLength={8}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Minimum 8 characters"
                    />
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
                <p className="text-green-300 text-sm font-medium">
                  Player created successfully
                </p>
                <p className="text-green-200 text-sm mt-2">
                  Pseudonym:{" "}
                  <span className="font-mono">{success.pseudonymId}</span>
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading || !canSubmit}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2.5 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
              >
                {loading ? "Creating..." : "Create Player"}
              </button>
              <button
                type="button"
                onClick={() => router.push("/dashboard/users/players")}
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
