'use client'

import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import { MapPin } from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix Leaflet default icon in Next.js
const icon = L.icon({
  iconUrl: '/leaflet/marker-icon.png',
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  shadowUrl: '/leaflet/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

type Props = {
  location: [number, number] | null
  onChange: (loc: [number, number]) => void
}

function ClickHandler({ onChange }: { onChange: (loc: [number, number]) => void }) {
  useMapEvents({
    click(e) {
      onChange([e.latlng.lat, e.latlng.lng])
    },
  })
  return null
}

const BUCHAREST: [number, number] = [44.4268, 26.1025]

export function LocationPickerClient({ location, onChange }: Props) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
        <MapPin size={14} /> Click pe hartă pentru a seta locația *
      </p>
      {location && (
        <p className="text-xs text-muted-foreground font-mono">
          {location[0].toFixed(5)}, {location[1].toFixed(5)}
        </p>
      )}
      <div className="h-[320px] rounded-xl overflow-hidden border border-border">
        <MapContainer
          center={location ?? BUCHAREST}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <ClickHandler onChange={onChange} />
          {location && <Marker position={location} icon={icon} />}
        </MapContainer>
      </div>
    </div>
  )
}
