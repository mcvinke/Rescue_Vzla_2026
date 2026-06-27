"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import { MapPin } from "lucide-react"
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
import type { Severity, BuildingStatus } from "@/lib/types"

const LocationPicker = dynamic(() => import("./map/location-picker"), { ssr: false })

const selectClass =
  "h-9 w-full rounded-lg border border-input bg-input/30 px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

export function ReportBuildingDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useI18n()
  const { addBuilding } = useRescueStore()

  const [name, setName] = useState("")
  const [address, setAddress] = useState("")
  const [floors, setFloors] = useState("")
  const [apartments, setApartments] = useState("")
  const [severity, setSeverity] = useState<Severity>("severe")
  const [status, setStatus] = useState<BuildingStatus>("pending")
  const [accessNotes, setAccessNotes] = useState("")
  const [reportedBy, setReportedBy] = useState("")
  const [source, setSource] = useState("WhatsApp")
  const [loc, setLoc] = useState<{ lat: number; lng: number } | null>(null)
  const [saving, setSaving] = useState(false)

  function reset() {
    setName("")
    setAddress("")
    setFloors("")
    setApartments("")
    setSeverity("severe")
    setStatus("pending")
    setAccessNotes("")
    setReportedBy("")
    setSource("WhatsApp")
    setLoc(null)
  }

  const valid = name.trim() && address.trim() && loc

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!valid || !loc) return
    setSaving(true)
    try {
      await addBuilding({
        name: name.trim(),
        address: address.trim(),
        lat: loc.lat,
        lng: loc.lng,
        floors: Number(floors) || 0,
        apartments: Number(apartments) || 0,
        severity,
        status,
        accessNotes: accessNotes.trim(),
        reportedBy: reportedBy.trim() || "—",
        source,
      })
      reset()
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("reportBuilding")}</DialogTitle>
          <DialogDescription>{t("pickOnMap")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="b-name">
              {t("buildingName")} <span className="text-destructive">*</span>
            </Label>
            <Input id="b-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="b-address">
              {t("address")} <span className="text-destructive">*</span>
            </Label>
            <Input id="b-address" value={address} onChange={(e) => setAddress(e.target.value)} required />
          </div>

          <div className="grid gap-1.5">
            <Label>
              {t("pickOnMap")} <span className="text-destructive">*</span>
            </Label>
            <LocationPicker value={loc} onPick={(lat, lng) => setLoc({ lat, lng })} />
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="size-3" aria-hidden />
              {loc
                ? `${t("locationSet")}: ${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`
                : t("required")}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="b-floors">{t("numFloors")}</Label>
              <Input
                id="b-floors"
                type="number"
                min={0}
                value={floors}
                onChange={(e) => setFloors(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="b-apts">{t("numApartments")}</Label>
              <Input
                id="b-apts"
                type="number"
                min={0}
                value={apartments}
                onChange={(e) => setApartments(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="b-sev">{t("severity")}</Label>
              <select
                id="b-sev"
                className={selectClass}
                value={severity}
                onChange={(e) => setSeverity(e.target.value as Severity)}
              >
                <option value="collapsed">{t("sev_collapsed")}</option>
                <option value="severe">{t("sev_severe")}</option>
                <option value="partial">{t("sev_partial")}</option>
                <option value="stable">{t("sev_stable")}</option>
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="b-status">{t("status")}</Label>
              <select
                id="b-status"
                className={selectClass}
                value={status}
                onChange={(e) => setStatus(e.target.value as BuildingStatus)}
              >
                <option value="searching">{t("st_searching")}</option>
                <option value="pending">{t("st_pending")}</option>
                <option value="cleared">{t("st_cleared")}</option>
              </select>
            </div>
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="b-notes">{t("accessNotes")}</Label>
            <Textarea
              id="b-notes"
              rows={2}
              value={accessNotes}
              onChange={(e) => setAccessNotes(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="b-by">{t("yourName")}</Label>
              <Input id="b-by" value={reportedBy} onChange={(e) => setReportedBy(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="b-src">{t("source")}</Label>
              <select
                id="b-src"
                className={selectClass}
                value={source}
                onChange={(e) => setSource(e.target.value)}
              >
                <option>WhatsApp</option>
                <option>Telegram</option>
                <option>Twitter/X</option>
                <option>Instagram</option>
                <option>TikTok</option>
                <option value="Reporte directo">{t("source")}: directo</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={!valid || saving}>
              {saving ? t("saving") : t("save")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
