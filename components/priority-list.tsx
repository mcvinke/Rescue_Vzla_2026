"use client"

import { Activity, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useI18n } from "@/lib/i18n"
import { activeVictims, cityName, priorityLevel, type Building } from "@/lib/types"
import { PRIORITY_BADGE, SEVERITY_TOKEN, STATUS_DOT } from "@/lib/severity-style"
import { cn } from "@/lib/utils"

export function PriorityList({
  buildings,
  selectedId,
  onSelect,
}: {
  buildings: Building[]
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  const { t } = useI18n()

  if (buildings.length === 0) {
    return <p className="px-4 py-8 text-center text-sm text-muted-foreground">{t("noResults")}</p>
  }

  return (
    <ul className="divide-y divide-border">
      {buildings.map((b) => {
        const level = priorityLevel(b)
        const active = activeVictims(b).length
        const selected = b.id === selectedId
        return (
          <li key={b.id}>
            <button
              type="button"
              onClick={() => onSelect(b.id)}
              className={cn(
                "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50",
                selected && "bg-muted",
              )}
            >
              <span
                className="mt-1 size-3 shrink-0 rounded-full"
                style={{ background: SEVERITY_TOKEN[b.severity] }}
                aria-hidden
              />
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium">{b.name}</span>
                  <span className="flex shrink-0 items-center gap-1.5">
                    {b.signsOfLife && (
                      <Activity className="size-3.5 animate-pulse text-sev-stable" aria-label={t("signsOfLifeDetected")} />
                    )}
                    <Badge className={cn("border-0", PRIORITY_BADGE[level])}>{t(level)}</Badge>
                  </span>
                </span>
                <span className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="truncate">{cityName(b.city)}</span>
                  {b.isSample && (
                    <span className="shrink-0 rounded border border-dashed border-border px-1 text-[10px] leading-tight">
                      {t("sampleData")}
                    </span>
                  )}
                </span>
                <span className="mt-1.5 flex items-center gap-3 text-xs">
                  <span
                    className={cn(
                      "flex items-center gap-1 font-medium",
                      active > 0 ? "text-sev-collapsed" : "text-muted-foreground",
                    )}
                  >
                    <Users className="size-3" aria-hidden />
                    {active} {active === 1 ? t("person") : t("people")}
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <span className={cn("size-2 rounded-full", STATUS_DOT[b.status])} aria-hidden />
                    {t(`st_${b.status}`)}
                  </span>
                </span>
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
