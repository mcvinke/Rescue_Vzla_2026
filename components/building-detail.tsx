"use client"

import { useState } from "react"
import { Activity, AlertTriangle, ClipboardList, DoorOpen, MapPin, Phone, Radio, UserPlus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useI18n } from "@/lib/i18n"
import { useRescueStore } from "@/lib/rescue-store"
import { activeVictims, cityName, priorityLevel, type Building, type ResidentInterview, type SignalKind, type VictimStatus } from "@/lib/types"
import { PRIORITY_BADGE, SEVERITY_BADGE, VICTIM_BADGE } from "@/lib/severity-style"
import { cn } from "@/lib/utils"

const victimSelectClass =
  "h-7 rounded-md border border-input bg-input/30 px-1.5 text-xs outline-none focus-visible:border-ring"

const SIGNAL_KINDS: SignalKind[] = ["voice", "knock", "noise", "movement"]

const POSTER_FIELDS: { key: keyof ResidentInterview; labelEs: string; labelEn: string; warning?: boolean }[] = [
  { key: "numResidents", labelEs: "Personas en el apartamento", labelEn: "People in the apartment" },
  { key: "residentNames", labelEs: "Nombres y edades", labelEn: "Names and ages" },
  { key: "usualLocation", labelEs: "Ubicación habitual en el edificio", labelEn: "Usual location in building" },
  { key: "emergencyExits", labelEs: "Salidas de emergencia", labelEn: "Emergency exits" },
  { key: "staircases", labelEs: "Escaleras", labelEn: "Staircases" },
  { key: "safeZones", labelEs: "Zonas seguras / reforzadas", labelEn: "Safe / reinforced areas" },
  { key: "hazards", labelEs: "Peligros específicos", labelEn: "Specific hazards", warning: true },
  { key: "residentContacts", labelEs: "Contactos de otros residentes", labelEn: "Contacts for other residents" },
]

function timeAgo(ts: number, lang: "es" | "en") {
  const mins = Math.max(1, Math.round((Date.now() - ts) / 60000))
  if (mins < 60) return lang === "es" ? `hace ${mins} min` : `${mins} min ago`
  const hrs = Math.round(mins / 60)
  return lang === "es" ? `hace ${hrs} h` : `${hrs} h ago`
}

// ---------------------------------------------------------------------------
// Inline form for reporting signs of life (victim or building level)
// ---------------------------------------------------------------------------

function SolForm({
  onSave,
  onCancel,
}: {
  onSave: (kind: SignalKind, notes: string, reporter: string) => Promise<void>
  onCancel: () => void
}) {
  const { t } = useI18n()
  const [kind, setKind] = useState<SignalKind>("voice")
  const [notes, setNotes] = useState("")
  const [reporter, setReporter] = useState("")
  const [saving, setSaving] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave(kind, notes.trim(), reporter.trim())
    } finally {
      setSaving(false)
    }
  }

  return (
    <form
      onSubmit={handleSave}
      className="mt-2 grid gap-2 rounded-lg border border-sev-stable/40 bg-sev-stable/5 p-3"
    >
      <div className="grid gap-1">
        <Label className="text-xs">{t("solKindLabel")}</Label>
        <select
          className="h-8 w-full rounded-md border border-input bg-input/30 px-2 text-xs outline-none focus-visible:border-ring"
          value={kind}
          onChange={(e) => setKind(e.target.value as SignalKind)}
        >
          {SIGNAL_KINDS.map((k) => (
            <option key={k} value={k}>
              {t(`sol_${k}` as never)}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-1">
        <Label className="text-xs" htmlFor="sol-notes">{t("solNotes")}</Label>
        <Input
          id="sol-notes"
          className="h-8 text-xs"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Piso 5, zona norte..."
        />
      </div>

      <div className="grid gap-1">
        <Label className="text-xs" htmlFor="sol-reporter">{t("solReporter")}</Label>
        <Input
          id="sol-reporter"
          className="h-8 text-xs"
          value={reporter}
          onChange={(e) => setReporter(e.target.value)}
          placeholder="Tu nombre o equipo"
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" size="sm" className="flex-1 bg-sev-stable text-white hover:bg-sev-stable/90" disabled={saving}>
          <Activity className="size-3" />
          {saving ? "..." : t("solSave")}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel} disabled={saving}>
          <X className="size-3" />
        </Button>
      </div>
    </form>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function BuildingDetail({
  building,
  onClose,
  onAddVictim,
}: {
  building: Building
  onClose: () => void
  onAddVictim: () => void
}) {
  const { t, lang } = useI18n()
  const { setVictimStatus, reportVictimSignsOfLife, reportBuildingSignsOfLife } = useRescueStore()
  const level = priorityLevel(building)
  const active = activeVictims(building).length

  const [solVictimId, setSolVictimId] = useState<string | null>(null)
  const [solBuilding, setSolBuilding] = useState(false)

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-2 border-b border-border p-4">
        <div className="min-w-0">
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
            <Badge className={cn("border-0", PRIORITY_BADGE[level])}>
              {t("priority")}: {t(level)}
            </Badge>
            <Badge className={cn("border-0", SEVERITY_BADGE[building.severity])}>
              {t(`sev_${building.severity}`)}
            </Badge>
            {building.signsOfLife && (
              <Badge className="border-0 bg-sev-stable/15 text-sev-stable animate-pulse">
                <Activity className="mr-1 size-3" aria-hidden />
                {t("signsOfLifeDetected")}
              </Badge>
            )}
            {building.isSample && (
              <Badge variant="outline" className="border-dashed text-muted-foreground">
                {t("sampleData")}
              </Badge>
            )}
          </div>
          <h2 className="font-heading text-base leading-tight font-semibold text-balance">
            {building.name}
          </h2>
          <p className="mt-0.5 flex items-start gap-1 text-xs text-muted-foreground">
            <MapPin className="mt-0.5 size-3 shrink-0" aria-hidden />
            {building.address} · {cityName(building.city)}
          </p>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label={t("closePanel")}>
          <X />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-4 p-4">
          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat label={t("floors")} value={building.floors || "—"} />
            <Stat label={t("apartments")} value={building.apartments || "—"} />
            <Stat label={t("missing")} value={active} tone={active > 0 ? "text-sev-collapsed" : undefined} />
          </div>

          {/* Building-level signs of life */}
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Activity
                  className={cn("size-3.5", building.signsOfLife ? "text-sev-stable" : "text-muted-foreground")}
                  aria-hidden
                />
                <span className="text-xs font-medium">
                  {building.signsOfLife
                    ? `${t("signsOfLifeDetected")} · ${building.signsOfLifeAt ? timeAgo(building.signsOfLifeAt, lang) : ""}`
                    : t("signsOfLifeNone")}
                </span>
              </div>
              {!solBuilding && (
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setSolBuilding(true)}>
                  {t("solReportBuilding")}
                </Button>
              )}
            </div>
            {solBuilding && (
              <SolForm
                onSave={async (kind, notes, reporter) => {
                  await reportBuildingSignsOfLife(building.id, kind, notes, reporter)
                  setSolBuilding(false)
                }}
                onCancel={() => setSolBuilding(false)}
              />
            )}
          </div>

          {building.accessNotes && (
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-foreground">
                <DoorOpen className="size-3.5 text-primary" aria-hidden />
                {t("accessNotes")}
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">{building.accessNotes}</p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Radio className="size-3" aria-hidden />
              {t("source")}: {building.source}
            </span>
            <span>
              {t("reportedBy")}: {building.reportedBy}
            </span>
          </div>

          {building.residentInterview && POSTER_FIELDS.some((f) => building.residentInterview![f.key]) && (
            <div className="rounded-lg border border-amber-200/80 bg-amber-50/50 p-3 dark:border-amber-800/50 dark:bg-amber-950/20">
              <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
                <ClipboardList className="size-3.5" aria-hidden />
                {t("posterInterview")}
              </h4>
              <div className="space-y-2">
                {POSTER_FIELDS.map((f) => {
                  const value = building.residentInterview![f.key]
                  if (!value) return null
                  return (
                    <div key={f.key}>
                      <p className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        {f.warning && <AlertTriangle className="size-3 text-amber-500" aria-hidden />}
                        {lang === "es" ? f.labelEs : f.labelEn}
                      </p>
                      <p className="text-xs leading-relaxed text-foreground">{value}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <Separator />

          <div className="flex items-center justify-between">
            <h3 className="font-heading text-sm font-semibold">
              {t("victimsTitle")}{" "}
              <span className="text-muted-foreground">({building.victims.length})</span>
            </h3>
            <Button size="sm" variant="outline" onClick={onAddVictim}>
              <UserPlus />
              {t("addVictim")}
            </Button>
          </div>

          {building.victims.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border py-6 text-center text-xs text-muted-foreground">
              {t("noVictims")}
            </p>
          ) : (
            <ul className="space-y-2">
              {building.victims.map((v) => (
                <li key={v.id} className="rounded-lg border border-border bg-card p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium">{v.name}</p>
                        {v.signsOfLife && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-sev-stable/15 px-1.5 py-0.5 text-[10px] font-medium text-sev-stable">
                            <Activity className="size-2.5" aria-hidden />
                            {t(`sol_${v.signsOfLife.kind}` as never)} · {timeAgo(v.signsOfLife.detectedAt, lang)}
                          </span>
                        )}
                      </div>
                      <p className="font-mono text-xs text-foreground">
                        {t("cedula")}: {v.cedula || t("cedulaUnknownValue")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("floor")} {v.floor ?? "—"} · {t("apartment")} {v.apartment || "—"}
                      </p>
                    </div>
                    <Badge className={cn("border-0 shrink-0", VICTIM_BADGE[v.status])}>{t(`vic_${v.status}`)}</Badge>
                  </div>

                  {(v.contactName || v.contactPhone) && (
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Phone className="size-3 shrink-0" aria-hidden />
                      {v.contactName}
                      {v.contactPhone && (
                        <a
                          href={`tel:${v.contactPhone.replace(/\s/g, "")}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {v.contactPhone}
                        </a>
                      )}
                    </p>
                  )}

                  {v.notes && <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{v.notes}</p>}

                  {v.signsOfLife?.notes && (
                    <p className="mt-1.5 text-xs italic text-sev-stable">
                      "{v.signsOfLife.notes}"
                      {v.signsOfLife.reportedBy ? ` — ${v.signsOfLife.reportedBy}` : ""}
                    </p>
                  )}

                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <select
                      className={victimSelectClass}
                      value={v.status}
                      onChange={(e) => setVictimStatus(building.id, v.id, e.target.value as VictimStatus)}
                      aria-label={`${t("status")} ${v.name}`}
                    >
                      <option value="missing">{t("vic_missing")}</option>
                      <option value="trapped">{t("vic_trapped")}</option>
                      <option value="rescued">{t("vic_rescued")}</option>
                      <option value="deceased">{t("vic_deceased")}</option>
                    </select>

                    {solVictimId !== v.id ? (
                      <Button
                        size="sm"
                        variant={v.signsOfLife ? "outline" : "default"}
                        className={cn("h-7 text-xs", !v.signsOfLife && "bg-sev-stable hover:bg-sev-stable/90 text-white border-0")}
                        onClick={() => setSolVictimId(v.id)}
                      >
                        <Activity className="size-3" />
                        {t("reportSignsOfLife")}
                      </Button>
                    ) : null}
                  </div>

                  {solVictimId === v.id && (
                    <SolForm
                      onSave={async (kind, notes, reporter) => {
                        await reportVictimSignsOfLife(building.id, v.id, kind, notes, reporter)
                        setSolVictimId(null)
                      }}
                      onCancel={() => setSolVictimId(null)}
                    />
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: React.ReactNode; tone?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card py-2">
      <div className={cn("font-heading text-lg font-semibold tabular-nums", tone)}>{value}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  )
}
