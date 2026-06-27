"use client"

import { DoorOpen, MapPin, Phone, Plus, Radio, UserPlus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useI18n } from "@/lib/i18n"
import { useRescueStore } from "@/lib/rescue-store"
import { activeVictims, cityName, priorityLevel, type Building, type VictimStatus } from "@/lib/types"
import { PRIORITY_BADGE, SEVERITY_BADGE, VICTIM_BADGE } from "@/lib/severity-style"
import { cn } from "@/lib/utils"

const victimSelectClass =
  "h-7 rounded-md border border-input bg-input/30 px-1.5 text-xs outline-none focus-visible:border-ring"

export function BuildingDetail({
  building,
  onClose,
  onAddVictim,
}: {
  building: Building
  onClose: () => void
  onAddVictim: () => void
}) {
  const { t } = useI18n()
  const { setVictimStatus } = useRescueStore()
  const level = priorityLevel(building)
  const active = activeVictims(building).length

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
                      <p className="text-sm font-medium">{v.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {t("floor")} {v.floor ?? "—"} · {t("apartment")} {v.apartment || "—"}
                      </p>
                    </div>
                    <Badge className={cn("border-0", VICTIM_BADGE[v.status])}>{t(`vic_${v.status}`)}</Badge>
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

                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-muted-foreground">{t("status")}</span>
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
                  </div>
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
