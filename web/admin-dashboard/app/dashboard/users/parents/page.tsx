"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";
import type { Parent } from "@/lib/api";
import EntityManagementPage, {
  StatCard,
  TableColumn,
} from "../components/EntityManagementPage";
import StatusBadge from "../components/StatusBadge";

export default function ParentsPage() {
  const router = useRouter();
  const [parents, setParents] = useState<Parent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchParents = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiClient.getParents();
        setParents(data.parents);
      } catch (error: any) {
        console.error("Failed to fetch parents:", error);
        setError(error.message || "Failed to load parents");
      } finally {
        setLoading(false);
      }
    };

    fetchParents();
  }, []);

  // Calculate statistics
  const totalParents = parents.length;
  const activeParents = parents.filter((p) => p.isActive).length;
  const inactiveParents = totalParents - activeParents;
  const totalChildren = parents.reduce((sum, p) => sum + p.childrenCount, 0);

  const statsCards: StatCard[] = [
    { label: "Total Parents", value: totalParents, color: "white" },
    { label: "Active", value: activeParents, color: "green" },
    { label: "Inactive", value: inactiveParents, color: "orange" },
    { label: "Total Children", value: totalChildren, color: "blue" },
  ];

  const columns: TableColumn<Parent>[] = [
    {
      header: "Name",
      accessor: (parent) => (
        <div className="text-white font-medium">
          {`${parent.firstName} ${parent.lastName}`}
        </div>
      ),
    },
    {
      header: "Email",
      accessor: (parent) => (
        <div className="text-gray-300 text-sm">{parent.email || "N/A"}</div>
      ),
    },
    {
      header: "Phone",
      accessor: (parent) => (
        <div className="text-gray-300 text-sm">{parent.phone || "N/A"}</div>
      ),
    },
    {
      header: "Parent ID",
      accessor: (parent) => (
        <div className="text-gray-400 text-sm font-mono">{parent.parentId}</div>
      ),
    },
    {
      header: "Pseudonym",
      accessor: (parent) => (
        <div className="text-gray-400 text-sm font-mono">
          {parent.pseudonymId || "-"}
        </div>
      ),
    },
    {
      header: "Children",
      accessor: (parent) => (
        <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-medium bg-blue-900/30 text-blue-400 border border-blue-700">
          {parent.childrenCount}
        </span>
      ),
      className: "text-center",
    },
    {
      header: "Status",
      accessor: (parent) =>
        parent.isActive ? (
          <StatusBadge label="Active" color="green" />
        ) : (
          <StatusBadge label="Inactive" color="orange" />
        ),
      className: "text-center",
    },
    {
      header: "Edit",
      accessor: (parent) =>
        parent.pseudonymId ? (
          <Link
            href={`/dashboard/users/parents/${encodeURIComponent(parent.pseudonymId)}/edit`}
            className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-sm text-white rounded"
          >
            Edit
          </Link>
        ) : (
          <span className="text-gray-500 text-sm">-</span>
        ),
      className: "text-center",
    },
    {
      header: "Activity",
      accessor: () => (
        <Link
          href="/dashboard/user-activity"
          className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-sm text-white rounded"
        >
          View Activity
        </Link>
      ),
      className: "text-center",
    },
  ];

  const filterItem = (parent: Parent, query: string): boolean => {
    const searchLower = query.toLowerCase();
    const fullName = `${parent.firstName} ${parent.lastName}`.toLowerCase();
    return (
      fullName.includes(searchLower) ||
      (parent.email?.toLowerCase().includes(searchLower) ?? false) ||
      parent.parentId.toLowerCase().includes(searchLower) ||
      (parent.phone?.toLowerCase().includes(searchLower) ?? false)
    );
  };

  return (
    <EntityManagementPage
      title="Manage Parents"
      breadcrumbs={[{ label: "Back to Users", href: "/dashboard/users" }]}
      actions={
        <button
          onClick={() => router.push("/dashboard/users/parents/create")}
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
          Add Parent
        </button>
      }
      statsCards={statsCards}
      searchPlaceholder="Search parents by name, email, phone, or ID..."
      columns={columns}
      data={parents}
      loading={loading}
      error={error}
      filterItem={filterItem}
      getItemKey={(parent) => parent.parentId}
      emptyMessage="No parents found."
      noResultsMessage="No parents found matching your search."
    />
  );
}
