export type Severity = "collapsed" | "severe" | "partial" | "stable"

export type BuildingStatus = "searching" | "pending" | "cleared"

export type VictimStatus = "missing" | "trapped" | "rescued" | "deceased"

export interface Victim {
  id: string
  name: string
  /** Last known floor number within the building */
  floor: number | null
  /** Last known apartment / unit identifier */
  apartment: string
  status: VictimStatus
  contactName: string
  contactPhone: string
  notes: string
}

export interface Building {
  id: string
  name: string
  address: string
  lat: number
  lng: number
  floors: number
  apartments: number
  severity: Severity
  status: BuildingStatus
  /** Notes about access, emergency exits, stairs, etc. */
  accessNotes: string
  reportedBy: string
  source: string
  victims: Victim[]
  createdAt: number
  updatedAt: number
}

/** Building document as stored in Firestore: metadata only, no embedded people. */
export type BuildingDoc = Omit<Building, "victims">

/**
 * A missing person as stored in its own top-level `missingPersons` document.
 * Keeping each person in its own doc means two rescuers can update different
 * people at the same time without overwriting each other, and we can query
 * across every building (e.g. "everyone still trapped", or search by name).
 */
export interface MissingPersonDoc extends Victim {
  /** Foreign key back to the building this person was last seen in. */
  buildingId: string
  /** Lowercased name, stored so we can do case-insensitive prefix search. */
  nameLower: string
  createdAt: number
  updatedAt: number
}

export const SEVERITY_ORDER: Record<Severity, number> = {
  collapsed: 4,
  severe: 3,
  partial: 2,
  stable: 1,
}

export function activeVictims(b: Building): Victim[] {
  return b.victims.filter((v) => v.status === "missing" || v.status === "trapped")
}

/**
 * Higher score = higher rescue priority.
 * Weighted by number of people still missing/trapped and structural severity.
 */
export function priorityScore(b: Building): number {
  const active = activeVictims(b).length
  return active * 10 + SEVERITY_ORDER[b.severity] * 3 + (b.status === "searching" ? 2 : 0)
}

export function priorityLevel(b: Building): "critical" | "high" | "moderate" | "low" {
  const score = priorityScore(b)
  if (score >= 25) return "critical"
  if (score >= 15) return "high"
  if (score >= 8) return "moderate"
  return "low"
}
