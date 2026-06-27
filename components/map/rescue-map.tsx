"use client"

import { useEffect } from "react"
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import type { Building } from "@/lib/types"
import { buildingIcon } from "./map-icons"

// Centered between La Guaira, Caracas and Los Teques so the first paint shows
// the whole affected region before bounds are fitted.
const REGION_CENTER: [number, number] = [10.46, -66.95]

function FlyTo({ building }: { building: Building | null }) {
  const map = useMap()
  useEffect(() => {
    if (building) {
      map.flyTo([building.lat, building.lng], 15, { duration: 0.8 })
    }
  }, [building, map])
  return null
}

/** When nothing is selected, frame the map to whatever buildings are shown. */
function FitBounds({ buildings, active }: { buildings: Building[]; active: boolean }) {
  const map = useMap()
  const key = buildings.map((b) => b.id).join(",")
  useEffect(() => {
    if (!active || buildings.length === 0) return
    if (buildings.length === 1) {
      map.setView([buildings[0].lat, buildings[0].lng], 14, { animate: true })
      return
    }
    const bounds = buildings.map((b) => [b.lat, b.lng]) as [number, number][]
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 15 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, active, map])
  return null
}

export default function RescueMap({
  buildings,
  selectedId,
  onSelect,
}: {
  buildings: Building[]
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  const selected = buildings.find((b) => b.id === selectedId) ?? null

  return (
    <MapContainer
      center={REGION_CENTER}
      zoom={10}
      zoomControl={false}
      className="h-full w-full"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      {buildings.map((b) => (
        <Marker
          key={b.id}
          position={[b.lat, b.lng]}
          icon={buildingIcon(b, b.id === selectedId)}
          eventHandlers={{ click: () => onSelect(b.id) }}
        />
      ))}
      <FitBounds buildings={buildings} active={!selected} />
      <FlyTo building={selected} />
    </MapContainer>
  )
}
