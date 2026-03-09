"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";
import type { Coach } from "@/lib/api";
import EntityManagementPage, {
  StatCard,
  TableColumn,
} from "../components/EntityManagementPage";
import StatusBadge from "../components/StatusBadge";

export default function CoachesPage() {
  const router = useRouter();
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCoaches = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiClient.getCoaches();
        setCoaches(data.coaches);
      } catch (error: any) {
        console.error("Failed to fetch coaches:", error);
        setError(error.message || "Failed to load coaches");
      } finally {
        setLoading(false);
      }
    };

    fetchCoaches();
  }, []);

  // Calculate statistics
  const totalCoaches = coaches.length;
  const activeCoaches = coaches.filter((c) => c.isActive).length;
  const inactiveCoaches = totalCoaches - activeCoaches;
  const totalTeams = coaches.reduce((sum, c) => sum + c.teamCount, 0);

  const statsCards: StatCard[] = [
    { label: "Total Coaches", value: totalCoaches, color: "white" },
    { label: "Active", value: activeCoaches, color: "green" },
    { label: "Inactive", value: inactiveCoaches, color: "orange" },
    { label: "Total Teams", value: totalTeams, color: "lime" },
  ];

  const columns: TableColumn<Coach>[] = [
    {
      header: "Name",
      accessor: (coach) => (
        <div className="text-white font-medium">
          {coach.firstName && coach.lastName
            ? `${coach.firstName} ${coach.lastName}`
            : "N/A"}
        </div>
      ),
    },
    {
      header: "Email",
      accessor: (coach) => (
        <div className="text-gray-300 text-sm">{coach.email || "N/A"}</div>
      ),
    },
    {
      header: "Coach ID",
      accessor: (coach) => (
        <div className="text-gray-400 text-sm font-mono">{coach.coachId}</div>
      ),
    },
    {
      header: "Teams",
      accessor: (coach) => (
        <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-medium bg-lime-900/30 text-lime-400 border border-lime-700">
          {coach.teamCount}
        </span>
      ),
      className: "text-center",
    },
    {
      header: "Status",
      accessor: (coach) =>
        coach.isActive ? (
          <StatusBadge label="Active" color="green" />
        ) : (
          <StatusBadge label="Inactive" color="orange" />
        ),
      className: "text-center",
    },
  ];

  const filterItem = (coach: Coach, query: string): boolean => {
    const searchLower = query.toLowerCase();
    const fullName =
      `${coach.firstName || ""} ${coach.lastName || ""}`.toLowerCase();
    return (
      fullName.includes(searchLower) ||
      (coach.email?.toLowerCase().includes(searchLower) ?? false) ||
      coach.coachId.toLowerCase().includes(searchLower)
    );
  };

  return (
    <EntityManagementPage
      title="Manage Coaches"
      breadcrumbs={[{ label: "Back to Users", href: "/dashboard/users" }]}
      statsCards={statsCards}
      searchPlaceholder="Search coaches by name, email, or ID..."
      columns={columns}
      data={coaches}
      loading={loading}
      error={error}
      filterItem={filterItem}
      getItemKey={(coach) => coach.coachId}
      emptyMessage="No coaches found."
      noResultsMessage="No coaches found matching your search."
      actions={
        <div className="flex gap-3">
          <button
            onClick={() => router.push("/dashboard/users/coaches/invitations")}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap"
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
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            View Invites
          </button>
          <button
            onClick={() => router.push("/dashboard/users/coaches/invite")}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap"
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
            Invite Coach
          </button>
        </div>
      }
    />
  );
}
