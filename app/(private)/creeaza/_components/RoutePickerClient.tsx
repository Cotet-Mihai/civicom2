'use client'

import { MapContainer, TileLayer, Marker, Polyline, useMapEvents } from 'react-leaflet'
import { MapPin, X } from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

const icon = L.icon({
  iconUrl: '/leaflet/marker-icon.png',
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  shadowUrl: '/leaflet/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

type Props = {
  locations: [number, number][]
  onChange: (locs: [number, number][]) => void
}

function ClickHandler({ onAdd }: { onAdd: (loc: [number, number]) => void }) {
  useMapEvents({
    click(e) {
      onAdd([e.latlng.lat, e.latlng.lng])
    },
  })
  return null
}

const BUCHAREST: [number, number] = [44.4268, 26.1025]

export function RoutePickerClient({ locations, onChange }: Props) {
  function addPoint(loc: [number, number]) {
    onChange([...locations, loc])
  }

  function removePoint(i: number) {
    onChange(locations.filter((_, idx) => idx !== i))
  }

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
        <MapPin size={14} /> Click pe hartă pentru a adăuga puncte de traseu (min. 2) *
      </p>
      <div className="h-[320px] rounded-xl overflow-hidden border border-border">
        <MapContainer
          center={locations[0] ?? BUCHAREST}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <ClickHandler onAdd={addPoint} />
          {locations.map((loc, i) => (
            <Marker key={i} position={loc} icon={icon} />
          ))}
          {locations.length >= 2 && (
            <Polyline
              positions={locations}
              pathOptions={{ color: '#16a34a', weight: 4 }}
            />
          )}
        </MapContainer>
      </div>
      {locations.length > 0 && (
        <div className="space-y-1">
          {locations.map((loc, i) => (
            <div
              key={i}
              className="flex items-center justify-between text-xs font-mono text-muted-foreground bg-muted/50 rounded px-2 py-1"
            >
              <span>
                Punct {i + 1}: {loc[0].toFixed(5)}, {loc[1].toFixed(5)}
              </span>
              <button
                onClick={() => removePoint(i)}
                className="hover:text-destructive"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
