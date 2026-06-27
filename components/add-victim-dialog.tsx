"use client"

import { useState } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import { useI18n } from "@/lib/i18n"
import { useRescueStore } from "@/lib/rescue-store"
import type { VictimStatus } from "@/lib/types"

const selectClass =
  "h-9 w-full rounded-lg border border-input bg-input/30 px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

export function AddVictimDialog({
  buildingId,
  open,
  onOpenChange,
}: {
  buildingId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useI18n()
  const { addVictim } = useRescueStore()

  const [name, setName] = useState("")
  const [nationality, setNationality] = useState<"V" | "E">("V")
  const [cedulaNum, setCedulaNum] = useState("")
  const [cedulaUnknown, setCedulaUnknown] = useState(false)
  const [floor, setFloor] = useState("")
  const [apartment, setApartment] = useState("")
  const [status, setStatus] = useState<VictimStatus>("missing")
  const [contactName, setContactName] = useState("")
  const [contactPhone, setContactPhone] = useState("")
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)

  function reset() {
    setName("")
    setNationality("V")
    setCedulaNum("")
    setCedulaUnknown(false)
    setFloor("")
    setApartment("")
    setStatus("missing")
    setContactName("")
    setContactPhone("")
    setNotes("")
  }

  const digits = cedulaNum.replace(/\D/g, "")
  const cedulaValid = cedulaUnknown || digits.length >= 6
  const canSubmit = !!buildingId && !!name.trim() && cedulaValid && !saving

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!buildingId || !name.trim() || !cedulaValid) return
    setSaving(true)
    try {
      await addVictim(buildingId, {
        name: name.trim(),
        cedula: cedulaUnknown ? "" : `${nationality}-${digits}`,
        floor: floor === "" ? null : Number(floor),
        apartment: apartment.trim(),
        status,
        contactName: contactName.trim(),
        contactPhone: contactPhone.trim(),
        notes: notes.trim(),
        signsOfLife: null,
      })
      reset()
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("addVictim")}</DialogTitle>
          <DialogDescription>{t("lastKnown")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="v-name">
              {t("name")} <span className="text-destructive">*</span>
            </Label>
            <Input id="v-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="v-cedula">
              {t("cedula")} {!cedulaUnknown && <span className="text-destructive">*</span>}
            </Label>
            <div className="flex gap-2">
              <select
                aria-label={t("cedula")}
                className={`${selectClass} w-16 shrink-0 disabled:opacity-50`}
                value={nationality}
                onChange={(e) => setNationality(e.target.value as "V" | "E")}
                disabled={cedulaUnknown}
              >
                <option value="V">V</option>
                <option value="E">E</option>
              </select>
              <Input
                id="v-cedula"
                inputMode="numeric"
                autoComplete="off"
                placeholder={t("cedulaPlaceholder")}
                value={cedulaNum}
                onChange={(e) => setCedulaNum(e.target.value.replace(/\D/g, ""))}
                disabled={cedulaUnknown}
                required={!cedulaUnknown}
                className="flex-1"
              />
            </div>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                className="size-3.5 accent-primary"
                checked={cedulaUnknown}
                onChange={(e) => setCedulaUnknown(e.target.checked)}
              />
              {t("cedulaUnknown")}
            </label>
            {!cedulaUnknown && <p className="text-[11px] text-muted-foreground">{t("cedulaHint")}</p>}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="v-floor">{t("floor")}</Label>
              <Input
                id="v-floor"
                type="number"
                min={0}
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="v-apt">{t("apartment")}</Label>
              <Input id="v-apt" value={apartment} onChange={(e) => setApartment(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="v-status">{t("status")}</Label>
              <select
                id="v-status"
                className={selectClass}
                value={status}
                onChange={(e) => setStatus(e.target.value as VictimStatus)}
              >
                <option value="missing">{t("vic_missing")}</option>
                <option value="trapped">{t("vic_trapped")}</option>
                <option value="rescued">{t("vic_rescued")}</option>
                <option value="deceased">{t("vic_deceased")}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="v-cn">{t("contactNameLabel")}</Label>
              <Input id="v-cn" value={contactName} onChange={(e) => setContactName(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="v-cp">{t("contactPhoneLabel")}</Label>
              <Input
                id="v-cp"
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="v-notes">{t("notes")}</Label>
            <Textarea id="v-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {saving ? t("saving") : t("save")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
