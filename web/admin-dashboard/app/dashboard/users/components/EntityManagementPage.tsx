"use client";

import { useAuthStore } from "@/store/authStore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, ReactNode } from "react";

export interface StatCard {
  label: string;
  value: number | string;
  color?: "white" | "green" | "orange" | "lime" | "red" | "blue";
}

export interface TableColumn<T> {
  header: string;
  accessor: (item: T) => ReactNode;
  className?: string;
}

interface EntityManagementPageProps<T> {
  title: string;
  breadcrumbs?: { label: string; href: string }[];
  statsCards: StatCard[];
  searchPlaceholder: string;
  columns: TableColumn<T>[];
  data: T[];
  loading: boolean;
  error: string | null;
  filterItem: (item: T, query: string) => boolean;
  getItemKey: (item: T) => string;
  emptyMessage?: string;
  noResultsMessage?: string;
  actions?: ReactNode; // Custom action buttons (e.g., "Invite" button)
}

const colorClasses = {
  white: "text-white",
  green: "text-green-400",
  orange: "text-orange-400",
  lime: "text-lime-400",
  red: "text-red-400",
  blue: "text-blue-400",
};

export default function EntityManagementPage<T>({
  title,
  breadcrumbs = [],
  statsCards,
  searchPlaceholder,
  columns,
  data,
  loading,
  error,
  filterItem,
  getItemKey,
  emptyMessage = "No data found.",
  noResultsMessage = "No results found matching your search.",
  actions,
}: EntityManagementPageProps<T>) {
  const { isAuthenticated, user, logout, checkAuth } = useAuthStore();
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    checkAuth();
    setHydrated(true);
  }, [checkAuth]);

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.push("/");
    }
  }, [hydrated, isAuthenticated, router]);

  if (!hydrated || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  const displayName = user.email.split("@")[0] || "User";

  // Filter data based on search query
  const filteredData = searchQuery
    ? data.filter((item) => filterItem(item, searchQuery))
    : data;

  // Determine grid columns class based on stats count
  const gridColsClass =
    statsCards.length === 1
      ? "grid-cols-1"
      : statsCards.length === 2
        ? "md:grid-cols-2"
        : statsCards.length === 3
          ? "md:grid-cols-3"
          : "md:grid-cols-4";

  return (
    <div className="min-h-screen bg-black">
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">{title}</h1>
            <p className="text-gray-400 text-sm mt-1">Welcome, {displayName}</p>
          </div>
          <div className="flex items-center gap-3">
            {breadcrumbs.map((crumb, index) => (
              <Link
                key={index}
                href={crumb.href}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg border border-gray-700 transition"
              >
                {crumb.label}
              </Link>
            ))}
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg border border-gray-700 transition"
            >
              Dashboard
            </Link>
            <button
              onClick={() => {
                logout();
                router.push("/");
              }}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg border border-gray-700 transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className={`grid grid-cols-1 ${gridColsClass} gap-4 mb-8`}>
          {statsCards.map((stat, index) => (
            <div
              key={index}
              className="bg-gray-900 border border-gray-800 rounded-lg p-4"
            >
              <div className="text-gray-400 text-sm mb-1">{stat.label}</div>
              <div
                className={`text-3xl font-bold ${colorClasses[stat.color || "white"]}`}
              >
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* Search Bar and Actions */}
        <div className="mb-6 flex gap-4 items-center">
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-lime-500 focus:ring-1 focus:ring-lime-500"
          />
          {actions && <div className="flex gap-2">{actions}</div>}
        </div>

        {/* Data Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-400">Loading...</div>
          ) : error ? (
            <div className="p-8 text-center text-red-400">{error}</div>
          ) : filteredData.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              {searchQuery ? noResultsMessage : emptyMessage}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800 border-b border-gray-700">
                  <tr>
                    {columns.map((column, index) => (
                      <th
                        key={index}
                        className={`px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider ${column.className || ""}`}
                      >
                        {column.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {filteredData.map((item) => (
                    <tr
                      key={getItemKey(item)}
                      className="hover:bg-gray-800/50 transition"
                    >
                      {columns.map((column, colIndex) => (
                        <td
                          key={colIndex}
                          className="px-6 py-4 whitespace-nowrap"
                        >
                          {column.accessor(item)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Results Summary */}
        {!loading && !error && (
          <div className="mt-4 text-center text-gray-400 text-sm">
            Showing {filteredData.length} of {data.length} results
            {searchQuery && ` (filtered by "${searchQuery}")`}
          </div>
        )}
      </main>
    </div>
  );
}
