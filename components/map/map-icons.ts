import L from "leaflet"
import { activeVictims, priorityLevel, type Building } from "@/lib/types"
import { SEVERITY_TOKEN } from "@/lib/severity-style"

export function buildingIcon(building: Building, selected: boolean): L.DivIcon {
  const color = SEVERITY_TOKEN[building.severity]
  const count = activeVictims(building).length
  const critical = priorityLevel(building) === "critical"
  const size = selected ? 40 : 32
  const ring = critical
    ? `box-shadow: 0 0 0 3px rgba(224,36,36,0.35), 0 0 0 6px rgba(224,36,36,0.15), 0 1px 4px rgba(0,0,0,0.3);`
    : `box-shadow: 0 0 0 2px rgba(255,255,255,0.9), 0 1px 4px rgba(0,0,0,0.35);`

  const badge =
    count > 0
      ? `<span style="position:absolute;top:-6px;right:-6px;min-width:18px;height:18px;padding:0 4px;border-radius:9px;background:#e02424;color:white;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;border:2px solid #ffffff;box-shadow:0 1px 2px rgba(0,0,0,0.3);">${count}</span>`
      : ""

  const html = `
    <div style="position:relative;width:${size}px;height:${size}px;">
      <div style="
        width:${size}px;height:${size}px;border-radius:50%;
        background:${color};
        ${ring}
        display:flex;align-items:center;justify-content:center;
        ${selected ? "outline:3px solid #1a56db;outline-offset:2px;" : ""}
      ">
        <svg width="${size * 0.5}" height="${size * 0.5}" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 21h18"/><path d="M5 21V8l7-5 7 5v13"/><path d="M9 21v-6h6v6"/>
        </svg>
      </div>
      ${badge}
    </div>`

  return L.divIcon({
    html,
    className: "rescue-marker",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

export function pickerIcon(): L.DivIcon {
  const html = `
    <div style="position:relative;width:28px;height:28px;">
      <div style="width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);
        background:#1a56db;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4);"></div>
    </div>`
  return L.divIcon({
    html,
    className: "rescue-marker",
    iconSize: [28, 28],
    iconAnchor: [14, 28],
  })
}
