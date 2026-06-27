import type { SignalType } from "./types"

/**
 * Heuristic parser for pasted social-media posts. It is intentionally
 * conservative: everything it extracts is a *suggestion* the coordinator must
 * verify. It never fabricates data — empty results stay empty.
 */

// Known affected locations. Multi-word entries are checked first so e.g.
// "La Guaira Centro" wins over "La Guaira".
export const LOCATION_KEYWORDS = [
  "La Guaira Centro",
  "Playa Grande",
  "La Guaira",
  "Maiquetía",
  "Maiquetia",
  "Caraballeda",
  "Naiguatá",
  "Naiguata",
  "Macuto",
  "Catia La Mar",
  "Petare",
  "Catia",
  "El Valle",
  "Chacao",
  "Los Teques",
  "Caracas",
]

const MISSING_SIGNALS = [
  "desaparecid",
  "busco a",
  "busco mi",
  "busco al",
  "ayuda busco",
  "no sé nada de",
  "no se nada de",
  "atrapad",
  "missing",
  "trapped",
  "looking for",
  "have not heard from",
  "haven't heard from",
]

const BUILDING_SIGNALS = [
  "derrumbe",
  "edificio colapsado",
  "se cayó el edificio",
  "se cayo el edificio",
  "colaps",
  "collapsed",
  "building down",
  "rubble",
  "debris",
  "escombros",
]

// Words that look capitalized but are not names (sentence starters, months, etc.)
const NAME_STOPWORDS = new Set(
  [
    "el",
    "la",
    "los",
    "las",
    "un",
    "una",
    "mi",
    "su",
    "ayuda",
    "busco",
    "urgente",
    "por",
    "favor",
    "necesito",
    "alguien",
    "sabe",
    "donde",
    "dónde",
    "esta",
    "está",
    "the",
    "please",
    "help",
    "missing",
    "trapped",
    "looking",
    "for",
    "i",
    "we",
    "my",
    "have",
    "not",
    "heard",
    "from",
    "edificio",
    "torre",
    "residencias",
    "bloque",
    "apartamento",
    "piso",
  ].map((w) => w.toLowerCase()),
)

export interface ParseResult {
  name: string
  location: string
  phone: string
  signalType: SignalType
}

function includesAny(haystack: string, needles: string[]): boolean {
  return needles.some((n) => haystack.includes(n))
}

/** Detect the first known location mentioned (case-insensitive). */
function detectLocation(text: string): string {
  const lower = text.toLowerCase()
  for (const loc of LOCATION_KEYWORDS) {
    if (lower.includes(loc.toLowerCase())) return loc
  }
  return ""
}

/** Classify the post as a missing-person report, a building/collapse, or unclear. */
function detectSignal(lower: string): SignalType {
  const missing = includesAny(lower, MISSING_SIGNALS)
  const building = includesAny(lower, BUILDING_SIGNALS)
  if (missing && !building) return "missing_person"
  if (building && !missing) return "building"
  if (missing && building) return "missing_person" // a trapped person takes priority
  return "unclear"
}

/**
 * Extract a likely person name. Strategy:
 * 1. Look for an explicit "busco a / looking for <Name>" pattern.
 * 2. Otherwise take the longest run of consecutive capitalized words that
 *    isn't a known location or stopword.
 */
function detectName(text: string, location: string): string {
  // 1. Explicit lead-ins.
  const leadIns = [
    /busco a (?:mi [a-záéíóúñ]+ )?([A-ZÁÉÍÓÚÑ][\wáéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][\wáéíóúñ]+){0,2})/u,
    /busco (?:a |al )?([A-ZÁÉÍÓÚÑ][\wáéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][\wáéíóúñ]+){0,2})/u,
    /looking for ([A-Z][\w]+(?:\s+[A-Z][\w]+){0,2})/,
    /no s[eé] nada de ([A-ZÁÉÍÓÚÑ][\wáéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][\wáéíóúñ]+){0,2})/u,
  ]
  for (const re of leadIns) {
    const m = text.match(re)
    if (m && m[1]) {
      const cleaned = cleanNameCandidate(m[1], location)
      if (cleaned) return cleaned
    }
  }

  // 2. Longest capitalized run.
  const runs = text.match(/[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)*/gu) ?? []
  let best = ""
  for (const run of runs) {
    const cleaned = cleanNameCandidate(run, location)
    if (cleaned && cleaned.split(/\s+/).length > best.split(/\s+/).filter(Boolean).length) {
      best = cleaned
    }
  }
  return best
}

/** Strip stopwords/locations from a candidate and require it look like a name. */
function cleanNameCandidate(candidate: string, location: string): string {
  const locLower = location.toLowerCase()
  const words = candidate
    .trim()
    .split(/\s+/)
    .filter((w) => {
      const lw = w.toLowerCase()
      if (NAME_STOPWORDS.has(lw)) return false
      if (locLower && locLower.includes(lw)) return false
      return true
    })
  // A plausible name is 1-3 words, each at least 2 chars.
  const filtered = words.filter((w) => w.length >= 2).slice(0, 3)
  if (filtered.length === 0) return ""
  return filtered.join(" ")
}

/**
 * Extract a likely phone number. Venezuelan mobiles look like 0414-1234567 or
 * +58 414 1234567. We capture digit groups of 7+ digits (ignoring spaces,
 * dashes, parentheses and a leading +).
 */
function detectPhone(text: string): string {
  const matches = text.match(/\+?\d[\d\s().-]{6,}\d/g) ?? []
  for (const raw of matches) {
    const digits = raw.replace(/\D/g, "")
    if (digits.length >= 7 && digits.length <= 13) {
      return raw.trim()
    }
  }
  return ""
}

export function parsePost(text: string): ParseResult {
  const trimmed = text.trim()
  if (!trimmed) return { name: "", location: "", phone: "", signalType: "unclear" }
  const lower = trimmed.toLowerCase()
  const location = detectLocation(trimmed)
  return {
    name: detectName(trimmed, location),
    location,
    phone: detectPhone(trimmed),
    signalType: detectSignal(lower),
  }
}
