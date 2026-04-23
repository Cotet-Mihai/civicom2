'use client'

import { Card, CardContent } from '@/components/ui/card'
import { MapPin } from 'lucide-react'
import {
  Map,
  MapMarker,
  MapPolyline,
  MapTileLayer,
  MapZoomControl,
} from '@/components/ui/map'

type Props = {
  subcategory: 'gathering' | 'march' | 'picket'
  location?: [number, number]
  locations?: [number, number][]
}

const BUCHAREST: [number, number] = [44.4268, 26.1025]

export function ProtestMapClient({ subcategory, location, locations }: Props) {
  const center: [number, number] =
    subcategory === 'march' && locations?.length
      ? locations[0]
      : location ?? BUCHAREST

  return (
    <Card className="shadow-lg shadow-black/5 border-border overflow-hidden">
      <CardContent className="p-0">
        <div className="px-4 pt-4 pb-2">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <MapPin size={14} />
            {subcategory === 'march' ? 'Traseu marș' : 'Locație'}
          </h3>
        </div>
        <div className="h-[280px] w-full overflow-hidden">
          <Map center={center} zoom={14} className="!min-h-0 h-full w-full">
            <MapTileLayer />
            <MapZoomControl />
            {subcategory === 'march' && locations?.length ? (
              <>
                <MapPolyline
                  positions={locations}
                  pathOptions={{ color: '#16a34a', weight: 4 }}
                />
                <MapMarker position={locations[0]} />
                <MapMarker position={locations[locations.length - 1]} />
              </>
            ) : location ? (
              <MapMarker position={location} />
            ) : null}
          </Map>
        </div>
      </CardContent>
    </Card>
  )
}
