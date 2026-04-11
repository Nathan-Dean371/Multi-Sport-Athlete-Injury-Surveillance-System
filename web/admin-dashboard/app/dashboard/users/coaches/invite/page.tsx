"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";
import type { CreateCoachInvitationRequest } from "@/lib/api";

export default function InviteCoachPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<CreateCoachInvitationRequest>({
    coachEmail: "",
    coachFirstName: "",
    coachLastName: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    message: string;
    invitationLink: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await apiClient.inviteCoach(formData);
      setSuccess({
        message: response.message,
        invitationLink: response.invitationLink,
      });
      // Clear form
      setFormData({
        coachEmail: "",
        coachFirstName: "",
        coachLastName: "",
      });
    } catch (err: any) {
      console.error("Failed to send invitation:", err);
      setError(err.message || "Failed to send invitation");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Breadcrumb / Navigation */}
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

        {/* Main Card */}
        <div className="bg-gray-800 rounded-xl shadow-xl border border-gray-700 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5">
            <h1 className="text-2xl font-bold text-white">Invite Coach</h1>
            <p className="text-blue-100 mt-1">
              Send an invitation to a new coach to join the platform
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Email Field - Required */}
            <div>
              <label
                htmlFor="coachEmail"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Email Address <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                id="coachEmail"
                name="coachEmail"
                value={formData.coachEmail}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="coach@example.com"
              />
              <p className="mt-1 text-sm text-gray-400">
                The invitation will be sent to this email address
              </p>
            </div>

            {/* First Name Field - Optional */}
            <div>
              <label
                htmlFor="coachFirstName"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                First Name <span className="text-gray-500">(Optional)</span>
              </label>
              <input
                type="text"
                id="coachFirstName"
                name="coachFirstName"
                value={formData.coachFirstName}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="John"
              />
            </div>

            {/* Last Name Field - Optional */}
            <div>
              <label
                htmlFor="coachLastName"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Last Name <span className="text-gray-500">(Optional)</span>
              </label>
              <input
                type="text"
                id="coachLastName"
                name="coachLastName"
                value={formData.coachLastName}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Smith"
              />
              <p className="mt-1 text-sm text-gray-400">
                If provided, the invitation email will be personalized
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
                <div className="flex items-start">
                  <svg
                    className="w-5 h-5 text-red-400 mt-0.5 mr-3 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <h3 className="text-red-400 font-medium">Error</h3>
                    <p className="text-red-300 text-sm mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
                <div className="flex items-start">
                  <svg
                    className="w-5 h-5 text-green-400 mt-0.5 mr-3 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div className="flex-1">
                    <h3 className="text-green-400 font-medium">
                      Invitation Sent Successfully!
                    </h3>
                    <p className="text-green-300 text-sm mt-1">
                      {success.message}
                    </p>
                    <div className="mt-3 p-3 bg-gray-900/50 rounded border border-gray-700">
                      <p className="text-xs text-gray-400 mb-1">
                        Invitation Link:
                      </p>
                      <p className="text-xs text-blue-400 font-mono break-all">
                        {success.invitationLink}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading || !formData.coachEmail}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2.5 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Sending Invitation...
                  </span>
                ) : (
                  "Send Invitation"
                )}
              </button>
              <button
                type="button"
                onClick={() => router.push("/dashboard/users/coaches")}
                className="px-6 py-2.5 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-800"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-900/20 border border-blue-700 rounded-lg p-4">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div>
              <h3 className="text-blue-400 font-medium text-sm">
                About Coach Invitations
              </h3>
              <ul className="text-blue-300 text-sm mt-2 space-y-1">
                <li>• Invitations are valid for 7 days</li>
                <li>
                  • The coach will receive an email with a link to create their
                  account
                </li>
                <li>
                  • They can set their password and complete their profile
                  during registration
                </li>
                <li>• You can view pending invitations on the coaches page</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
