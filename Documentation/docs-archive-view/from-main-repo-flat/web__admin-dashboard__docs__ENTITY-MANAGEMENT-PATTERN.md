# Reusable Entity Management Components

## Overview

To avoid code duplication and maintain consistency across entity management pages (coaches, players, parents, etc.), we've created a reusable component architecture.

## Component Structure

### 1. EntityManagementPage (Main Component)

Location: `app/dashboard/users/components/EntityManagementPage.tsx`

A fully reusable page component that handles:

- Authentication and routing
- Header with navigation and user info
- Statistics cards display
- Search functionality
- Data table with configurable columns
- Loading and error states
- Empty state messaging

### 2. StatusBadge (Helper Component)

Location: `app/dashboard/users/components/StatusBadge.tsx`

Reusable status badge with predefined color schemes.

## Usage Pattern

Each entity-specific page follows this pattern:

1. **Fetch data** using API client
2. **Define statistics cards** - what metrics to show
3. **Define table columns** - how to display each field
4. **Define search logic** - which fields to search
5. **Pass everything to EntityManagementPage**

## Example: Coaches Page

\`\`\`typescript
// app/dashboard/users/coaches/page.tsx
"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";
import type { Coach } from "@/lib/api";
import EntityManagementPage, {
StatCard,
TableColumn,
} from "../components/EntityManagementPage";
import StatusBadge from "../components/StatusBadge";

export default function CoachesPage() {
// 1. State management
const [coaches, setCoaches] = useState<Coach[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

// 2. Fetch data
useEffect(() => {
const fetchCoaches = async () => {
try {
setLoading(true);
setError(null);
const data = await apiClient.getCoaches();
setCoaches(data.coaches);
} catch (error: any) {
setError(error.message || "Failed to load coaches");
} finally {
setLoading(false);
}
};
fetchCoaches();
}, []);

// 3. Define statistics
const statsCards: StatCard[] = [
{ label: "Total", value: coaches.length, color: "white" },
{ label: "Active", value: coaches.filter(c => c.isActive).length, color: "green" },
// ... more stats
];

// 4. Define columns
const columns: TableColumn<Coach>[] = [
{
header: "Name",
accessor: (coach) => <div>{coach.firstName} {coach.lastName}</div>,
},
// ... more columns
];

// 5. Define search logic
const filterItem = (coach: Coach, query: string) => {
const searchLower = query.toLowerCase();
return (
coach.firstName?.toLowerCase().includes(searchLower) ||
coach.email?.toLowerCase().includes(searchLower)
);
};

// 6. Render with EntityManagementPage
return (
<EntityManagementPage
title="Manage Coaches"
breadcrumbs={[{ label: "Back to Users", href: "/dashboard/users" }]}
statsCards={statsCards}
searchPlaceholder="Search coaches..."
columns={columns}
data={coaches}
loading={loading}
error={error}
filterItem={filterItem}
getItemKey={(coach) => coach.coachId}
/>
);
}
\`\`\`

## Example: Players Page Template

\`\`\`typescript
// app/dashboard/users/players/page.tsx
"use client";

import EntityManagementPage, { StatCard, TableColumn } from "../components/EntityManagementPage";
import StatusBadge from "../components/StatusBadge";

// Assuming Player interface exists
interface Player {
playerId: string;
pseudonymId: string;
firstName?: string;
lastName?: string;
email?: string;
teamName?: string;
ageGroup?: string;
position?: string;
activeInjuriesCount: number;
isActive: boolean;
}

export default function PlayersPage() {
const [players, setPlayers] = useState<Player[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

// Fetch players...

const statsCards: StatCard[] = [
{ label: "Total Players", value: players.length, color: "white" },
{ label: "Active", value: players.filter(p => p.isActive).length, color: "green" },
{ label: "With Injuries", value: players.filter(p => p.activeInjuriesCount > 0).length, color: "orange" },
{ label: "Injury-Free", value: players.filter(p => p.activeInjuriesCount === 0).length, color: "lime" },
];

const columns: TableColumn<Player>[] = [
{
header: "Name",
accessor: (player) => (
<div className="text-white font-medium">
{player.firstName && player.lastName
? \`\${player.firstName} \${player.lastName}\`
: "N/A"}
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
header: "Team",
accessor: (player) => (
<div className="text-gray-300 text-sm">{player.teamName || "N/A"}</div>
),
},
{
header: "Position",
accessor: (player) => (
<div className="text-gray-300 text-sm">{player.position || "N/A"}</div>
),
},
{
header: "Age Group",
accessor: (player) => (
<div className="text-gray-300 text-sm">{player.ageGroup || "N/A"}</div>
),
},
{
header: "Injuries",
accessor: (player) => (
<span className={\`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium \${
player.activeInjuriesCount > 0
? 'bg-orange-900/30 text-orange-400 border border-orange-700'
: 'bg-green-900/30 text-green-400 border border-green-700'
}\`}>
{player.activeInjuriesCount}
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
<StatusBadge label="Inactive" color="gray" />
),
className: "text-center",
},
];

const handleSearch = (item: Player, query: string) => {
const searchLower = query.toLowerCase();
const fullName = `${item.firstName || ""} ${item.lastName || ""}`.toLowerCase();
return (
fullName.includes(searchLower) ||
item.email?.toLowerCase().includes(searchLower) ||
item.playerId.toLowerCase().includes(searchLower) ||
item.teamName?.toLowerCase().includes(searchLower)
);
};

return (
<EntityManagementPage
title="Manage Players"
breadcrumbs={[{ label: "Back to Users", href: "/dashboard/users" }]}
statsCards={statsCards}
searchPlaceholder="Search players by name, email, team, or ID..."
columns={columns}
data={players}
loading={loading}
error={error}
onSearch={handleSearch}
getItemKey={(player) => player.playerId}
filterItemsage="No players found."
noResultsMessage="No players found matching your search."
/>
);
}
\`\`\`

## Example: Parents Page Template

\`\`\`typescript
// app/dashboard/users/parents/page.tsx
interface Parent {
parentId: string;
pseudonymId: string;
firstName?: string;
lastName?: string;
email?: string;
phone?: string;
childrenCount: number;
isActive: boolean;
}

export default function ParentsPage() {
// Similar structure to above...

const statsCards: StatCard[] = [
{ label: "Total Parents", value: parents.length, color: "white" },
{ label: "Active", value: parents.filter(p => p.isActive).length, color: "green" },
{ label: "Total Children", value: parents.reduce((sum, p) => sum + p.childrenCount, 0), color: "blue" },
];

const columns: TableColumn<Parent>[] = [
{
header: "Name",
accessor: (parent) => (
<div className="text-white font-medium">
{parent.firstName && parent.lastName
? \`\${parent.firstName} \${parent.lastName}\`
: "N/A"}
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
header: "Children",
accessor: (parent) => (
<span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-900/30 text-blue-400 border border-blue-700">
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
<StatusBadge label="Inactive" color="gray" />
),
className: "text-center",
},
];

// ... similar pattern
}
\`\`\`

## Benefits

1. **DRY Principle**: No code duplication across pages
2. **Consistency**: All entity pages look and behave the same
3. **Maintainability**: Change once, update everywhere
4. **Type Safety**: Full TypeScript support with generics
5. **Flexibility**: Easy to customize per entity while maintaining structure
6. **Scalability**: Add new entity pages in minutes

## Next Steps

To implement for a new entity:

1. **Backend**: Create service, controller, DTOs (if not exists)
2. **API Client**: Add interface and method to `lib/api.ts`
3. **Frontend**: Create page using `EntityManagementPage` component
4. **Configure**: Define stats, columns, and search logic
5. **Test**: Verify functionality

## File Structure

\`\`\`
app/dashboard/users/
├── components/
│ ├── EntityManagementPage.tsx (Reusable main component)
│ └── StatusBadge.tsx (Reusable badge component)
├── coaches/
│ └── page.tsx (Coaches-specific configuration)
├── players/
│ └── page.tsx (Players-specific configuration)
└── parents/
└── page.tsx (Parents-specific configuration)
\`\`\`
