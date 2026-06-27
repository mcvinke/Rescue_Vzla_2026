"use client"

import { useMemo, useState } from "react"
import { AlertTriangle, Save, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useI18n } from "@/lib/i18n"
import { useRescueStore } from "@/lib/rescue-store"
import { parsePost } from "@/lib/social-parser"
import { PLATFORM_I18N_KEY } from "@/lib/platform-meta"
import type { SignalType } from "@/lib/types"
import type { AnalyzedInput } from "./import-form"

const selectClass =
  "h-9 w-full rounded-lg border border-input bg-input/30 px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

const SIGNALS: SignalType[] = ["missing_person", "building", "unclear"]

export function ParsePreview({
  input,
  reviewer,
  onDone,
}: {
  input: AnalyzedInput
  reviewer: string
  onDone: () => void
}) {
  const { t } = useI18n()
  const { addSocialImport } = useRescueStore()

  const parsed = useMemo(() => parsePost(input.text), [input.text])
  const [name, setName] = useState(parsed.name)
  const [location, setLocation] = useState(parsed.location)
  const [phone, setPhone] = useState(parsed.phone)
  const [building, setBuilding] = useState(parsed.building)
  const [signalType, setSignalType] = useState<SignalType>(parsed.signalType)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      await addSocialImport({
        originalText: input.text,
        platform: input.platform,
        sourceUrl: input.url,
        postedAt: input.postedAt,
        parsedName: name.trim(),
        parsedLocation: location.trim(),
        parsedPhone: phone.trim(),
        parsedBuilding: building.trim(),
        signalType,
        status: "pending",
        reviewedBy: reviewer,
      })
      onDone()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-sev-collapsed/40 bg-card">
      <div className="flex items-center gap-2 border-b border-border bg-sev-collapsed/10 px-4 py-2.5">
        <AlertTriangle className="size-4 text-sev-collapsed" aria-hidden />
        <span className="text-sm font-semibold tracking-wide text-sev-collapsed uppercase">
          {t("unverified")}
        </span>
        <span className="ml-auto text-xs text-muted-foreground">
          {t("source")}: {t(PLATFORM_I18N_KEY[input.platform] as never)}
        </span>
      </div>

      <div className="grid gap-3 p-4">
        <p className="text-xs text-muted-foreground">{t("editBeforeSaving")}</p>

        <div className="grid gap-1.5">
          <Label htmlFor="pp-name">
            {t("possibleName")}{" "}
            <span className="font-normal text-muted-foreground">({t("needsVerification")})</span>
          </Label>
          <Input id="pp-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="pp-loc">{t("possibleLocation")}</Label>
            <Input id="pp-loc" value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="pp-phone">{t("possibleContact")}</Label>
            <Input id="pp-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="pp-building">{t("possibleBuilding")}</Label>
          <Input id="pp-building" value={building} onChange={(e) => setBuilding(e.target.value)} placeholder="Torre, Residencias, Edificio..." />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="pp-signal">{t("signalTypeLabel")}</Label>
          <select
            id="pp-signal"
            className={selectClass}
            value={signalType}
            onChange={(e) => setSignalType(e.target.value as SignalType)}
          >
            {SIGNALS.map((s) => (
              <option key={s} value={s}>
                {t(`sig_${s}` as never)}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-1.5">
          <Label>{t("originalPost")}</Label>
          <p className="max-h-32 overflow-y-auto rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm whitespace-pre-wrap text-muted-foreground">
            {input.text}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <Button onClick={handleSave} disabled={saving}>
            <Save />
            {saving ? t("saving") : t("saveToFirestore")}
          </Button>
          <Button type="button" variant="outline" onClick={onDone} disabled={saving}>
            <Trash2 />
            {t("discard")}
          </Button>
        </div>
      </div>
    </div>
  )
}
