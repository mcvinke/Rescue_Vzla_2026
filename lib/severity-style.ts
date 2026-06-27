import type { Severity, BuildingStatus, VictimStatus } from "./types"

type Level = "critical" | "high" | "moderate" | "low"

export const SEVERITY_TOKEN: Record<Severity, string> = {
  collapsed: "var(--sev-collapsed)",
  severe: "var(--sev-severe)",
  partial: "var(--sev-partial)",
  stable: "var(--sev-stable)",
}

export const SEVERITY_BADGE: Record<Severity, string> = {
  collapsed: "bg-sev-collapsed/15 text-sev-collapsed",
  severe: "bg-sev-severe/15 text-sev-severe",
  partial: "bg-sev-partial/15 text-sev-partial",
  stable: "bg-sev-stable/15 text-sev-stable",
}

export const PRIORITY_TOKEN: Record<Level, string> = {
  critical: "var(--sev-collapsed)",
  high: "var(--sev-severe)",
  moderate: "var(--sev-partial)",
  low: "var(--sev-stable)",
}

export const PRIORITY_BADGE: Record<Level, string> = {
  critical: "bg-sev-collapsed/15 text-sev-collapsed",
  high: "bg-sev-severe/15 text-sev-severe",
  moderate: "bg-sev-partial/15 text-sev-partial",
  low: "bg-sev-stable/15 text-sev-stable",
}

export const STATUS_DOT: Record<BuildingStatus, string> = {
  searching: "bg-sev-severe",
  pending: "bg-muted-foreground",
  cleared: "bg-sev-stable",
}

export const VICTIM_BADGE: Record<VictimStatus, string> = {
  missing: "bg-sev-collapsed/15 text-sev-collapsed",
  trapped: "bg-sev-severe/15 text-sev-severe",
  rescued: "bg-sev-stable/15 text-sev-stable",
  deceased: "bg-muted text-muted-foreground",
}
