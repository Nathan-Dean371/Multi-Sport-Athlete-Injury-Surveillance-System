"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { apiClient } from "@/lib/api";
import type {
  AdminResetPasswordResponse,
  CoachAdminProfile,
  UpdateCoachAdminRequest,
} from "@/lib/api";

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
};

export default function EditCoachPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, user, checkAuth } = useAuthStore();

  const pseudonymId = useMemo(() => {
    const raw = (params as any)?.pseudonymId;
    return Array.isArray(raw) ? raw[0] : raw;
  }, [params]);

  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [profile, setProfile] = useState<CoachAdminProfile | null>(null);
  const [form, setForm] = useState<FormState>({
    firstName: "",
    lastName: "",
    email: "",
    isActive: true,
  });

  const [resetResult, setResetResult] =
    useState<AdminResetPasswordResponse | null>(null);
  const [resettingPassword, setResettingPassword] = useState(false);

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
    const fetchProfile = async () => {
      if (!hydrated || !isAuthenticated || !pseudonymId) return;
      try {
        setLoading(true);
        setError(null);
        setSuccess(null);

        const data = await apiClient.getCoachAdminProfile(pseudonymId);
        setProfile(data);
        setForm({
          firstName: data.firstName ?? "",
          lastName: data.lastName ?? "",
          email: data.email ?? "",
          isActive: !!data.isActive,
        });
      } catch (err: any) {
        console.error("Failed to fetch coach profile:", err);
        setError(err.message || "Failed to load coach profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [hydrated, isAuthenticated, pseudonymId]);

  if (!hydrated || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        Loading...
      </div>
    );
  }

  const buildPayload = (): UpdateCoachAdminRequest => {
    const payload: UpdateCoachAdminRequest = {
      isActive: form.isActive,
    };

    const firstName = form.firstName.trim();
    const lastName = form.lastName.trim();
    const email = form.email.trim();

    if (firstName) payload.firstName = firstName;
    if (lastName) payload.lastName = lastName;
    if (email) payload.email = email;

    return payload;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pseudonymId) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const updated = await apiClient.updateCoachAdminProfile(
        pseudonymId,
        buildPayload(),
      );
      setProfile(updated);
      setForm({
        firstName: updated.firstName ?? "",
        lastName: updated.lastName ?? "",
        email: updated.email ?? "",
        isActive: !!updated.isActive,
      });
      setSuccess("Coach updated successfully");
    } catch (err: any) {
      console.error("Failed to update coach:", err);
      setError(err.message || "Failed to update coach");
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!pseudonymId) return;

    const ok = window.confirm(
      "Reset this user’s password? The new temporary password will be shown once.",
    );
    if (!ok) return;

    try {
      setResettingPassword(true);
      setError(null);
      setSuccess(null);
      setResetResult(null);

      const result = await apiClient.adminResetUserPassword(pseudonymId);
      setResetResult(result);
      setSuccess("Password reset successfully");
    } catch (err: any) {
      console.error("Failed to reset password:", err);
      setError(err.message || "Failed to reset password");
    } finally {
      setResettingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.push("/dashboard/users/coaches")}
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
            Back to Coaches
          </button>
        </div>

        <div className="bg-gray-800 rounded-xl shadow-xl border border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5">
            <h1 className="text-2xl font-bold text-white">Edit Coach</h1>
            <p className="text-blue-100 mt-1">
              {profile?.coachId
                ? `Coach ID: ${profile.coachId}`
                : "Update coach account details"}
            </p>
            {pseudonymId && (
              <p className="text-blue-100 mt-1 text-sm">
                Pseudonym: <span className="font-mono">{pseudonymId}</span>
              </p>
            )}
          </div>

          {loading ? (
            <div className="p-6 text-gray-300">Loading coach...</div>
          ) : (
            <form onSubmit={handleSave} className="p-6 space-y-6">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  value={form.firstName}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, firstName: e.target.value }))
                  }
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="First name"
                />
              </div>

              <div>
                <label
                  htmlFor="lastName"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  value={form.lastName}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, lastName: e.target.value }))
                  }
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Last name"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="email@example.com"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  id="isActive"
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, isActive: e.target.checked }))
                  }
                  className="h-4 w-4"
                />
                <label htmlFor="isActive" className="text-sm text-gray-300">
                  Active
                </label>
              </div>

              {error && (
                <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              {success && (
                <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
                  <p className="text-green-300 text-sm">{success}</p>
                </div>
              )}

              {resetResult && (
                <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
                  <p className="text-yellow-200 text-sm font-medium">
                    Temporary password (copy now):
                  </p>
                  <p className="text-yellow-100 text-sm font-mono break-all mt-2">
                    {resetResult.temporaryPassword}
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2.5 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  disabled={resettingPassword}
                  onClick={handleResetPassword}
                  className="px-6 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-800"
                >
                  {resettingPassword ? "Resetting..." : "Reset Password"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
