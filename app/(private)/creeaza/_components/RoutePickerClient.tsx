'use client'

import { useEffect, useRef, useState } from 'react'
import { useMap } from 'react-leaflet'
import {
    Map,
    MapDrawControl,
    MapDrawDelete,
    MapDrawEdit,
    MapDrawPolyline,
    MapLocateControl,
    MapTileLayer,
    MapFullscreenControl,
    useLeaflet,
} from '@/components/ui/map'
import { MapSearchControlWrapper, extractPolylines, removeDuplicatePolylines } from '@/utils/mapHelpers'
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

function RestorePolyline({ locations }: { locations: [number, number][] }) {
    const map = useMap()
    const { L } = useLeaflet()
    useEffect(() => {
        if (!locations.length || !L) return
        const leaflet = L
        const id = requestAnimationFrame(() => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let fg: any = null
            map.eachLayer(layer => { if (!fg && layer instanceof leaflet.FeatureGroup) fg = layer })
            if (!fg || fg.getLayers().length > 0) return
            // Fire draw:created so MapDrawControl updates layersCount (enables Edit/Delete)
            map.fire('draw:created', { layer: leaflet.polyline(locations), layerType: 'polyline' })
        })
        return () => cancelAnimationFrame(id)
    }, [L])
    return null
}

function labelIcon(leaflet: typeof L, text: string, color: string) {
    return leaflet.divIcon({
        className: '',
        iconSize: [0, 0],
        iconAnchor: [0, 0],
        html: `<span style="position:absolute;transform:translate(-50%,-50%);background:${color};color:#fff;border-radius:9999px;padding:2px 8px;font-size:11px;font-weight:700;white-space:nowrap;pointer-events:none">${text}</span>`,
    })
}

function RouteLabels({ locations }: { locations: [number, number][] }) {
    const map = useMap()
    const { L } = useLeaflet()
    const markersRef = useRef<L.Marker[]>([])
    const [isEditing, setIsEditing] = useState(false)

    useEffect(() => {
        const onStart = () => setIsEditing(true)
        const onStop = () => setIsEditing(false)
        map.on('draw:editstart', onStart)
        map.on('draw:editstop', onStop)
        map.on('draw:editcancel', onStop)
        map.on('draw:deletestart', onStart)
        map.on('draw:deletestop', onStop)
        map.on('draw:deletecancel', onStop)
        return () => {
            map.off('draw:editstart', onStart)
            map.off('draw:editstop', onStop)
            map.off('draw:editcancel', onStop)
            map.off('draw:deletestart', onStart)
            map.off('draw:deletestop', onStop)
            map.off('draw:deletecancel', onStop)
        }
    }, [map])

    useEffect(() => {
        markersRef.current.forEach(m => m.remove())
        markersRef.current = []
        if (!L || locations.length < 2 || isEditing) return
        const start = L.marker(locations[0], { icon: labelIcon(L, 'Start', '#16a34a'), interactive: false }).addTo(map)
        const end = L.marker(locations[locations.length - 1], { icon: labelIcon(L, 'Final', '#dc2626'), interactive: false }).addTo(map)
        markersRef.current = [start, end]
        return () => { start.remove(); end.remove(); markersRef.current = [] }
    }, [L, locations, isEditing])

    return null
}

type Props = {
    locations: [number, number][]
    onChange: (locs: [number, number][]) => void
}

export function RoutePickerClient({ locations, onChange }: Props) {
    function handleOnChange(layers: L.FeatureGroup) {
        removeDuplicatePolylines(layers)
        const polylines = extractPolylines(layers)
        if (polylines[0]) {
            const latLngs = polylines[0].getLatLngs() as L.LatLng[]
            onChange(latLngs.map(ll => [ll.lat, ll.lng]))
        } else {
            onChange([])
        }
    }

    return (
        <Map center={BUCHAREST} zoom={13}>
            <InvalidateOnVisible />
            <MapTileLayer />
            <MapSearchControlWrapper />
            <MapLocateControl />
            <MapFullscreenControl />
            <MapDrawControl onLayersChange={handleOnChange}>
                <MapDrawPolyline />
                <MapDrawEdit />
                <MapDrawDelete />
            </MapDrawControl>
            <RestorePolyline locations={locations} />
            <RouteLabels locations={locations} />
        </Map>
    )
}
