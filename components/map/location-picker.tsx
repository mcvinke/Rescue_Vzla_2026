"use client"

import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet"
import { pickerIcon } from "./map-icons"

const COAST_CENTER: [number, number] = [10.603, -66.945]

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

export default function LocationPicker({
  value,
  onPick,
}: {
  value: { lat: number; lng: number } | null
  onPick: (lat: number, lng: number) => void
}) {
  return (
    <MapContainer
      center={value ? [value.lat, value.lng] : COAST_CENTER}
      zoom={13}
      zoomControl={false}
      className="h-44 w-full rounded-lg"
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution=""
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
      <ClickHandler onPick={onPick} />
      {value && <Marker position={[value.lat, value.lng]} icon={pickerIcon()} />}
    </MapContainer>
  )
}
