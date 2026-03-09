export type BadgeColor = "green" | "orange" | "red" | "blue" | "lime" | "gray";

interface StatusBadgeProps {
  label: string;
  color: BadgeColor;
}

const colorClasses: Record<BadgeColor, string> = {
  green: "bg-green-900/30 text-green-400 border-green-700",
  orange: "bg-orange-900/30 text-orange-400 border-orange-700",
  red: "bg-red-900/30 text-red-400 border-red-700",
  blue: "bg-blue-900/30 text-blue-400 border-blue-700",
  lime: "bg-lime-900/30 text-lime-400 border-lime-700",
  gray: "bg-gray-800 text-gray-400 border-gray-700",
};

export default function StatusBadge({ label, color }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${colorClasses[color]}`}
    >
      {label}
    </span>
  );
}
