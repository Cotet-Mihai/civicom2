import L, { Layer } from 'leaflet'
import { useMap } from 'react-leaflet'
import React from 'react'
import { LatLngExpression } from 'leaflet'
import { MapSearchControl } from '@/components/ui/map'

export function removeDuplicateMarkers(layers: L.FeatureGroup): void {
    const markers: L.Marker[] = extractMarkers(layers)
    if (markers.length <= 1) return
    const lastMarker: L.Marker = markers[markers.length - 1]
    markers.forEach((marker: L.Marker) => {
        if (marker !== lastMarker) layers.removeLayer(marker)
    })
}

export function extractMarkers(layers: L.FeatureGroup): L.Marker[] {
    const markers: L.Marker[] = []
    layers.getLayers().forEach((layer: Layer) => {
        if (layer instanceof L.Marker) markers.push(layer)
    })
    return markers
}

export function removeDuplicatePolylines(layers: L.FeatureGroup): void {
    const polylines: L.Polyline[] = extractPolylines(layers)
    if (polylines.length <= 1) return
    const lastPolyline: L.Polyline = polylines[polylines.length - 1]
    polylines.forEach((polyline: L.Polyline) => {
        if (polyline !== lastPolyline) layers.removeLayer(polyline)
    })
}

export function extractPolylines(layers: L.FeatureGroup): L.Polyline[] {
    const polylines: L.Polyline[] = []
    layers.getLayers().forEach((layer: Layer) => {
        if (layer instanceof L.Polyline) polylines.push(layer)
    })
    return polylines
}

export function MapSearchControlWrapper() {
    const map = useMap()
    const [selectedPosition, setSelectedPosition] = React.useState<LatLngExpression | null>(null)

    React.useEffect(() => {
        if (!selectedPosition) return
        map.panTo(selectedPosition)
    }, [selectedPosition])

    return (
        <MapSearchControl
            limit={3}
            bbox={[20.2, 43.6, 29.7, 48.3]}
            onPlaceSelect={(feature) =>
                setSelectedPosition(
                    feature.geometry.coordinates.toReversed() as LatLngExpression
                )
            }
        />
    )
}
