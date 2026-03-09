"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiClient } from "@/lib/api";
import type { AcceptCoachInvitationRequest } from "@/lib/api";

function AcceptInvitationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [formData, setFormData] = useState<AcceptCoachInvitationRequest>({
    token: token || "",
    password: "",
    specialization: "",
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError("Invalid invitation link. No token provided.");
    } else {
      setFormData((prev) => ({ ...prev, token }));
    }
  }, [token]);

  const validateForm = (): boolean => {
    if (!formData.password) {
      setError("Password is required");
      return false;
    }
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      return false;
    }
    if (formData.password !== confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await apiClient.acceptCoachInvitation({
        token: formData.token,
        password: formData.password,
        specialization: formData.specialization || undefined,
      });

      // Store coach email for welcome page
      const coachEmail = response.coach.email;
      const coachName =
        response.coach.firstName && response.coach.lastName
          ? `${response.coach.firstName} ${response.coach.lastName}`
          : response.coach.email;

      // Redirect to welcome page with success message
      router.push(
        `/accept-invitation/welcome?email=${encodeURIComponent(coachEmail)}&name=${encodeURIComponent(coachName)}`,
      );
    } catch (err: any) {
      console.error("Failed to accept invitation:", err);
      setError(err.message || "Failed to accept invitation. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    if (name === "confirmPassword") {
      setConfirmPassword(value);
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-gray-800 rounded-xl shadow-xl border border-gray-700 p-8">
          <div className="text-center">
            <svg
              className="w-16 h-16 text-red-500 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h1 className="text-2xl font-bold text-white mb-2">
              Invalid Invitation Link
            </h1>
            <p className="text-gray-400">
              The invitation link is missing or invalid. Please check your email
              for the correct link.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome to the Team!
          </h1>
          <p className="text-gray-400">
            Complete your account setup to get started
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-gray-800 rounded-xl shadow-xl border border-gray-700 overflow-hidden">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5">
            <h2 className="text-xl font-bold text-white">
              Create Your Coach Account
            </h2>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded-lg">
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Password <span className="text-red-400">*</span>
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={8}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter a secure password"
              />
              <p className="text-gray-400 text-xs mt-1">Minimum 8 characters</p>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Confirm Password <span className="text-red-400">*</span>
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={confirmPassword}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Re-enter your password"
              />
            </div>

            {/* Specialization Field */}
            <div>
              <label
                htmlFor="specialization"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Specialization <span className="text-gray-500">(Optional)</span>
              </label>
              <input
                type="text"
                id="specialization"
                name="specialization"
                value={formData.specialization}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Youth Soccer, Basketball"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Creating Account...
                </>
              ) : (
                <>
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
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Create Account
                </>
              )}
            </button>
          </form>

          {/* Footer Info */}
          <div className="bg-gray-700/30 px-6 py-4 border-t border-gray-700">
            <p className="text-gray-400 text-sm text-center">
              By creating an account, you agree to use the injury surveillance
              system responsibly.
            </p>
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-gray-500 text-sm">
            Need help?{" "}
            <a
              href="mailto:support@example.com"
              className="text-blue-400 hover:text-blue-300"
            >
              Contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AcceptCoachInvitationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      }
    >
      <AcceptInvitationContent />
    </Suspense>
  );
}
