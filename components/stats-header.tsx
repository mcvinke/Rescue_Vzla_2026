"use client"

import { useEffect, useMemo, useState } from "react"
import { Activity, Building2, HeartPulse, Users } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import type { Building } from "@/lib/types"

function timeAgo(ts: number, lang: "es" | "en") {
  const mins = Math.max(1, Math.round((Date.now() - ts) / 60000))
  if (mins < 60) return lang === "es" ? `hace ${mins} min` : `${mins} min ago`
  const hrs = Math.round(mins / 60)
  return lang === "es" ? `hace ${hrs} h` : `${hrs} h ago`
}

export function StatsHeader({ buildings, live }: { buildings: Building[]; live: boolean }) {
  const { t, lang } = useI18n()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const stats = useMemo(() => {
    let collapsed = 0
    let missing = 0
    let rescued = 0
    let searching = 0
    let lastUpdated = 0
    for (const b of buildings) {
      if (b.severity === "collapsed") collapsed++
      if (b.status === "searching") searching++
      if (b.updatedAt > lastUpdated) lastUpdated = b.updatedAt
      for (const v of b.victims) {
        if (v.status === "missing" || v.status === "trapped") missing++
        if (v.status === "rescued") rescued++
      }
    }
    return { collapsed, missing, rescued, searching, lastUpdated, total: buildings.length }
  }, [buildings])

  const items = [
    { icon: Building2, label: t("buildings"), value: stats.total, tone: "text-foreground" },
    { icon: Activity, label: t("collapsed"), value: stats.collapsed, tone: "text-sev-collapsed" },
    { icon: Users, label: t("missing"), value: stats.missing, tone: "text-sev-severe" },
    { icon: HeartPulse, label: t("rescued"), value: stats.rescued, tone: "text-sev-stable" },
  ]

  return (
    <header className="border-b border-border bg-card/80 backdrop-blur">
      <div className="flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between lg:px-6">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <HeartPulse className="size-5" aria-hidden />
          </div>
          <div>
            <h1 className="font-heading text-lg leading-tight font-semibold">{t("appName")}</h1>
            <p className="text-xs text-muted-foreground">{t("appTagline")}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground"
            title={live ? "" : t("configureFirebase")}
          >
            <span
              className={`size-2 rounded-full ${live ? "bg-sev-stable" : "bg-muted-foreground"} ${live ? "animate-pulse" : ""}`}
              aria-hidden
            />
            {live ? t("liveData") : t("localData")}
          </span>
          {mounted && stats.lastUpdated > 0 && (
            <span className="hidden text-xs text-muted-foreground sm:inline">
              {t("lastUpdated")}: {timeAgo(stats.lastUpdated, lang)}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-px border-t border-border bg-border sm:grid-cols-4">
        {items.map((it) => (
          <div key={it.label} className="flex items-center gap-3 bg-card px-4 py-3 lg:px-6">
            <it.icon className={`size-5 ${it.tone}`} aria-hidden />
            <div>
              <div className={`font-heading text-2xl font-semibold tabular-nums ${it.tone}`}>{it.value}</div>
              <div className="text-xs text-muted-foreground">{it.label}</div>
            </div>
          </div>
        ))}
      </div>
    </header>
  )
}
