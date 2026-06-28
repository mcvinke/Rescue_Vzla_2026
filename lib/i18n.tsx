"use client"

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react"

export type Lang = "es" | "en"

type Dict = Record<string, { es: string; en: string }>

// All UI copy lives here so the app is fully bilingual. Spanish is the default.
const DICT: Dict = {
  appName: { es: "RescateVzla", en: "RescateVzla" },
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

  // Cities
  city: { es: "Ciudad", en: "City" },
  allCities: { es: "Todas las ciudades", en: "All cities" },
  sampleData: { es: "Ejemplo", en: "Sample" },
  sampleNotice: {
    es: "Datos de ejemplo — reemplázalos con reportes reales.",
    en: "Sample data — replace with real reports.",
  },

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
  cedula: { es: "Cédula de identidad", en: "National ID (cédula)" },
  cedulaPlaceholder: { es: "V-12345678", en: "V-12345678" },
  cedulaHint: {
    es: "V para venezolanos, E para extranjeros.",
    en: "V for Venezuelans, E for foreigners.",
  },
  cedulaUnknown: { es: "No conozco la cédula", en: "I don't know the ID" },
  cedulaUnknownValue: { es: "Desconocida", en: "Unknown" },
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

  // Tabs
  tabMap: { es: "Mapa", en: "Map" },
  tabSocial: { es: "Redes / Social", en: "Social" },

  // Social — import form
  socialTitle: { es: "Monitoreo de redes sociales", en: "Social media monitoring" },
  socialSubtitle: {
    es: "Pega publicaciones de redes para convertirlas en reportes sin verificar.",
    en: "Paste social posts to turn them into unverified reports.",
  },
  pastePost: { es: "Pega la publicación aquí", en: "Paste post here" },
  pastePlaceholder: {
    es: "Ej: Busco a mi tía María Pérez, desaparecida en el derrumbe de Playa Grande. Contacto 0414-1234567",
    en: "E.g.: Looking for my aunt María Pérez, missing in the Playa Grande collapse. Contact 0414-1234567",
  },
  platform: { es: "Plataforma", en: "Platform" },
  postUrl: { es: "Enlace de la publicación (opcional)", en: "Post URL or link (optional)" },
  postDate: { es: "Fecha de la publicación", en: "Date of post" },
  analyze: { es: "Analizar publicación", en: "Analyze post" },

  // Platforms
  pf_twitter: { es: "Twitter / X", en: "Twitter / X" },
  pf_instagram: { es: "Instagram", en: "Instagram" },
  pf_tiktok: { es: "TikTok", en: "TikTok" },
  pf_telegram: { es: "Telegram", en: "Telegram" },
  pf_whatsapp: { es: "WhatsApp", en: "WhatsApp" },
  pf_facebook: { es: "Facebook", en: "Facebook" },
  pf_news: { es: "Artículo de noticias", en: "News article" },
  pf_other: { es: "Otro", en: "Other" },

  // Parsed preview
  unverified: { es: "Sin verificar", en: "Unverified" },
  possibleName: { es: "Posible nombre", en: "Possible name" },
  possibleLocation: { es: "Posible ubicación", en: "Possible location" },
  possibleContact: { es: "Posible contacto", en: "Possible contact" },
  signalTypeLabel: { es: "Tipo de señal", en: "Signal type" },
  sig_missing_person: { es: "Persona desaparecida", en: "Missing person" },
  sig_building: { es: "Edificio / derrumbe", en: "Building / collapse" },
  sig_unclear: { es: "No determinado", en: "Unclear" },
  originalPost: { es: "Texto original (solo lectura)", en: "Original post text (read only)" },
  editBeforeSaving: { es: "Edita los campos antes de guardar", en: "Edit fields before saving" },
  saveToFirestore: { es: "Guardar", en: "Save" },
  discard: { es: "Descartar", en: "Discard" },
  needsVerification: { es: "posible — requiere verificación", en: "possible — needs verification" },

  // Queue
  reviewQueue: { es: "Cola de revisión", en: "Review queue" },
  queueEmpty: {
    es: "No hay importaciones pendientes de revisión.",
    en: "No imports pending review.",
  },
  unknownName: { es: "Sin nombre", en: "Unknown" },
  verify: { es: "Verificar", en: "Verify" },
  edit: { es: "Editar", en: "Edit" },
  importedAt: { es: "Importado", en: "Imported" },

  // Monitor links
  manualMonitoring: { es: "Monitoreo manual", en: "Manual monitoring" },
  manualMonitoringHint: {
    es: "Abre estos enlaces para encontrar publicaciones que importar.",
    en: "Open these links to find posts to import.",
  },
  openLink: { es: "Abrir", en: "Open" },

  // Social stats
  socialStats: { es: "Estadísticas de importación", en: "Import statistics" },
  totalImported: { es: "Total importado", en: "Total imported" },
  pendingVerification: { es: "Pendientes", en: "Pending" },
  beingVerified: { es: "En verificación", en: "Being verified" },
  verifiedCount: { es: "Verificados", en: "Verified" },
  discardedCount: { es: "Descartados", en: "Discarded" },
  byPlatform: { es: "Por plataforma", en: "By platform" },

  // Coordinator name
  coordinatorName: { es: "Tu nombre (coordinador)", en: "Your name (coordinator)" },
  coordinatorPrompt: {
    es: "Ingresa tu nombre para registrar quién revisa las importaciones.",
    en: "Enter your name to record who reviews imports.",
  },
  continueBtn: { es: "Continuar", en: "Continue" },
  emptyParse: {
    es: "Pega el texto de una publicación para analizarla.",
    en: "Paste a post's text to analyze it.",
  },
  linkedToRecord: { es: "Guardado como registro", en: "Saved as record" },

  possibleBuilding: { es: "Posible edificio / torre", en: "Possible building / tower" },

  scrapeActive: { es: "Monitoreo automático activo", en: "Auto-monitoring active" },
  scrapeInactive: { es: "Sin claves API — solo pegado manual", en: "No API keys — manual paste only" },
  scrapePlatforms: { es: "Plataformas activas", en: "Active platforms" },
  scrapeLastRun: { es: "Última ejecución automática", en: "Last auto-run" },
  scrapeRunNow: { es: "Ejecutar ahora", en: "Run now" },
  scrapeRunning: { es: "Ejecutando...", en: "Running..." },
  scrapeNever: { es: "Nunca", en: "Never" },

  // Poster: resident interview
  posterInterview: { es: "Entrevista a residentes", en: "Resident interview" },
  posterInterviewHint: {
    es: "Del poster de Rescate — preguntas a quien vivía en el edificio",
    en: "From the Rescue poster — questions for former residents",
  },
  posterExpand: { es: "Agregar respuestas del poster", en: "Add poster answers" },
  posterQ1: { es: "1. ¿Cuántas personas vivían en el apartamento?", en: "1. How many people lived in the apartment?" },
  posterQ1Hint: { es: "Incluya visitas o familiares que dormían ahí.", en: "Include visitors or family members who slept there." },
  posterQ2: { es: "2. ¿Quiénes son? Nombres y edades", en: "2. Who are they? Names and ages" },
  posterQ2Hint: { es: "Niños, adultos mayores, personas con movilidad reducida.", en: "Children, elderly, people with limited mobility." },
  posterQ3: { es: "3. ¿Dónde solían estar dentro del edificio?", en: "3. Where did they usually stay inside the building?" },
  posterQ3Hint: { es: "Piso, número de apartamento, dormitorios, a qué hora.", en: "Floor, apartment number, bedrooms, at what time." },
  posterQ4: { es: "4. ¿Dónde están las salidas de emergencia?", en: "4. Where are the emergency exits?" },
  posterQ4Hint: { es: "Puertas, salidas traseras, accesos al estacionamiento.", en: "Doors, back exits, parking access." },
  posterQ5: { es: "5. ¿Dónde están las escaleras?", en: "5. Where are the staircases?" },
  posterQ5Hint: { es: "Principales y de servicio. ¿Cuántos pisos?", en: "Main and service stairs. How many floors?" },
  posterQ6: { es: "6. ¿Hay zonas seguras o reforzadas?", en: "6. Are there safe or reinforced areas?" },
  posterQ6Hint: { es: "Sótanos, baños, columnas, espacios sin colapsar.", en: "Basements, bathrooms, columns, uncollapsed areas." },
  posterQ7: { es: "7. ¿Hay peligros específicos?", en: "7. Are there specific hazards?" },
  posterQ7Hint: { es: "Gas, químicos, tanques, materiales pesados.", en: "Gas, chemicals, tanks, heavy materials." },
  posterQ8: { es: "8. ¿Tiene contacto de otros residentes?", en: "8. Do you have contacts for other residents?" },
  posterQ8Hint: { es: "Teléfonos de vecinos o familiares para verificar datos.", en: "Neighbor or family phones to verify data." },

  // Signs of life
  signsOfLife: { es: "Señales de vida", en: "Signs of life" },
  signsOfLifeDetected: { es: "Señales de vida detectadas", en: "Signs of life detected" },
  signsOfLifeNone: { es: "Sin señales de vida registradas", en: "No signs of life recorded" },
  reportSignsOfLife: { es: "Reportar señal", en: "Report signal" },
  solKindLabel: { es: "Tipo de señal", en: "Signal type" },
  sol_voice: { es: "Voz / gritos", en: "Voice / shouting" },
  sol_knock: { es: "Golpes / toquidos", en: "Knocking" },
  sol_noise: { es: "Ruido / movimiento de escombros", en: "Noise / debris movement" },
  sol_movement: { es: "Movimiento visible", en: "Visible movement" },
  solNotes: { es: "Notas (piso, zona, descripción)", en: "Notes (floor, area, description)" },
  solReporter: { es: "Reportado por", en: "Reported by" },
  solSave: { es: "Confirmar señal", en: "Confirm signal" },
  solDetectedAt: { es: "detectada", en: "detected" },
  solBuildingLevel: { es: "Señal en el edificio (sin persona específica)", en: "Building-level signal (no specific person)" },
  solReportBuilding: { es: "Reportar señal en edificio", en: "Report building-level signal" },
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
