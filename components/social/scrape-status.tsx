"use client"

import { useState } from "react"
import { RefreshCw, Wifi, WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n"

interface ScrapeResult {
  activePlatforms: string[]
  totalSaved: number
  elapsedMs: number
  note?: string
  errors?: string[]
}

export function ScrapeStatus() {
  const { t } = useI18n()
  const [running, setRunning] = useState(false)
  const [lastResult, setLastResult] = useState<ScrapeResult | null>(null)
  const [lastRunAt, setLastRunAt] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function runNow() {
    setRunning(true)
    setError(null)
    try {
      const res = await fetch("/api/scrape", { method: "POST" })
      const json: ScrapeResult = await res.json()
      setLastResult(json)
      setLastRunAt(Date.now())
    } catch (err) {
      setError(String(err))
    } finally {
      setRunning(false)
    }
  }

  const hasKeys = lastResult && lastResult.activePlatforms.length > 0
  const hasNeverRun = lastResult === null

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          {hasKeys ? (
            <Wifi className="size-4 text-sev-stable shrink-0" aria-hidden />
          ) : (
            <WifiOff className="size-4 text-muted-foreground shrink-0" aria-hidden />
          )}
          <div>
            <p className="text-sm font-medium">
              {hasKeys ? t("scrapeActive") : t("scrapeInactive")}
            </p>
            {!hasNeverRun && (
              <p className="text-xs text-muted-foreground">
                {t("scrapeLastRun")}:{" "}
                {lastRunAt
                  ? new Date(lastRunAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                  : t("scrapeNever")}
                {lastResult && ` · ${lastResult.totalSaved} nuevos`}
              </p>
            )}
            {hasNeverRun && (
              <p className="text-xs text-muted-foreground">{t("scrapeLastRun")}: {t("scrapeNever")}</p>
            )}
          </div>
        </div>

        <Button size="sm" variant="outline" onClick={runNow} disabled={running}>
          <RefreshCw className={running ? "animate-spin" : ""} />
          {running ? t("scrapeRunning") : t("scrapeRunNow")}
        </Button>
      </div>

      {lastResult && lastResult.activePlatforms.length > 0 && (
        <p className="mt-2 text-xs text-muted-foreground">
          {t("scrapePlatforms")}: {lastResult.activePlatforms.join(", ")}
        </p>
      )}

      {lastResult?.note && (
        <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">{lastResult.note}</p>
      )}

      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}

      {lastResult?.errors && lastResult.errors.length > 0 && (
        <ul className="mt-2 space-y-0.5">
          {lastResult.errors.map((e, i) => (
            <li key={i} className="text-xs text-destructive">{e}</li>
          ))}
        </ul>
      )}
    </div>
  )
}
