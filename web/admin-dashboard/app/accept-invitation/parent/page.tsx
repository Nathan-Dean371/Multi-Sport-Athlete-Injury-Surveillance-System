"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getApiBaseUrl } from "@/lib/runtime-config";

const API_URL = getApiBaseUrl();

type AcceptParentInvitationRequest = {
  token: string;
  firstName: string;
  lastName: string;
  password: string;
};

function ParentAcceptContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Invalid invitation link. No token provided.");
    }
  }, [token]);

  const validateForm = (): boolean => {
    if (!token) {
      setError("Invalid invitation link. No token provided.");
      return false;
    }
    if (!firstName.trim() || !lastName.trim()) {
      setError("First and last name are required");
      return false;
    }
    if (!password) {
      setError("Password is required");
      return false;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return false;
    }
    if (password !== confirmPassword) {
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
      const payload: AcceptParentInvitationRequest = {
        token,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        password,
      };

      const response = await fetch(`${API_URL}/parents/accept`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.message || "Failed to accept invitation");
      }

      setSuccess(true);
    } catch (err: any) {
      console.error("Failed to accept parent invitation:", err);
      setError(err.message || "Failed to accept invitation. Please try again.");
    } finally {
      setLoading(false);
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

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-gray-800 rounded-xl shadow-xl border border-gray-700 overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-green-600 to-green-700 px-8 py-8 text-center">
              <svg
                className="w-20 h-20 text-white mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h1 className="text-3xl font-bold text-white mb-2">
                Account Created Successfully!
              </h1>
              <p className="text-green-100">Welcome to the platform</p>
            </div>

            <div className="p-8">
              <div className="bg-gray-700/50 rounded-lg p-6 mb-6">
                <h2 className="text-xl font-semibold text-white mb-4">
                  Your Account Details
                </h2>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    <span className="text-gray-300">
                      {firstName} {lastName}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    <span className="text-gray-300">Role: Parent</span>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <svg
                    className="w-6 h-6 text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  Next Steps
                </h2>
                <ol className="space-y-3 text-gray-300">
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-sm flex items-center justify-center font-medium">
                      1
                    </span>
                    <span>
                      Download the mobile app using one of the options below
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-sm flex items-center justify-center font-medium">
                      2
                    </span>
                    <span>
                      Open the app and log in using your invited email and
                      password
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-sm flex items-center justify-center font-medium">
                      3
                    </span>
                    <span>Invite your athlete(s) from the Parent tab</span>
                  </li>
                </ol>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded-xl shadow-xl border border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-8 py-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
                Download the Mobile App
              </h2>
            </div>

            <div className="p-8">
              <p className="text-gray-300 mb-6">
                The Injury Surveillance mobile app is where you&apos;ll manage
                your athletes and view updates.
              </p>

              <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-6 mb-6">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <h3 className="text-blue-300 font-semibold mb-2">
                      Development/Testing Access
                    </h3>
                    <p className="text-blue-200 text-sm mb-3">
                      The app is currently in development. Use Expo Go to access
                      the test version:
                    </p>
                    <ol className="text-blue-200 text-sm space-y-2">
                      <li>1. Download Expo Go from your app store</li>
                      <li>
                        2. Contact your administrator for the QR code or project
                        link
                      </li>
                      <li>3. Scan the QR code or open the link in Expo Go</li>
                    </ol>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <button
                  disabled
                  className="flex items-center gap-4 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed p-4 rounded-lg transition-colors border border-gray-600"
                >
                  <svg
                    className="w-12 h-12 text-white"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.1 22C7.79 22.05 6.8 20.68 5.96 19.47C4.25 17 2.94 12.45 4.7 9.39C5.57 7.87 7.13 6.91 8.82 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5M13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z" />
                  </svg>
                  <div className="text-left">
                    <div className="text-xs text-gray-400">Download on the</div>
                    <div className="text-lg font-semibold text-white">
                      App Store
                    </div>
                    <div className="text-xs text-gray-500">(Coming Soon)</div>
                  </div>
                </button>

                <button
                  disabled
                  className="flex items-center gap-4 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed p-4 rounded-lg transition-colors border border-gray-600"
                >
                  <svg
                    className="w-12 h-12 text-white"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                  </svg>
                  <div className="text-left">
                    <div className="text-xs text-gray-400">GET IT ON</div>
                    <div className="text-lg font-semibold text-white">
                      Google Play
                    </div>
                    <div className="text-xs text-gray-500">(Coming Soon)</div>
                  </div>
                </button>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-700 flex flex-wrap gap-3">
                <button
                  onClick={() => router.push("/")}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                >
                  Go to Login Page
                </button>
              </div>
            </div>
          </div>

          <div className="text-center mt-8 text-gray-500 text-sm">
            <p>© 2026 Multi-Sport Athlete Injury Surveillance System</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Welcome!</h1>
          <p className="text-gray-400">Complete your parent account setup</p>
        </div>

        <div className="bg-gray-800 rounded-xl shadow-xl border border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5">
            <h2 className="text-xl font-bold text-white">
              Create Your Parent Account
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded-lg">
                <p className="text-sm">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  First Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Jane"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Last Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Doe"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password <span className="text-red-400">*</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter a secure password"
                disabled={loading}
              />
              <p className="text-gray-400 text-xs mt-1">Minimum 8 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Confirm Password <span className="text-red-400">*</span>
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Re-enter your password"
                disabled={loading}
              />
            </div>

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

          <div className="bg-gray-700/30 px-6 py-4 border-t border-gray-700">
            <p className="text-gray-400 text-sm text-center">
              By creating an account, you agree to use the injury surveillance
              system responsibly.
            </p>
          </div>
        </div>

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

export default function AcceptParentInvitationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      }
    >
      <ParentAcceptContent />
    </Suspense>
  );
}
