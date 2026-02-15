import { BombStatus, RoundStatus } from "../types";

/**
 * Converts an enum-style string like "WIRE_SEQUENCES" to title case "Wire Sequences".
 */
export function formatModuleName(type: string): string {
  return type
    .toLowerCase()
    .split("_")
    .map((chunk) => chunk[0].toUpperCase() + chunk.slice(1))
    .join(" ");
}

/**
 * Returns a human-readable label for a RoundStatus enum value.
 */
export function getRoundStatusLabel(status: RoundStatus): string {
  switch (status) {
    case RoundStatus.SETUP:
      return "Setup";
    case RoundStatus.ACTIVE:
      return "Active";
    case RoundStatus.COMPLETED:
      return "Completed";
    case RoundStatus.FAILED:
      return "Failed";
    default:
      return "Unknown";
  }
}

/**
 * Returns a badge CSS class for a RoundStatus enum value.
 */
export function getRoundStatusBadge(status: RoundStatus): string {
  switch (status) {
    case RoundStatus.SETUP:
      return "badge-warning";
    case RoundStatus.ACTIVE:
      return "badge-info";
    case RoundStatus.COMPLETED:
      return "badge-success";
    case RoundStatus.FAILED:
      return "badge-error";
    default:
      return "badge-ghost";
  }
}

/**
 * Returns a badge CSS class for a BombStatus enum value.
 */
export function getBombStatusBadge(status: BombStatus): string {
  switch (status) {
    case BombStatus.EXPLODED:
      return "badge-error";
    case BombStatus.DEFUSED:
      return "badge-success";
    default:
      return "badge-neutral";
  }
}

/**
 * Returns the Badge component variant for a RoundStatus (for components/ui/badge).
 */
export function getRoundStatusBadgeVariant(status: RoundStatus): "warning" | "info" | "success" | "error" | "secondary" {
  switch (status) {
    case RoundStatus.SETUP:
      return "warning";
    case RoundStatus.ACTIVE:
      return "info";
    case RoundStatus.COMPLETED:
      return "success";
    case RoundStatus.FAILED:
      return "error";
    default:
      return "secondary";
  }
}

/**
 * Returns the Badge component variant for a BombStatus (for components/ui/badge).
 */
export function getBombStatusBadgeVariant(
  status: BombStatus
): "success" | "error" | "outline" {
  switch (status) {
    case BombStatus.ACTIVE:
    case BombStatus.DEFUSED:
      return "success";
    case BombStatus.EXPLODED:
      return "error";
    default:
      return "outline";
  }
}
