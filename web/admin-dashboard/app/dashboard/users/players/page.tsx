"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";
import type { Player } from "@/lib/api";
import EntityManagementPage, {
  StatCard,
  TableColumn,
} from "../components/EntityManagementPage";
import StatusBadge from "../components/StatusBadge";

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiClient.getPlayers();
        setPlayers(data.players);
      } catch (error: any) {
        console.error("Failed to fetch players:", error);
        setError(error.message || "Failed to load players");
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, []);

  // Calculate statistics
  const totalPlayers = players.length;
  const activePlayers = players.filter((p) => p.isActive).length;
  const inactivePlayers = totalPlayers - activePlayers;
  const playersWithInjuries = players.filter((p) => p.injuryCount > 0).length;
  const totalInjuries = players.reduce((sum, p) => sum + p.injuryCount, 0);

  const statsCards: StatCard[] = [
    { label: "Total Players", value: totalPlayers, color: "white" },
    { label: "Active", value: activePlayers, color: "green" },
    { label: "Inactive", value: inactivePlayers, color: "orange" },
    { label: "With Injuries", value: playersWithInjuries, color: "red" },
    { label: "Total Injuries", value: totalInjuries, color: "red" },
  ];

  const columns: TableColumn<Player>[] = [
    {
      header: "Name",
      accessor: (player) => (
        <div className="text-white font-medium">
          {`${player.firstName} ${player.lastName}`}
        </div>
      ),
    },
    {
      header: "Email",
      accessor: (player) => (
        <div className="text-gray-300 text-sm">{player.email || "N/A"}</div>
      ),
    },
    {
      header: "Date of Birth",
      accessor: (player) => (
        <div className="text-gray-300 text-sm">
          {player.dateOfBirth
            ? new Date(player.dateOfBirth).toLocaleDateString()
            : "N/A"}
        </div>
      ),
    },
    {
      header: "Position",
      accessor: (player) => (
        <div className="text-gray-300 text-sm">{player.position || "N/A"}</div>
      ),
    },
    {
      header: "Team",
      accessor: (player) => (
        <div className="text-gray-300 text-sm">
          {player.teamName || "Unassigned"}
        </div>
      ),
    },
    {
      header: "Injuries",
      accessor: (player) => (
        <span
          className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-medium ${
            player.injuryCount > 0
              ? "bg-red-900/30 text-red-400 border border-red-700"
              : "bg-gray-800 text-gray-400 border border-gray-700"
          }`}
        >
          {player.injuryCount}
        </span>
      ),
      className: "text-center",
    },
    {
      header: "Status",
      accessor: (player) =>
        player.isActive ? (
          <StatusBadge label="Active" color="green" />
        ) : (
          <StatusBadge label="Inactive" color="orange" />
        ),
      className: "text-center",
    },
  ];

  const filterItem = (player: Player, query: string): boolean => {
    const searchLower = query.toLowerCase();
    const fullName = `${player.firstName} ${player.lastName}`.toLowerCase();
    return (
      fullName.includes(searchLower) ||
      (player.email?.toLowerCase().includes(searchLower) ?? false) ||
      player.playerId.toLowerCase().includes(searchLower) ||
      (player.position?.toLowerCase().includes(searchLower) ?? false) ||
      (player.teamName?.toLowerCase().includes(searchLower) ?? false)
    );
  };

  return (
    <EntityManagementPage
      title="Manage Players"
      breadcrumbs={[{ label: "Back to Users", href: "/dashboard/users" }]}
      statsCards={statsCards}
      searchPlaceholder="Search players by name, email, position, team, or ID..."
      columns={columns}
      data={players}
      loading={loading}
      error={error}
      filterItem={filterItem}
      getItemKey={(player) => player.playerId}
      emptyMessage="No players found."
      noResultsMessage="No players found matching your search."
    />
  );
}
