import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatINR(amount) {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)} L`;
  return `₹${amount.toLocaleString("en-IN")}`;
}

export function severityColor(label) {
  switch (label?.toLowerCase()) {
    case "critical":
      return "text-red-500";
    case "high":
      return "text-orange-400";
    case "medium":
      return "text-yellow-400";
    case "low":
      return "text-green-400";
    default:
      return "text-gray-400";
  }
}

export function severityBadgeClass(severity) {
  switch (severity?.toLowerCase()) {
    case "red":
      return "severity-red";
    case "yellow":
      return "severity-yellow";
    case "green":
      return "severity-green";
    default:
      return "severity-green";
  }
}

export function riskScoreColor(score) {
  if (score >= 71) return "#dc2626";
  if (score >= 46) return "#ea580c";
  if (score >= 21) return "#eab308";
  return "#16a34a";
}

export function categoryIcon(category) {
  const icons = {
    road: "🛣️",
    building: "🏗️",
    bridge: "🌉",
    pipeline: "🔧",
  };
  return icons[category] || "📋";
}
