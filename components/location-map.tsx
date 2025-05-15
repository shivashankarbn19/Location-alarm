"use client"

import { useEffect, useRef } from "react"

interface Location {
  latitude: number
  longitude: number
  name?: string
}

interface LocationMapProps {
  currentLocation: Location
  targetLocation: Location
  radius: number
}

export default function LocationMap({ currentLocation, targetLocation, radius }: LocationMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mapRef.current) return

    try {
      const canvas = document.createElement("canvas")
      canvas.width = mapRef.current.clientWidth
      canvas.height = mapRef.current.clientHeight
      mapRef.current.innerHTML = ""
      mapRef.current.appendChild(canvas)

      const ctx = canvas.getContext("2d")
      if (!ctx) {
        console.error("Could not get canvas context")
        return
      }

      // Calculate the center and scale
      const centerLat = (currentLocation.latitude + targetLocation.latitude) / 2
      const centerLng = (currentLocation.longitude + targetLocation.longitude) / 2

      // Calculate distance between points to determine scale
      const latDiff = Math.abs(currentLocation.latitude - targetLocation.latitude)
      const lngDiff = Math.abs(currentLocation.longitude - targetLocation.longitude)

      // Ensure we have a minimum difference to avoid division by zero
      const maxDiff = Math.max(latDiff, lngDiff, 0.0001) * 1.5 // Add some padding

      // Scale factor (pixels per degree)
      const scale = Math.min(canvas.width, canvas.height) / maxDiff

      // Convert lat/lng to pixel coordinates
      const latToY = (lat: number) => canvas.height / 2 - (lat - centerLat) * scale
      const lngToX = (lng: number) => canvas.width / 2 + (lng - centerLng) * scale

      // Draw background
      ctx.fillStyle = "#f3f4f6"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw grid lines
      ctx.strokeStyle = "#e5e7eb"
      ctx.lineWidth = 1

      for (let i = 0; i < canvas.width; i += 20) {
        ctx.beginPath()
        ctx.moveTo(i, 0)
        ctx.lineTo(i, canvas.height)
        ctx.stroke()
      }

      for (let i = 0; i < canvas.height; i += 20) {
        ctx.beginPath()
        ctx.moveTo(0, i)
        ctx.lineTo(canvas.width, i)
        ctx.stroke()
      }

      // Draw target location radius
      const targetX = lngToX(targetLocation.longitude)
      const targetY = latToY(targetLocation.latitude)

      // Convert radius in meters to pixels
      // Approximate conversion: 1 degree of latitude ≈ 111,000 meters
      const radiusInDegrees = radius / 111000
      const radiusInPixels = radiusInDegrees * scale

      // Draw radius circle
      ctx.beginPath()
      ctx.arc(targetX, targetY, radiusInPixels, 0, Math.PI * 2)
      ctx.fillStyle = "rgba(59, 130, 246, 0.2)"
      ctx.fill()
      ctx.strokeStyle = "rgba(59, 130, 246, 0.5)"
      ctx.lineWidth = 2
      ctx.stroke()

      // Draw target location
      ctx.beginPath()
      ctx.arc(targetX, targetY, 8, 0, Math.PI * 2)
      ctx.fillStyle = "#3b82f6"
      ctx.fill()
      ctx.strokeStyle = "#ffffff"
      ctx.lineWidth = 2
      ctx.stroke()

      // Draw target label
      ctx.font = "12px sans-serif"
      ctx.fillStyle = "#1f2937"
      ctx.textAlign = "center"
      ctx.fillText(targetLocation.name || "Target", targetX, targetY - 15)

      // Draw current location
      const currentX = lngToX(currentLocation.longitude)
      const currentY = latToY(currentLocation.latitude)

      ctx.beginPath()
      ctx.arc(currentX, currentY, 8, 0, Math.PI * 2)
      ctx.fillStyle = "#ef4444"
      ctx.fill()
      ctx.strokeStyle = "#ffffff"
      ctx.lineWidth = 2
      ctx.stroke()

      // Draw current location label
      ctx.font = "12px sans-serif"
      ctx.fillStyle = "#1f2937"
      ctx.textAlign = "center"
      ctx.fillText("You", currentX, currentY - 15)

      // Draw line between points
      ctx.beginPath()
      ctx.moveTo(currentX, currentY)
      ctx.lineTo(targetX, targetY)
      ctx.strokeStyle = "#9ca3af"
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      ctx.stroke()
      ctx.setLineDash([])
    } catch (error) {
      console.error("Error rendering map:", error)

      // Fallback display if canvas fails
      if (mapRef.current) {
        mapRef.current.innerHTML = `
        <div class="w-full h-full flex items-center justify-center bg-gray-100 text-gray-500">
          <p>Map rendering failed. Your location is being tracked.</p>
        </div>
      `
      }
    }
  }, [currentLocation, targetLocation, radius])

  return <div ref={mapRef} className="w-full h-full" />
}
