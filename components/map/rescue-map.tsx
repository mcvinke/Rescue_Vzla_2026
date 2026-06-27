"use client"

import { useEffect } from "react"
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet"
import type { Building } from "@/lib/types"
import { buildingIcon } from "./map-icons"

const COAST_CENTER: [number, number] = [10.603, -66.945]

function FlyTo({ building }: { building: Building | null }) {
  const map = useMap()
  useEffect(() => {
    if (building) {
      map.flyTo([building.lat, building.lng], 15, { duration: 0.8 })
    }
  }, [building, map])
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
      center={COAST_CENTER}
      zoom={12}
      zoomControl={false}
      className="h-full w-full"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      {buildings.map((b) => (
        <Marker
          key={b.id}
          position={[b.lat, b.lng]}
          icon={buildingIcon(b, b.id === selectedId)}
          eventHandlers={{ click: () => onSelect(b.id) }}
        />
      ))}
      <FlyTo building={selected} />
    </MapContainer>
  )
}
