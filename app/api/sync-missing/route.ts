import { NextResponse } from "next/server"
import { LOCATION_KEYWORDS } from "@/lib/social-parser"

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "venezuela-rescue-2026"
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`

// External API — set MISSING_PERSONS_API_URL in Vercel env vars once received
const EXTERNAL_API_URL = process.env.MISSING_PERSONS_API_URL ?? ""
const EXTERNAL_API_KEY = process.env.MISSING_PERSONS_API_KEY ?? ""

// ---------------------------------------------------------------------------
// Firestore helpers
// ---------------------------------------------------------------------------

type FSValue = { stringValue: string } | { integerValue: string } | { booleanValue: boolean } | { nullValue: null }

function toFields(obj: Record<string, unknown>): Record<string, FSValue> {
  const out: Record<string, FSValue> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v === null || v === undefined) out[k] = { nullValue: null }
    else if (typeof v === "boolean") out[k] = { booleanValue: v }
    else if (typeof v === "number") out[k] = { integerValue: String(v) }
    else out[k] = { stringValue: String(v) }
  }
  return out
}

async function fsWrite(collection: string, id: string, data: Record<string, unknown>) {
  const res = await fetch(`${FIRESTORE_BASE}/${collection}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fields: toFields(data) }),
  })
  if (!res.ok) throw new Error(`Firestore write failed (${res.status}): ${await res.text().catch(() => "")}`)
}

async function fsExists(collection: string, field: string, value: string): Promise<boolean> {
  const res = await fetch(`${FIRESTORE_BASE}:runQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: collection }],
        where: { fieldFilter: { field: { fieldPath: field }, op: "EQUAL", value: { stringValue: value } } },
        limit: 1,
      },
    }),
  })
  if (!res.ok) return false
  const results = await res.json()
  return Array.isArray(results) && results.length > 0 && !!results[0]?.document
}

async function getAllBuildings(): Promise<Array<{ id: string; name: string; address: string; lat: number; lng: number; city: string }>> {
  const res = await fetch(`${FIRESTORE_BASE}/buildings`)
  if (!res.ok) return []
  const json = await res.json()
  if (!Array.isArray(json.documents)) return []
  return json.documents.map((doc: { name: string; fields: Record<string, { stringValue?: string; integerValue?: string; doubleValue?: number }> }) => {
    const f = doc.fields ?? {}
    const id = doc.name.split("/").pop() ?? ""
    return {
      id,
      name: f.name?.stringValue ?? "",
      address: f.address?.stringValue ?? "",
      lat: Number(f.lat?.doubleValue ?? f.lat?.integerValue ?? 0),
      lng: Number(f.lng?.doubleValue ?? f.lng?.integerValue ?? 0),
      city: f.city?.stringValue ?? "",
    }
  })
}

// ---------------------------------------------------------------------------
// Location matching
// ---------------------------------------------------------------------------

// Normalize text for fuzzy comparison
function normalize(s: string): string {
  return s.toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "") // remove accents
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function detectCity(location: string): string {
  const l = normalize(location)
  if (l.includes("la guaira") || l.includes("vargas") || l.includes("maiquetia") || l.includes("macuto") || l.includes("caraballeda") || l.includes("naiguata") || l.includes("catia la mar") || l.includes("playa grande")) return "la-guaira"
  if (l.includes("caracas") || l.includes("chacao") || l.includes("petare") || l.includes("el valle") || l.includes("catia")) return "caracas"
  if (l.includes("los teques") || l.includes("miranda")) return "los-teques"
  return ""
}

/**
 * Find the best matching building for a person's location string.
 * Returns the building id and a confidence score (0-1).
 */
function matchBuilding(
  location: string,
  buildings: Array<{ id: string; name: string; address: string; city: string }>
): { buildingId: string; score: number } {
  if (!location || buildings.length === 0) return { buildingId: "", score: 0 }

  const normLoc = normalize(location)
  const city = detectCity(location)

  let bestId = ""
  let bestScore = 0

  for (const b of buildings) {
    // Filter by city first if detectable
    if (city && b.city && b.city !== city) continue

    const normName = normalize(b.name)
    const normAddr = normalize(b.address)

    // Score based on word overlap
    const locWords = normLoc.split(" ").filter((w) => w.length > 3)
    const nameWords = normName.split(" ")
    const addrWords = normAddr.split(" ")

    let matches = 0
    for (const w of locWords) {
      if (nameWords.some((bw) => bw.includes(w) || w.includes(bw))) matches += 2
      else if (addrWords.some((bw) => bw.includes(w) || w.includes(bw))) matches += 1
    }

    const score = locWords.length > 0 ? matches / (locWords.length * 2) : 0
    if (score > bestScore) {
      bestScore = score
      bestId = b.id
    }
  }

  return { buildingId: bestId, score: bestScore }
}

// ---------------------------------------------------------------------------
// External API adapter
// Adjust `normalizeExternalPerson` once the actual API schema is known.
// ---------------------------------------------------------------------------

interface ExternalPerson {
  // Fields will vary by API — these are common patterns
  id?: string
  externalId?: string
  name?: string
  nombre?: string
  cedula?: string
  location?: string
  ubicacion?: string
  direccion?: string
  address?: string
  phone?: string
  telefono?: string
  contactName?: string
  contacto?: string
  status?: string
  estado?: string
  notes?: string
  notas?: string
  [key: string]: unknown
}

interface NormalizedPerson {
  externalId: string
  name: string
  cedula: string
  location: string
  phone: string
  contactName: string
  notes: string
  status: "missing" | "trapped" | "rescued" | "deceased"
}

function normalizeExternalPerson(p: ExternalPerson): NormalizedPerson | null {
  const name = String(p.name ?? p.nombre ?? "").trim()
  if (!name) return null

  const rawStatus = String(p.status ?? p.estado ?? "missing").toLowerCase()
  let status: NormalizedPerson["status"] = "missing"
  if (rawStatus.includes("rescatad") || rawStatus.includes("rescued") || rawStatus.includes("found")) status = "rescued"
  else if (rawStatus.includes("atrapado") || rawStatus.includes("trapped")) status = "trapped"
  else if (rawStatus.includes("fallecid") || rawStatus.includes("deceased") || rawStatus.includes("muerto")) status = "deceased"

  return {
    externalId: String(p.id ?? p.externalId ?? Math.random().toString(36).slice(2)),
    name,
    cedula: String(p.cedula ?? "").trim(),
    location: String(p.location ?? p.ubicacion ?? p.direccion ?? p.address ?? "").trim(),
    phone: String(p.phone ?? p.telefono ?? "").trim(),
    contactName: String(p.contactName ?? p.contacto ?? "").trim(),
    notes: String(p.notes ?? p.notas ?? "").trim(),
    status,
  }
}

async function fetchExternalPersons(): Promise<ExternalPerson[]> {
  if (!EXTERNAL_API_URL) return []

  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (EXTERNAL_API_KEY) headers["Authorization"] = `Bearer ${EXTERNAL_API_KEY}`

  const res = await fetch(EXTERNAL_API_URL, { headers })
  if (!res.ok) throw new Error(`External API error: ${res.status}`)
  const json = await res.json()

  // Handle common response shapes: array, { data: [] }, { results: [] }, { persons: [] }
  if (Array.isArray(json)) return json
  if (Array.isArray(json.data)) return json.data
  if (Array.isArray(json.results)) return json.results
  if (Array.isArray(json.persons)) return json.persons
  if (Array.isArray(json.missing)) return json.missing
  return []
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET() {
  return handler()
}

export async function POST() {
  return handler()
}

async function handler() {
  if (!EXTERNAL_API_URL) {
    return NextResponse.json({
      ok: false,
      note: "MISSING_PERSONS_API_URL not configured. Set it in Vercel environment variables once the API is available.",
    })
  }

  const startedAt = Date.now()
  let fetched = 0
  let saved = 0
  let skipped = 0
  const errors: string[] = []

  try {
    const [rawPersons, buildings] = await Promise.all([fetchExternalPersons(), getAllBuildings()])
    fetched = rawPersons.length

    for (const raw of rawPersons) {
      try {
        const person = normalizeExternalPerson(raw)
        if (!person) { skipped++; continue }

        // Skip if already imported
        const alreadyExists = await fsExists("missingPersons", "externalId", person.externalId)
        if (alreadyExists) { skipped++; continue }

        // Match to a building
        const { buildingId, score } = matchBuilding(person.location, buildings)
        const city = detectCity(person.location)

        const now = Date.now()
        const id = crypto.randomUUID()

        await fsWrite("missingPersons", id, {
          id,
          externalId: person.externalId,
          buildingId: score >= 0.4 ? buildingId : "",
          name: person.name,
          nameLower: person.name.toLowerCase(),
          cedula: person.cedula,
          floor: 0,
          apartment: "",
          status: person.status,
          contactName: person.contactName,
          contactPhone: person.phone,
          notes: person.notes || (person.location ? `Ubicación reportada: ${person.location}` : ""),
          city,
          matchScore: score,
          source: "redayudavenezuela",
          createdAt: now,
          updatedAt: now,
          signsOfLife: false,
        })

        saved++
      } catch (err) {
        errors.push(String(err))
      }
    }
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    fetched,
    saved,
    skipped,
    elapsedMs: Date.now() - startedAt,
    ...(errors.length ? { errors } : {}),
  })
}
