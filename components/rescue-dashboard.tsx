"use client"

import { useMemo, useState } from "react"
import dynamic from "next/dynamic"
import { List, Map as MapIcon, Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useI18n } from "@/lib/i18n"
import { useRescueStore } from "@/lib/rescue-store"
import { CITIES, priorityScore, type Building, type Severity } from "@/lib/types"
import { SEVERITY_TOKEN } from "@/lib/severity-style"
import { cn } from "@/lib/utils"
import { StatsHeader } from "./stats-header"
import { PriorityList } from "./priority-list"
import { BuildingDetail } from "./building-detail"
import { ReportBuildingDialog } from "./report-building-dialog"
import { AddVictimDialog } from "./add-victim-dialog"

const RescueMap = dynamic(() => import("./map/rescue-map"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-muted/40" />,
})

const SEVERITIES: Severity[] = ["collapsed", "severe", "partial", "stable"]

export function RescueDashboard() {
  const { t } = useI18n()
  const { buildings, live } = useRescueStore()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [city, setCity] = useState<string>("all")
  const [filter, setFilter] = useState<Severity | "all">("all")
  const [mobileView, setMobileView] = useState<"map" | "list">("list")
  const [reportOpen, setReportOpen] = useState(false)
  const [victimOpen, setVictimOpen] = useState(false)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return buildings
      .filter((b) => (city === "all" ? true : b.city === city))
      .filter((b) => (filter === "all" ? true : b.severity === filter))
      .filter((b) => {
        if (!q) return true
        const inBuilding = `${b.name} ${b.address}`.toLowerCase().includes(q)
        const inVictims = b.victims.some(
          (v) => v.name.toLowerCase().includes(q) || v.cedula.toLowerCase().includes(q),
        )
        return inBuilding || inVictims
      })
      .sort((a, b) => priorityScore(b) - priorityScore(a))
  }, [buildings, search, city, filter])

  const selected: Building | null = useMemo(
    () => buildings.find((b) => b.id === selectedId) ?? null,
    [buildings, selectedId],
  )

  function handleSelect(id: string) {
    setSelectedId(id)
    setMobileView("map")
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <StatsHeader buildings={buildings} live={live} />

      {/* Mobile view toggle */}
      <div className="flex items-center gap-1 border-b border-border bg-card p-2 lg:hidden">
        <Button
          variant={mobileView === "list" ? "default" : "ghost"}
          size="sm"
          className="flex-1"
          onClick={() => setMobileView("list")}
        >
          <List />
          {t("priorityList")}
        </Button>
        <Button
          variant={mobileView === "map" ? "default" : "ghost"}
          size="sm"
          className="flex-1"
          onClick={() => setMobileView("map")}
        >
          <MapIcon />
          {t("affectedZones")}
        </Button>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Sidebar */}
        <aside
          className={cn(
            "flex w-full flex-col border-r border-border bg-card lg:w-[380px] lg:shrink-0",
            mobileView === "map" && "hidden lg:flex",
          )}
        >
          {selected ? (
            <BuildingDetail
              building={selected}
              onClose={() => setSelectedId(null)}
              onAddVictim={() => setVictimOpen(true)}
            />
          ) : (
            <>
              <div className="space-y-3 border-b border-border p-4">
                <div className="relative">
                  <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={t("searchPlaceholder")}
                    className="h-9 pl-8"
                    aria-label={t("searchPlaceholder")}
                  />
                </div>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  aria-label={t("city")}
                  className="h-9 w-full rounded-lg border border-input bg-input/30 px-2.5 text-sm font-medium outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <option value="all">{t("allCities")}</option>
                  {CITIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <div className="flex flex-wrap gap-1.5">
                  <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
                    {t("filterAll")}
                  </FilterChip>
                  {SEVERITIES.map((s) => (
                    <FilterChip
                      key={s}
                      active={filter === s}
                      onClick={() => setFilter(s)}
                      dot={SEVERITY_TOKEN[s]}
                    >
                      {t(`sev_${s}`)}
                    </FilterChip>
                  ))}
                </div>
                <Button className="w-full" onClick={() => setReportOpen(true)}>
                  <Plus />
                  {t("reportBuilding")}
                </Button>
              </div>
              <div className="flex items-center justify-between px-4 py-2">
                <h2 className="font-heading text-sm font-semibold">{t("priorityList")}</h2>
                <span className="text-xs text-muted-foreground">{filtered.length}</span>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto">
                <PriorityList buildings={filtered} selectedId={selectedId} onSelect={handleSelect} />
              </div>
            </>
          )}
        </aside>

        {/* Map */}
        <main className={cn("relative min-h-0 flex-1", mobileView === "list" && "hidden lg:block")}>
          <RescueMap buildings={filtered} selectedId={selectedId} onSelect={handleSelect} />
        </main>
      </div>

      <ReportBuildingDialog open={reportOpen} onOpenChange={setReportOpen} />
      <AddVictimDialog buildingId={selectedId} open={victimOpen} onOpenChange={setVictimOpen} />
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  dot,
  children,
}: {
  active: boolean
  onClick: () => void
  dot?: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
        active
          ? "border-primary bg-primary/10 text-foreground"
          : "border-border text-muted-foreground hover:text-foreground",
      )}
    >
      {dot && <span className="size-2 rounded-full" style={{ background: dot }} aria-hidden />}
      {children}
    </button>
  )
}
