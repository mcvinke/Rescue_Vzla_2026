"use client"

import { ExternalLink, Radar } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { MONITOR_LINKS } from "@/lib/platform-meta"

export function MonitorLinks() {
  const { t } = useI18n()
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start gap-2">
        <Radar className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
        <div>
          <h3 className="font-heading text-sm font-semibold">{t("manualMonitoring")}</h3>
          <p className="text-xs text-muted-foreground">{t("manualMonitoringHint")}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {MONITOR_LINKS.map((link) => (
          <a
            key={link.url}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1.5 text-xs font-medium transition-colors hover:border-primary hover:text-primary"
          >
            {link.label}
            <ExternalLink className="size-3" aria-hidden />
          </a>
        ))}
      </div>
    </div>
  )
}
