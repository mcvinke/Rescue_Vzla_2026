"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useI18n } from "@/lib/i18n"
import { useRescueStore } from "@/lib/rescue-store"
import type { ImportStatus, SignalType, SocialImport } from "@/lib/types"

const selectClass =
  "h-9 w-full rounded-lg border border-input bg-input/30 px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

const SIGNALS: SignalType[] = ["missing_person", "building", "unclear"]
const STATUSES: ImportStatus[] = ["pending", "verifying", "verified", "discarded"]

const STATUS_KEY: Record<ImportStatus, string> = {
  pending: "pendingVerification",
  verifying: "beingVerified",
  verified: "verifiedCount",
  discarded: "discardedCount",
}

export function VerifyImportDialog({
  record,
  reviewer,
  open,
  onOpenChange,
}: {
  record: SocialImport | null
  reviewer: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useI18n()
  const { updateSocialImport, verifyImport } = useRescueStore()

  const [name, setName] = useState("")
  const [location, setLocation] = useState("")
  const [phone, setPhone] = useState("")
  const [building, setBuilding] = useState("")
  const [signalType, setSignalType] = useState<SignalType>("unclear")
  const [status, setStatus] = useState<ImportStatus>("verifying")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!record) return
    setName(record.parsedName)
    setLocation(record.parsedLocation)
    setPhone(record.parsedPhone)
    setBuilding(record.parsedBuilding ?? "")
    setSignalType(record.signalType)
    setStatus(record.status === "pending" ? "verifying" : record.status)
  }, [record])

  if (!record) return null

  async function handleSave() {
    if (!record) return
    setSaving(true)
    try {
      const patch = {
        parsedName: name.trim(),
        parsedLocation: location.trim(),
        parsedPhone: phone.trim(),
        parsedBuilding: building.trim(),
        signalType,
      }
      if (status === "verified") {
        await verifyImport(record.id, patch, reviewer || record.reviewedBy)
      } else {
        await updateSocialImport(record.id, {
          ...patch,
          status,
          reviewedAt: Date.now(),
          reviewedBy: reviewer || record.reviewedBy,
        })
      }
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("verify")}</DialogTitle>
          <DialogDescription>{t("editBeforeSaving")}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="vi-name">{t("possibleName")}</Label>
            <Input id="vi-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="vi-loc">{t("possibleLocation")}</Label>
              <Input id="vi-loc" value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="vi-phone">{t("possibleContact")}</Label>
              <Input id="vi-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="vi-building">{t("possibleBuilding")}</Label>
            <Input id="vi-building" value={building} onChange={(e) => setBuilding(e.target.value)} placeholder="Torre, Residencias, Edificio..." />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="vi-signal">{t("signalTypeLabel")}</Label>
              <select
                id="vi-signal"
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
              <Label htmlFor="vi-status">{t("status")}</Label>
              <select
                id="vi-status"
                className={selectClass}
                value={status}
                onChange={(e) => setStatus(e.target.value as ImportStatus)}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {t(STATUS_KEY[s] as never)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label>{t("originalPost")}</Label>
            <p className="max-h-32 overflow-y-auto rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm whitespace-pre-wrap text-muted-foreground">
              {record.originalText}
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </Button>
            <Button type="button" onClick={handleSave} disabled={saving}>
              {saving ? t("saving") : t("save")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
