"use client"

import { useEffect, useState } from "react"
import { Inbox, UserCog } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useI18n } from "@/lib/i18n"
import { useRescueStore } from "@/lib/rescue-store"
import type { SocialImport } from "@/lib/types"
import { ImportForm, type AnalyzedInput } from "./import-form"
import { ParsePreview } from "./parse-preview"
import { ImportQueue } from "./import-queue"
import { MonitorLinks } from "./monitor-links"
import { ImportStats } from "./import-stats"
import { VerifyImportDialog } from "./verify-import-dialog"

const NAME_KEY = "rescate-coordinator"

export function SocialMonitor() {
  const { t } = useI18n()
  const { socialImports } = useRescueStore()

  const [reviewer, setReviewer] = useState("")
  const [nameDraft, setNameDraft] = useState("")
  const [analyzed, setAnalyzed] = useState<AnalyzedInput | null>(null)
  const [reviewing, setReviewing] = useState<SocialImport | null>(null)
  const [verifyOpen, setVerifyOpen] = useState(false)

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(NAME_KEY) : null
    if (stored) setReviewer(stored)
  }, [])

  function saveName(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = nameDraft.trim()
    if (!trimmed) return
    setReviewer(trimmed)
    if (typeof window !== "undefined") localStorage.setItem(NAME_KEY, trimmed)
  }

  function openReview(record: SocialImport) {
    setReviewing(record)
    setVerifyOpen(true)
  }

  const queueCount = socialImports.filter((s) => s.status === "pending" || s.status === "verifying").length

  // Ask for the coordinator name once; everything else stays gated behind it so
  // each review is attributable (no auth required).
  if (!reviewer) {
    return (
      <div className="mx-auto flex min-h-full max-w-md items-center justify-center p-6">
        <form onSubmit={saveName} className="w-full rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-2">
            <UserCog className="size-5 text-primary" aria-hidden />
            <h2 className="font-heading text-base font-semibold">{t("coordinatorName")}</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{t("coordinatorPrompt")}</p>
          <Label htmlFor="coord-name" className="sr-only">
            {t("coordinatorName")}
          </Label>
          <Input
            id="coord-name"
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            className="mt-4"
            autoFocus
          />
          <Button type="submit" className="mt-4 w-full" disabled={!nameDraft.trim()}>
            {t("continueBtn")}
          </Button>
        </form>
      </div>
    )
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-6 p-4 lg:p-6">
      <div>
        <h2 className="font-heading text-xl font-semibold text-balance">{t("socialTitle")}</h2>
        <p className="text-sm text-muted-foreground">{t("socialSubtitle")}</p>
      </div>

      <ImportStats />

      <section className="grid gap-4 rounded-xl border border-border bg-card p-4 lg:p-5">
        <ImportForm onAnalyzed={setAnalyzed} />
        {analyzed && (
          <ParsePreview input={analyzed} reviewer={reviewer} onDone={() => setAnalyzed(null)} />
        )}
      </section>

      <MonitorLinks />

      <section className="grid gap-3">
        <div className="flex items-center gap-2">
          <Inbox className="size-4 text-muted-foreground" aria-hidden />
          <h3 className="font-heading text-sm font-semibold">{t("reviewQueue")}</h3>
          <span className="text-xs text-muted-foreground">{queueCount}</span>
        </div>
        <ImportQueue onReview={openReview} />
      </section>

      <VerifyImportDialog
        record={reviewing}
        reviewer={reviewer}
        open={verifyOpen}
        onOpenChange={setVerifyOpen}
      />
    </div>
  )
}
