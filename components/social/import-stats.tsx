"use client"

import { useMemo } from "react"
import { useI18n } from "@/lib/i18n"
import { useRescueStore } from "@/lib/rescue-store"
import { IMPORT_PLATFORMS } from "@/lib/types"
import { PLATFORM_I18N_KEY, PLATFORM_ICON } from "@/lib/platform-meta"

export function ImportStats() {
  const { t } = useI18n()
  const { socialImports } = useRescueStore()

  const stats = useMemo(() => {
    const byStatus = { pending: 0, verifying: 0, verified: 0, discarded: 0 }
    const byPlatform: Record<string, number> = {}
    for (const s of socialImports) {
      byStatus[s.status]++
      byPlatform[s.platform] = (byPlatform[s.platform] ?? 0) + 1
    }
    return { total: socialImports.length, byStatus, byPlatform }
  }, [socialImports])

  const cards = [
    { label: t("totalImported"), value: stats.total, tone: "text-foreground" },
    { label: t("pendingVerification"), value: stats.byStatus.pending, tone: "text-sev-severe" },
    { label: t("beingVerified"), value: stats.byStatus.verifying, tone: "text-primary" },
    { label: t("verifiedCount"), value: stats.byStatus.verified, tone: "text-sev-stable" },
    { label: t("discardedCount"), value: stats.byStatus.discarded, tone: "text-muted-foreground" },
  ]

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <h3 className="font-heading text-sm font-semibold">{t("socialStats")}</h3>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {cards.map((c) => (
          <div key={c.label} className="rounded-lg border border-border bg-muted/30 px-3 py-2.5">
            <div className={`font-heading text-2xl font-semibold tabular-nums ${c.tone}`}>{c.value}</div>
            <div className="text-xs text-muted-foreground">{c.label}</div>
          </div>
        ))}
      </div>

      <h4 className="mt-4 text-xs font-medium text-muted-foreground">{t("byPlatform")}</h4>
      <div className="mt-2 flex flex-wrap gap-2">
        {IMPORT_PLATFORMS.map((p) => {
          const Icon = PLATFORM_ICON[p]
          const count = stats.byPlatform[p] ?? 0
          return (
            <span
              key={p}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs"
            >
              <Icon className="size-3.5 text-muted-foreground" aria-hidden />
              <span className="font-medium">{t(PLATFORM_I18N_KEY[p] as never)}</span>
              <span className="tabular-nums text-muted-foreground">{count}</span>
            </span>
          )
        })}
      </div>
    </div>
  )
}
