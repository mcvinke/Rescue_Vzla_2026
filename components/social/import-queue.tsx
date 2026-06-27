"use client"

import { Check, ExternalLink, Pencil, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n"
import { useRescueStore } from "@/lib/rescue-store"
import { PLATFORM_I18N_KEY, PLATFORM_ICON } from "@/lib/platform-meta"
import type { SocialImport } from "@/lib/types"

function timeAgo(ts: number, lang: "es" | "en") {
  const mins = Math.max(1, Math.round((Date.now() - ts) / 60000))
  if (mins < 60) return lang === "es" ? `hace ${mins} min` : `${mins} min ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return lang === "es" ? `hace ${hrs} h` : `${hrs} h ago`
  const days = Math.round(hrs / 24)
  return lang === "es" ? `hace ${days} d` : `${days} d ago`
}

export function ImportQueue({ onReview }: { onReview: (record: SocialImport) => void }) {
  const { t, lang } = useI18n()
  const { socialImports, updateSocialImport } = useRescueStore()

  // Only items still awaiting a decision.
  const queue = socialImports.filter((s) => s.status === "pending" || s.status === "verifying")

  if (queue.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
        {t("queueEmpty")}
      </p>
    )
  }

  return (
    <ul className="grid gap-3">
      {queue.map((rec) => {
        const Icon = PLATFORM_ICON[rec.platform]
        return (
          <li key={rec.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                <Icon className="size-4" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <p className="font-medium">{rec.parsedName || t("unknownName")}</p>
                  {rec.status === "verifying" && (
                    <span className="rounded-full bg-sev-severe/15 px-2 py-0.5 text-[11px] font-medium text-sev-severe">
                      {t("beingVerified")}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t(PLATFORM_I18N_KEY[rec.platform] as never)}
                  {rec.parsedLocation ? ` · ${rec.parsedLocation}` : ""} · {t("importedAt")}{" "}
                  {timeAgo(rec.createdAt, lang)}
                </p>
                <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground/90">{rec.originalText}</p>
                {rec.sourceUrl && (
                  <a
                    href={rec.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    <ExternalLink className="size-3" aria-hidden />
                    {rec.sourceUrl.replace(/^https?:\/\//, "").slice(0, 40)}
                  </a>
                )}

                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => onReview(rec)}>
                    <Check />
                    {t("verify")}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onReview(rec)}>
                    <Pencil />
                    {t("edit")}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-sev-collapsed hover:text-sev-collapsed"
                    onClick={() =>
                      updateSocialImport(rec.id, { status: "discarded", reviewedAt: Date.now() })
                    }
                  >
                    <X />
                    {t("discard")}
                  </Button>
                </div>
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
