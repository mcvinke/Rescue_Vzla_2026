"use client"

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react"

export type Lang = "es" | "en"

type Dict = Record<string, { es: string; en: string }>

// All UI copy lives here so the app is fully bilingual. Spanish is the default.
const DICT: Dict = {
  appName: { es: "RescateVE", en: "RescateVE" },
  appTagline: {
    es: "Coordinación de rescate — Terremoto de Venezuela",
    en: "Rescue coordination — Venezuela Earthquake",
  },
  liveData: { es: "Datos en vivo", en: "Live data" },
  localData: { es: "Datos locales (sin conexión)", en: "Local data (offline)" },
  lastUpdated: { es: "Última actualización", en: "Last updated" },

  // Stats
  buildings: { es: "Edificios afectados", en: "Affected buildings" },
  collapsed: { es: "Colapsados", en: "Collapsed" },
  missing: { es: "Personas desaparecidas", en: "Missing persons" },
  rescued: { es: "Rescatadas", en: "Rescued" },
  searching: { es: "En búsqueda", en: "Searching" },

  // Map / list
  affectedZones: { es: "Zonas afectadas", en: "Affected zones" },
  priorityList: { es: "Prioridad de rescate", en: "Rescue priority" },
  searchPlaceholder: { es: "Buscar edificio o persona...", en: "Search building or person..." },
  noResults: { es: "Sin resultados", en: "No results" },
  reportBuilding: { es: "Reportar edificio", en: "Report building" },
  filterAll: { es: "Todos", en: "All" },

  // Priority
  priority: { es: "Prioridad", en: "Priority" },
  critical: { es: "Crítica", en: "Critical" },
  high: { es: "Alta", en: "High" },
  moderate: { es: "Media", en: "Moderate" },
  low: { es: "Baja", en: "Low" },

  // Severity
  severity: { es: "Daño estructural", en: "Structural damage" },
  sev_collapsed: { es: "Colapsado", en: "Collapsed" },
  sev_severe: { es: "Daño severo", en: "Severe damage" },
  sev_partial: { es: "Daño parcial", en: "Partial damage" },
  sev_stable: { es: "Estable / inspeccionado", en: "Stable / inspected" },

  // Building status
  status: { es: "Estado", en: "Status" },
  st_searching: { es: "Equipo en sitio", en: "Team on site" },
  st_pending: { es: "Pendiente", en: "Pending" },
  st_cleared: { es: "Despejado", en: "Cleared" },

  // Building detail
  floors: { es: "Pisos", en: "Floors" },
  apartments: { es: "Apartamentos", en: "Apartments" },
  accessNotes: { es: "Acceso, salidas y escaleras", en: "Access, exits & stairs" },
  reportedBy: { es: "Reportado por", en: "Reported by" },
  source: { es: "Fuente", en: "Source" },
  victimsTitle: { es: "Registro de personas", en: "Persons registry" },
  addVictim: { es: "Agregar persona", en: "Add person" },
  noVictims: { es: "Sin personas registradas todavía", en: "No persons registered yet" },
  closePanel: { es: "Cerrar", en: "Close" },

  // Victim
  vic_missing: { es: "Desaparecida", en: "Missing" },
  vic_trapped: { es: "Atrapada", en: "Trapped" },
  vic_rescued: { es: "Rescatada", en: "Rescued" },
  vic_deceased: { es: "Fallecida", en: "Deceased" },
  lastKnown: { es: "Última ubicación conocida", en: "Last known location" },
  floor: { es: "Piso", en: "Floor" },
  apartment: { es: "Apto.", en: "Apt." },
  familyContact: { es: "Contacto familiar", en: "Family contact" },

  // Forms
  name: { es: "Nombre", en: "Name" },
  buildingName: { es: "Nombre / referencia del edificio", en: "Building name / reference" },
  address: { es: "Dirección", en: "Address" },
  zone: { es: "Zona", en: "Zone" },
  numFloors: { es: "Número de pisos", en: "Number of floors" },
  numApartments: { es: "Número de apartamentos", en: "Number of apartments" },
  contactNameLabel: { es: "Nombre del contacto", en: "Contact name" },
  contactPhoneLabel: { es: "Teléfono del contacto", en: "Contact phone" },
  notes: { es: "Notas", en: "Notes" },
  yourName: { es: "Tu nombre (quien reporta)", en: "Your name (reporter)" },
  cancel: { es: "Cancelar", en: "Cancel" },
  save: { es: "Guardar", en: "Save" },
  saving: { es: "Guardando...", en: "Saving..." },
  required: { es: "Requerido", en: "Required" },

  // Map controls
  pickOnMap: { es: "Toca el mapa para fijar la ubicación", en: "Tap the map to set the location" },
  locationSet: { es: "Ubicación fijada", en: "Location set" },

  // Misc
  people: { es: "personas", en: "people" },
  person: { es: "persona", en: "person" },
  configureFirebase: {
    es: "Conecta Firebase para sincronizar reportes entre todos los equipos.",
    en: "Connect Firebase to sync reports across all teams.",
  },
}

interface I18nValue {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: keyof typeof DICT) => string
}

const I18nContext = createContext<I18nValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("es")

  useEffect(() => {
    const stored = typeof window !== "undefined" ? (localStorage.getItem("rescate-lang") as Lang | null) : null
    if (stored === "es" || stored === "en") setLangState(stored)
  }, [])

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    if (typeof window !== "undefined") localStorage.setItem("rescate-lang", l)
    if (typeof document !== "undefined") document.documentElement.lang = l
  }, [])

  const t = useCallback(
    (key: keyof typeof DICT) => {
      const entry = DICT[key]
      if (!entry) return String(key)
      return entry[lang]
    },
    [lang],
  )

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error("useI18n must be used within I18nProvider")
  return ctx
}
