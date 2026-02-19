import { BombStatus, type RoundEventType, RoundStatus } from "../types";

/**
 * Returns a short label for a round ID for display in breadcrumbs and cards (e.g. "Round #2131678").
 */
export function formatRoundLabel(roundId: string): string {
  return `Round #${roundId.slice(-8)}`;
}

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
 * Display name for a module in lists/breadcrumbs. When moduleId is provided, appends a shortened
 * id (e.g. "Wires a1b2c3d4") so every module is identifiable.
 */
export function formatModuleDisplayName(type: string, moduleId?: string): string {
  const base = formatModuleName(type);
  if (moduleId != null && moduleId.length > 0) {
    const shortId = moduleId.replace(/-/g, "").slice(-8);
    return `${base} ${shortId}`;
  }
  return base;
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

/**
 * Human-readable message for a round event (solve, strike, etc.).
 */
export function formatRoundEventMessage(msg: {
  type: RoundEventType;
  payload?: Record<string, unknown>;
}): string {
  const p = msg.payload ?? {};
  switch (msg.type) {
    case "MODULE_SOLVED": {
      const moduleType = (p.moduleType as string) ?? "module";
      const moduleId = p.moduleId as string | undefined;
      return `Solved ${formatModuleDisplayName(moduleType, moduleId)}`;
    }
    case "ROUND_STRIKE":
    case "MODULE_STRIKE": {
      const strikes = p.strikes as number | undefined;
      return strikes != null ? `Strike (${strikes} total)` : "Strike on bomb";
    }
    case "ROUND_UPDATED":
      return "Round setup updated";
    default:
      return msg.type;
  }
}
