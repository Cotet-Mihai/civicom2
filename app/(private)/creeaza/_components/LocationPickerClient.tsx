'use client'

import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import { renderToString } from 'react-dom/server'
import { MapPinIcon } from 'lucide-react'
import {
    Map,
    MapDrawControl,
    MapDrawDelete,
    MapDrawEdit,
    MapDrawMarker,
    MapLocateControl,
    MapTileLayer,
    MapFullscreenControl,
    useLeaflet,
} from '@/components/ui/map'
import { MapSearchControlWrapper } from '@/utils/mapHelpers'
import { extractMarkers, removeDuplicateMarkers } from '@/utils/mapHelpers'
import type L from 'leaflet'

const BUCHAREST: [number, number] = [44.4358196, 26.1021932]

function InvalidateOnVisible() {
    const map = useMap()
    useEffect(() => {
        const container = map.getContainer()
        const observer = new ResizeObserver((entries) => {
            const rect = entries[0]?.contentRect
            if (rect && rect.width > 0 && rect.height > 0) {
                map.invalidateSize()
            }
        })
        observer.observe(container)
        return () => observer.disconnect()
    }, [map])
    return null
}

function RestoreMarker({ location }: { location: [number, number] | null }) {
    const map = useMap()
    const { L } = useLeaflet()
    useEffect(() => {
        if (!location || !L) return
        const leaflet = L
        const id = requestAnimationFrame(() => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let fg: any = null
            map.eachLayer(layer => { if (!fg && layer instanceof leaflet.FeatureGroup) fg = layer })
            if (!fg || fg.getLayers().length > 0) return
            // Same divIcon as MapDrawMarker to avoid broken default Leaflet icon in Next.js
            const icon = leaflet.divIcon({
                className: '',
                iconAnchor: [12, 12],
                html: renderToString(<MapPinIcon className="size-6" />),
            })
            // Fire draw:created so MapDrawControl updates layersCount (enables Edit/Delete)
            map.fire('draw:created', { layer: leaflet.marker(location, { icon }), layerType: 'marker' })
        })
        return () => cancelAnimationFrame(id)
    }, [L])
    return null
}

type Props = {
    location: [number, number] | null
    onChange: (loc: [number, number]) => void
}

export function LocationPickerClient({ location, onChange }: Props) {
    function handleOnChange(layers: L.FeatureGroup) {
        removeDuplicateMarkers(layers)
        const markers = extractMarkers(layers)
        if (markers[0]) {
            const latlng = markers[0].getLatLng()
            onChange([latlng.lat, latlng.lng])
        }
    }

    return (
        <Map center={location ?? BUCHAREST} zoom={13}>
            <InvalidateOnVisible />
            <MapTileLayer />
            <MapSearchControlWrapper />
            <MapLocateControl />
            <MapFullscreenControl />
            <MapDrawControl onLayersChange={handleOnChange}>
                <MapDrawMarker />
                <MapDrawEdit />
                <MapDrawDelete />
            </MapDrawControl>
            <RestoreMarker location={location} />
        </Map>
    )
}
