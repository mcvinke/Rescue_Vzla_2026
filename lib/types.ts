export type Severity = "collapsed" | "severe" | "partial" | "stable"

export type BuildingStatus = "searching" | "pending" | "cleared"

/**
 * Affected cities/regions covered by the map. `center` is used to focus the map
 * and as the default location when reporting a new building in that city.
 * City names are proper nouns, identical in Spanish and English.
 */
export interface City {
  id: string
  name: string
  center: [number, number]
}

export const CITIES: City[] = [
  { id: "la-guaira", name: "La Guaira (Vargas)", center: [10.603, -66.93] },
  { id: "caracas", name: "Caracas", center: [10.4806, -66.9036] },
  { id: "los-teques", name: "Los Teques (Miranda)", center: [10.3417, -67.0418] },
]

export function cityName(id: string): string {
  return CITIES.find((c) => c.id === id)?.name ?? id
}

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
  /** City/region id from CITIES, e.g. "la-guaira" | "caracas" | "los-teques". */
  city: string
  /** True for the labeled placeholder records, false/undefined for real reports. */
  isSample?: boolean
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
