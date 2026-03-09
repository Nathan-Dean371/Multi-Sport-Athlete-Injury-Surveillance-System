"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";
import type {
  PendingCoachInvitation,
  AcceptedCoachInvitation,
} from "@/lib/api";

export default function CoachInvitationsPage() {
  const router = useRouter();
  const [pendingInvitations, setPendingInvitations] = useState<
    PendingCoachInvitation[]
  >([]);
  const [acceptedInvitations, setAcceptedInvitations] = useState<
    AcceptedCoachInvitation[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"pending" | "accepted">("pending");

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      setError(null);
      const [pendingData, acceptedData] = await Promise.all([
        apiClient.getPendingCoachInvitations(),
        apiClient.getAcceptedCoachInvitations(),
      ]);
      setPendingInvitations(pendingData.invitations);
      setAcceptedInvitations(acceptedData.invitations);
    } catch (error: any) {
      console.error("Failed to fetch invitations:", error);
      setError(error.message || "Failed to load invitations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

  const handleCancel = async (invitationId: string) => {
    if (!confirm("Are you sure you want to cancel this invitation?")) {
      return;
    }

    try {
      setCancellingId(invitationId);
      await apiClient.cancelCoachInvitation(invitationId);
      // Refresh the list after cancellation
      await fetchInvitations();
    } catch (error: any) {
      console.error("Failed to cancel invitation:", error);
      alert(error.message || "Failed to cancel invitation");
    } finally {
      setCancellingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isExpiringSoon = (expiresAt: string) => {
    const expiry = new Date(expiresAt);
    const now = new Date();
    const hoursUntilExpiry =
      (expiry.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntilExpiry < 24;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb / Navigation */}
        <div className="mb-6 flex items-center justify-between">
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

          <button
            onClick={() => router.push("/dashboard/users/coaches/invite")}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            Invite New Coach
          </button>
        </div>

        {/* Main Card */}
        <div className="bg-gray-800 rounded-xl shadow-xl border border-gray-700 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5">
            <h1 className="text-2xl font-bold text-white">Coach Invitations</h1>
            <p className="text-blue-100 mt-1">
              Manage pending and accepted coach invitations
            </p>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-700">
            <div className="flex">
              <button
                onClick={() => setActiveTab("pending")}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === "pending"
                    ? "text-blue-400 border-b-2 border-blue-400"
                    : "text-gray-400 hover:text-gray-300"
                }`}
              >
                Pending ({pendingInvitations.length})
              </button>
              <button
                onClick={() => setActiveTab("accepted")}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === "accepted"
                    ? "text-green-400 border-b-2 border-green-400"
                    : "text-gray-400 hover:text-gray-300"
                }`}
              >
                Accepted ({acceptedInvitations.length})
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Loading State */}
            {loading && (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded-lg">
                <p className="font-medium">Error loading invitations</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            )}

            {/* Pending Invitations Tab */}
            {!loading && !error && activeTab === "pending" && (
              <>
                {/* Empty State */}
                {pendingInvitations.length === 0 && (
                  <div className="text-center py-12">
                    <svg
                      className="w-16 h-16 text-gray-600 mx-auto mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    <p className="text-gray-400 text-lg font-medium">
                      No pending invitations
                    </p>
                    <p className="text-gray-500 text-sm mt-2">
                      All invitations have been accepted or expired
                    </p>
                  </div>
                )}

                {/* Pending Invitations Table */}
                {pendingInvitations.length > 0 && (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-700">
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">
                              Coach
                            </th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">
                              Email
                            </th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">
                              Invited
                            </th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">
                              Expires
                            </th>
                            <th className="text-center py-3 px-4 text-sm font-semibold text-gray-300">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {pendingInvitations.map((invitation) => (
                            <tr
                              key={invitation.invitationId}
                              className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors"
                            >
                              <td className="py-4 px-4">
                                <div className="text-white font-medium">
                                  {invitation.coachFirstName &&
                                  invitation.coachLastName
                                    ? `${invitation.coachFirstName} ${invitation.coachLastName}`
                                    : "N/A"}
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <div className="text-gray-300 text-sm">
                                  {invitation.coachEmail}
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <div className="text-gray-400 text-sm">
                                  {formatDate(invitation.createdAt)}
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-2">
                                  {isExpiringSoon(invitation.expiresAt) && (
                                    <svg
                                      className="w-4 h-4 text-orange-500"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  )}
                                  <span
                                    className={`text-sm ${
                                      isExpiringSoon(invitation.expiresAt)
                                        ? "text-orange-400"
                                        : "text-gray-400"
                                    }`}
                                  >
                                    {formatDate(invitation.expiresAt)}
                                  </span>
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex justify-center">
                                  <button
                                    onClick={() =>
                                      handleCancel(invitation.invitationId)
                                    }
                                    disabled={
                                      cancellingId === invitation.invitationId
                                    }
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                                  >
                                    {cancellingId ===
                                    invitation.invitationId ? (
                                      <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        Cancelling...
                                      </>
                                    ) : (
                                      <>
                                        <svg
                                          className="w-4 h-4"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M6 18L18 6M6 6l12 12"
                                          />
                                        </svg>
                                        Cancel
                                      </>
                                    )}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Stats */}
                    <div className="mt-6 pt-6 border-t border-gray-700">
                      <div className="flex items-center gap-6">
                        <div>
                          <span className="text-gray-400 text-sm">
                            Total Pending:
                          </span>
                          <span className="text-white font-semibold ml-2">
                            {pendingInvitations.length}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400 text-sm">
                            Expiring Soon:
                          </span>
                          <span className="text-orange-400 font-semibold ml-2">
                            {
                              pendingInvitations.filter((inv) =>
                                isExpiringSoon(inv.expiresAt),
                              ).length
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}

            {/* Accepted Invitations Tab */}
            {!loading && !error && activeTab === "accepted" && (
              <>
                {/* Empty State */}
                {acceptedInvitations.length === 0 && (
                  <div className="text-center py-12">
                    <svg
                      className="w-16 h-16 text-gray-600 mx-auto mb-4"
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
                    <p className="text-gray-400 text-lg font-medium">
                      No accepted invitations yet
                    </p>
                    <p className="text-gray-500 text-sm mt-2">
                      Accepted invitations will appear here
                    </p>
                  </div>
                )}

                {/* Accepted Invitations Table */}
                {acceptedInvitations.length > 0 && (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-700">
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">
                              Coach
                            </th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">
                              Email
                            </th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">
                              Invited
                            </th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-300">
                              Accepted
                            </th>
                            <th className="text-center py-3 px-4 text-sm font-semibold text-gray-300">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {acceptedInvitations.map((invitation) => (
                            <tr
                              key={invitation.invitationId}
                              className="border-b border-gray-700/50 hover:bg-gray-700/30 transition-colors"
                            >
                              <td className="py-4 px-4">
                                <div className="text-white font-medium">
                                  {invitation.coachFirstName &&
                                  invitation.coachLastName
                                    ? `${invitation.coachFirstName} ${invitation.coachLastName}`
                                    : "N/A"}
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <div className="text-gray-300 text-sm">
                                  {invitation.coachEmail}
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <div className="text-gray-400 text-sm">
                                  {formatDate(invitation.createdAt)}
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <div className="text-gray-400 text-sm">
                                  {formatDate(invitation.acceptedAt)}
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex justify-center">
                                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-green-900/30 text-green-400 border border-green-700">
                                    <svg
                                      className="w-4 h-4"
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
                                    Accepted
                                  </span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Stats */}
                    <div className="mt-6 pt-6 border-t border-gray-700">
                      <div className="flex items-center gap-6">
                        <div>
                          <span className="text-gray-400 text-sm">
                            Total Accepted:
                          </span>
                          <span className="text-white font-semibold ml-2">
                            {acceptedInvitations.length}
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
