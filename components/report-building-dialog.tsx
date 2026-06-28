"use client"

import { useState } from "react"
import { MapPin, Loader2, CheckCircle2, ChevronDown, ClipboardList } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useI18n } from "@/lib/i18n"
import { useRescueStore } from "@/lib/rescue-store"
import { CITIES, type Severity, type BuildingStatus, type ResidentInterview } from "@/lib/types"
import { cn } from "@/lib/utils"

const selectClass =
  "h-9 w-full rounded-lg border border-input bg-input/30 px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

function PosterField({
  id,
  label,
  hint,
  value,
  onChange,
  rows,
}: {
  id: string
  label: string
  hint: string
  value: string
  onChange: (v: string) => void
  rows: number
}) {
  return (
    <div className="grid gap-1">
      <Label htmlFor={id} className="text-xs font-medium leading-snug">{label}</Label>
      <p className="text-[11px] text-muted-foreground">{hint}</p>
      <Textarea id={id} rows={rows} value={value} onChange={(e) => onChange(e.target.value)} className="text-sm" />
    </div>
  )
}

async function geocodeAddress(address: string, city: string): Promise<{ lat: number; lng: number } | null> {
  const cityName = CITIES.find((c) => c.id === city)?.name ?? city
  const query = `${address}, ${cityName}, Venezuela`
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`
  try {
    const res = await fetch(url, { headers: { "Accept-Language": "es" } })
    const results = await res.json()
    if (results.length === 0) return null
    return { lat: parseFloat(results[0].lat), lng: parseFloat(results[0].lon) }
  } catch {
    return null
  }
}

export function ReportBuildingDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useI18n()
  const { addBuilding } = useRescueStore()

  const [name, setName] = useState("")
  const [address, setAddress] = useState("")
  const [city, setCity] = useState<string>(CITIES[0].id)
  const [floors, setFloors] = useState("")
  const [apartments, setApartments] = useState("")
  const [severity, setSeverity] = useState<Severity>("severe")
  const [status, setStatus] = useState<BuildingStatus>("pending")
  const [accessNotes, setAccessNotes] = useState("")
  const [reportedBy, setReportedBy] = useState("")
  const [source, setSource] = useState("WhatsApp")
  const [loc, setLoc] = useState<{ lat: number; lng: number } | null>(null)
  const [geocoding, setGeocoding] = useState(false)
  const [geocodeError, setGeocodeError] = useState("")
  const [saving, setSaving] = useState(false)

  // Resident interview (from the rescue poster)
  const [showInterview, setShowInterview] = useState(false)
  const [numResidents, setNumResidents] = useState("")
  const [residentNames, setResidentNames] = useState("")
  const [usualLocation, setUsualLocation] = useState("")
  const [emergencyExits, setEmergencyExits] = useState("")
  const [staircases, setStaircases] = useState("")
  const [safeZones, setSafeZones] = useState("")
  const [hazards, setHazards] = useState("")
  const [residentContacts, setResidentContacts] = useState("")

  function reset() {
    setName("")
    setAddress("")
    setCity(CITIES[0].id)
    setFloors("")
    setApartments("")
    setSeverity("severe")
    setStatus("pending")
    setAccessNotes("")
    setReportedBy("")
    setSource("WhatsApp")
    setLoc(null)
    setGeocodeError("")
    setShowInterview(false)
    setNumResidents("")
    setResidentNames("")
    setUsualLocation("")
    setEmergencyExits("")
    setStaircases("")
    setSafeZones("")
    setHazards("")
    setResidentContacts("")
  }

  async function handleGeocode() {
    if (!address.trim()) return
    setGeocoding(true)
    setGeocodeError("")
    setLoc(null)
    const result = await geocodeAddress(address, city)
    if (result) {
      setLoc(result)
    } else {
      setGeocodeError("No se encontró la dirección. Intenta con más detalles.")
    }
    setGeocoding(false)
  }

  const valid = name.trim() && address.trim() && loc

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!valid || !loc) return
    setSaving(true)
    try {
      const interviewFields: ResidentInterview = {
        numResidents: numResidents.trim(),
        residentNames: residentNames.trim(),
        usualLocation: usualLocation.trim(),
        emergencyExits: emergencyExits.trim(),
        staircases: staircases.trim(),
        safeZones: safeZones.trim(),
        hazards: hazards.trim(),
        residentContacts: residentContacts.trim(),
      }
      const hasInterview = Object.values(interviewFields).some((v) => v.length > 0)

      await addBuilding({
        name: name.trim(),
        address: address.trim(),
        city,
        lat: loc.lat,
        lng: loc.lng,
        floors: Number(floors) || 0,
        apartments: Number(apartments) || 0,
        severity,
        status,
        accessNotes: accessNotes.trim(),
        reportedBy: reportedBy.trim() || "—",
        source,
        signsOfLife: false,
        signsOfLifeAt: null,
        ...(hasInterview ? { residentInterview: interviewFields } : {}),
      })
      reset()
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("reportBuilding")}</DialogTitle>
          <DialogDescription>Ingresa los datos del edificio afectado</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="b-name">
              {t("buildingName")} <span className="text-destructive">*</span>
            </Label>
            <Input id="b-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="b-city">
              {t("city")} <span className="text-destructive">*</span>
            </Label>
            <select
              id="b-city"
              className={selectClass}
              value={city}
              onChange={(e) => { setCity(e.target.value); setLoc(null) }}
            >
              {CITIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="b-address">
              {t("address")} <span className="text-destructive">*</span>
            </Label>
            <div className="flex gap-2">
              <Input
                id="b-address"
                value={address}
                onChange={(e) => { setAddress(e.target.value); setLoc(null) }}
                placeholder="Ej: Av. La Playa, Playa Grande"
                required
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGeocode}
                disabled={!address.trim() || geocoding}
                className="shrink-0"
              >
                {geocoding ? <Loader2 className="size-4 animate-spin" /> : <MapPin className="size-4" />}
              </Button>
            </div>
            {loc && (
              <p className="flex items-center gap-1 text-xs text-green-600">
                <CheckCircle2 className="size-3" />
                Ubicación encontrada: {loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}
              </p>
            )}
            {geocodeError && (
              <p className="text-xs text-destructive">{geocodeError}</p>
            )}
            {!loc && !geocodeError && (
              <p className="text-xs text-muted-foreground">Toca el ícono 📍 para localizar la dirección en el mapa</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="b-floors">{t("numFloors")}</Label>
              <Input
                id="b-floors"
                type="number"
                min={0}
                value={floors}
                onChange={(e) => setFloors(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="b-apts">{t("numApartments")}</Label>
              <Input
                id="b-apts"
                type="number"
                min={0}
                value={apartments}
                onChange={(e) => setApartments(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="b-sev">{t("severity")}</Label>
              <select
                id="b-sev"
                className={selectClass}
                value={severity}
                onChange={(e) => setSeverity(e.target.value as Severity)}
              >
                <option value="collapsed">{t("sev_collapsed")}</option>
                <option value="severe">{t("sev_severe")}</option>
                <option value="partial">{t("sev_partial")}</option>
                <option value="stable">{t("sev_stable")}</option>
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="b-status">{t("status")}</Label>
              <select
                id="b-status"
                className={selectClass}
                value={status}
                onChange={(e) => setStatus(e.target.value as BuildingStatus)}
              >
                <option value="searching">{t("st_searching")}</option>
                <option value="pending">{t("st_pending")}</option>
                <option value="cleared">{t("st_cleared")}</option>
              </select>
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="b-notes">{t("accessNotes")}</Label>
            <Textarea
              id="b-notes"
              rows={2}
              value={accessNotes}
              onChange={(e) => setAccessNotes(e.target.value)}
              placeholder="Ej: Escalera bloqueada, acceso por lado norte"
            />
          </div>

          {/* ── Poster: Entrevista a residentes ── */}
          <div className="overflow-hidden rounded-lg border border-amber-300/70 dark:border-amber-700/50">
            <button
              type="button"
              onClick={() => setShowInterview((v) => !v)}
              className="flex w-full items-center gap-2.5 bg-amber-50/70 px-3 py-2.5 text-left dark:bg-amber-950/30"
            >
              <ClipboardList className="size-4 shrink-0 text-amber-600" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-amber-900 dark:text-amber-200">{t("posterInterview")}</p>
                <p className="text-[11px] text-muted-foreground">{t("posterInterviewHint")}</p>
              </div>
              <ChevronDown
                className={cn("size-4 shrink-0 text-muted-foreground transition-transform", showInterview && "rotate-180")}
                aria-hidden
              />
            </button>

            {showInterview && (
              <div className="grid gap-3 border-t border-amber-200/70 p-3 dark:border-amber-800/50">
                <PosterField id="pi-1" label={t("posterQ1")} hint={t("posterQ1Hint")} value={numResidents} onChange={setNumResidents} rows={1} />
                <PosterField id="pi-2" label={t("posterQ2")} hint={t("posterQ2Hint")} value={residentNames} onChange={setResidentNames} rows={2} />
                <PosterField id="pi-3" label={t("posterQ3")} hint={t("posterQ3Hint")} value={usualLocation} onChange={setUsualLocation} rows={2} />
                <PosterField id="pi-4" label={t("posterQ4")} hint={t("posterQ4Hint")} value={emergencyExits} onChange={setEmergencyExits} rows={2} />
                <PosterField id="pi-5" label={t("posterQ5")} hint={t("posterQ5Hint")} value={staircases} onChange={setStaircases} rows={2} />
                <PosterField id="pi-6" label={t("posterQ6")} hint={t("posterQ6Hint")} value={safeZones} onChange={setSafeZones} rows={2} />
                <PosterField id="pi-7" label={t("posterQ7")} hint={t("posterQ7Hint")} value={hazards} onChange={setHazards} rows={2} />
                <PosterField id="pi-8" label={t("posterQ8")} hint={t("posterQ8Hint")} value={residentContacts} onChange={setResidentContacts} rows={2} />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="b-by">{t("yourName")}</Label>
              <Input id="b-by" value={reportedBy} onChange={(e) => setReportedBy(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="b-src">{t("source")}</Label>
              <select
                id="b-src"
                className={selectClass}
                value={source}
                onChange={(e) => setSource(e.target.value)}
              >
                <option>WhatsApp</option>
                <option>Telegram</option>
                <option>Twitter/X</option>
                <option>Instagram</option>
                <option>TikTok</option>
                <option value="Reporte directo">Reporte directo</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={!valid || saving}>
              {saving ? t("saving") : t("save")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
