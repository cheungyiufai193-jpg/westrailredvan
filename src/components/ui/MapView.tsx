import { useEffect, useRef } from 'react'
import L from 'leaflet'
import type { Route } from '../../types'

// 修复 Leaflet 默认图标
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

interface MapViewProps {
  routes?: Route[]
  center?: [number, number]
  zoom?: number
  markerPosition?: [number, number]
  markerLabel?: string
  onMapClick?: (lat: number, lng: number) => void
  className?: string
}

// 香港中心坐标
const HK_CENTER: [number, number] = [22.37, 114.12]

export function MapView({ routes, center = HK_CENTER, zoom = 11, markerPosition, markerLabel, onMapClick, className }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)
  const markersRef = useRef<L.Marker[]>([])

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return

    const map = L.map(mapRef.current, {
      center,
      zoom,
      zoomControl: false,
      attributionControl: false,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map)

    if (onMapClick) {
      map.on('click', (e: L.LeafletMouseEvent) => {
        onMapClick(e.latlng.lat, e.latlng.lng)
      })
    }

    mapInstance.current = map

    return () => {
      map.remove()
      mapInstance.current = null
    }
  }, [])

  // 显示路线标记
  useEffect(() => {
    const map = mapInstance.current
    if (!map || !routes) return

    // 清除旧标记
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    routes.forEach((route) => {
      if (route.status === 'completed' || route.status === 'cancelled') return
      
      const pickupMarker = L.marker([route.pickup_lat, route.pickup_lng], {
        icon: L.divIcon({
          className: '',
          html: `<div style="width:20px;height:20px;background:#43A047;border-radius:50%;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3);"></div>`,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        }),
      }).addTo(map)
      pickupMarker.bindPopup(`<b>${route.pickup_name}</b><br>→ ${route.dropoff_name}`)
      markersRef.current.push(pickupMarker)
    })
  }, [routes])

  // 显示单个标记
  useEffect(() => {
    const map = mapInstance.current
    if (!map || !markerPosition) return

    const marker = L.marker(markerPosition, {
      icon: L.divIcon({
        className: '',
        html: `<div style="width:24px;height:24px;background:#E53935;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"><div style="width:8px;height:8px;background:white;border-radius:50%;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);"></div></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 24],
      }),
    }).addTo(map)
    
    if (markerLabel) marker.bindPopup(markerLabel)
    map.setView(markerPosition, 14)

    markersRef.current.push(marker)
    return () => { marker.remove() }
  }, [markerPosition?.join(',')])

  return <div ref={mapRef} className={`w-full h-full ${className || ''}`} />
}