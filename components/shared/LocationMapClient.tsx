'use client'

import { Card, CardContent } from '@/components/ui/card'
import { MapPin } from 'lucide-react'
import { Map, MapMarker, MapTileLayer, MapZoomControl } from '@/components/ui/map'

type Props = {
  location: [number, number]
}

export function LocationMapClient({ location }: Props) {
  return (
    <Card className="shadow-lg shadow-black/5 border-border overflow-hidden">
      <CardContent className="p-0">
        <div className="px-4 pt-4 pb-2">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <MapPin size={14} />
            Locație
          </h3>
        </div>
        <div className="h-[280px] w-full overflow-hidden">
          <Map center={location} zoom={14} className="!min-h-0 h-full w-full">
            <MapTileLayer />
            <MapZoomControl />
            <MapMarker position={location} />
          </Map>
        </div>
      </CardContent>
    </Card>
  )
}
