"use client"

import { useState, useEffect } from "react"
import { MapPin, Bell, AlertCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import LocationMap from "@/components/location-map"
import AlarmSound from "@/components/alarm-sound"

interface Location {
  name: string
  latitude: number
  longitude: number
}

export default function LocationAlarm() {
  const [locationName, setLocationName] = useState("")
  const [targetLocation, setTargetLocation] = useState<Location | null>(null)
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [radius, setRadius] = useState(100) // Default radius in meters
  const [isAlarmActive, setIsAlarmActive] = useState(false)
  const [isAlarmTriggered, setIsAlarmTriggered] = useState(false)
  const [isWatchingLocation, setIsWatchingLocation] = useState(false)
  const [watchId, setWatchId] = useState<number | null>(null)
  const [isMapVisible, setIsMapVisible] = useState(false)
  const { toast } = useToast()

  // Function to get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({
        variant: "destructive",
        title: "Geolocation not supported",
        description: "Your browser doesn't support geolocation.",
      })
      return
    }

    // Show loading toast
    toast({
      title: "Detecting location",
      description: "Please wait while we detect your location...",
    })

    // Set options for better accuracy
    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
        toast({
          title: "Location detected",
          description: "Your current location has been detected.",
        })
      },
      (error) => {
        let errorMessage = "Failed to get location"

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location permission denied. Please enable location services in your browser settings."
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable. Please try again."
            break
          case error.TIMEOUT:
            errorMessage = "Location request timed out. Please try again."
            break
        }

        toast({
          variant: "destructive",
          title: "Location error",
          description: errorMessage,
        })
      },
      options,
    )
  }

  // Function to set target location
  const setAlarmLocation = () => {
    if (!currentLocation) {
      toast({
        variant: "destructive",
        title: "No location",
        description: "Please detect your current location first.",
      })
      return
    }

    if (!locationName.trim()) {
      toast({
        variant: "destructive",
        title: "No name",
        description: "Please enter a name for this location.",
      })
      return
    }

    setTargetLocation({
      name: locationName,
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
    })

    toast({
      title: "Location saved",
      description: `"${locationName}" has been set as your target location.`,
    })
  }

  // Function to start the alarm
  const startAlarm = () => {
    if (!targetLocation) {
      toast({
        variant: "destructive",
        title: "No target location",
        description: "Please set a target location first.",
      })
      return
    }

    setIsAlarmActive(true)
    startWatchingLocation()

    toast({
      title: "Alarm activated",
      description: `You'll be notified when you're within ${radius}m of "${targetLocation.name}".`,
    })
  }

  // Function to stop the alarm
  const stopAlarm = () => {
    setIsAlarmActive(false)
    setIsAlarmTriggered(false)
    stopWatchingLocation()

    toast({
      title: "Alarm deactivated",
      description: "Location alarm has been turned off.",
    })
  }

  // Function to start watching location
  const startWatchingLocation = () => {
    if (!navigator.geolocation) {
      toast({
        variant: "destructive",
        title: "Geolocation not supported",
        description: "Your browser doesn't support geolocation.",
      })
      return
    }

    if (isWatchingLocation) return

    // Options for better accuracy
    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    }

    try {
      const id = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }
          setCurrentLocation(newLocation)
          checkProximity(newLocation)
        },
        (error) => {
          let errorMessage = "Failed to track location"

          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Location permission denied. Please enable location services."
              break
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information is unavailable."
              break
            case error.TIMEOUT:
              errorMessage = "Location request timed out."
              break
          }

          toast({
            variant: "destructive",
            title: "Location tracking error",
            description: errorMessage,
          })
          stopWatchingLocation()
        },
        options,
      )

      setWatchId(id)
      setIsWatchingLocation(true)
    } catch (error) {
      console.error("Error starting location watch:", error)
      toast({
        variant: "destructive",
        title: "Location tracking error",
        description: "Failed to start location tracking.",
      })
    }
  }

  // Function to stop watching location
  const stopWatchingLocation = () => {
    if (watchId !== null && isWatchingLocation) {
      navigator.geolocation.clearWatch(watchId)
      setWatchId(null)
      setIsWatchingLocation(false)
    }
  }

  // Function to calculate distance between two coordinates in meters
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3 // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180
    const φ2 = (lat2 * Math.PI) / 180
    const Δφ = ((lat2 - lat1) * Math.PI) / 180
    const Δλ = ((lon2 - lon1) * Math.PI) / 180

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distance = R * c

    return distance // Distance in meters
  }

  // Function to check if user is within the target radius
  const checkProximity = (location: { latitude: number; longitude: number }) => {
    if (!targetLocation || !isAlarmActive) return

    const distance = calculateDistance(
      location.latitude,
      location.longitude,
      targetLocation.latitude,
      targetLocation.longitude,
    )

    if (distance <= radius && !isAlarmTriggered) {
      setIsAlarmTriggered(true)

      // Show notification if supported
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Location Alarm", {
          body: `You've reached "${targetLocation.name}"!`,
          icon: "/notification-icon.png",
        })
      }

      toast({
        title: "Destination reached!",
        description: `You've arrived at "${targetLocation.name}"!`,
        duration: 10000,
      })
    } else if (distance > radius && isAlarmTriggered) {
      setIsAlarmTriggered(false)
    }
  }

  // Request notification permission on component mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
      Notification.requestPermission()
    }

    // Cleanup on unmount
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId)
      }
    }
  }, [])

  // This handles the case when the app is put in the background
  useEffect(() => {
    // Handle page visibility change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden (app in background)
        if (isAlarmActive && isWatchingLocation) {
          // Store that we were watching
          localStorage.setItem("wasWatchingLocation", "true")
          // Stop watching to save battery
          stopWatchingLocation()
        }
      } else {
        // Page is visible again
        const wasWatching = localStorage.getItem("wasWatchingLocation") === "true"
        if (isAlarmActive && wasWatching && !isWatchingLocation) {
          // Resume watching
          startWatchingLocation()
          localStorage.removeItem("wasWatchingLocation")
        }
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [isAlarmActive, isWatchingLocation])

  return (
    <div className="container max-w-md mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location Alarm
          </CardTitle>
          <CardDescription>Set an alarm to trigger when you reach a specific location</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="location-name">Location Name</Label>
            <Input
              id="location-name"
              placeholder="e.g., Drop Palace"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Button variant="outline" onClick={getCurrentLocation} className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Detect Current Location
            </Button>

            <Button
              onClick={setAlarmLocation}
              disabled={!currentLocation || !locationName.trim()}
              className="flex items-center gap-2"
            >
              <MapPin className="h-4 w-4" />
              Set as Target Location
            </Button>
          </div>

          {targetLocation && (
            <div className="space-y-4 pt-2">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Target: {targetLocation.name}</h3>
                <Button variant="ghost" size="sm" onClick={() => setIsMapVisible(!isMapVisible)}>
                  {isMapVisible ? "Hide Map" : "Show Map"}
                </Button>
              </div>

              {isMapVisible && currentLocation && (
                <div className="h-[200px] w-full rounded-md overflow-hidden border">
                  <LocationMap currentLocation={currentLocation} targetLocation={targetLocation} radius={radius} />
                </div>
              )}

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="radius">Alarm Radius: {radius}m</Label>
                </div>
                <Slider
                  id="radius"
                  min={50}
                  max={1000}
                  step={50}
                  value={[radius]}
                  onValueChange={(value) => setRadius(value[0])}
                />
              </div>

              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="alarm-toggle" className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Activate Alarm
                </Label>
                <Switch
                  id="alarm-toggle"
                  checked={isAlarmActive}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      startAlarm()
                    } else {
                      stopAlarm()
                    }
                  }}
                />
              </div>
            </div>
          )}

          {isAlarmTriggered && (
            <div
              className="bg-red-100 dark:bg-red-900/30 p-4 rounded-md flex items-center gap-3 animate-pulse"
              onClick={stopAlarm}
            >
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <div>
                <p className="font-medium text-red-600 dark:text-red-400">You've reached {targetLocation?.name}!</p>
                <p className="text-sm text-red-600/80 dark:text-red-400/80">Tap to dismiss</p>
              </div>
              <AlarmSound />
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          {isAlarmActive ? (
            <Button variant="destructive" onClick={stopAlarm} className="w-full">
              Stop Alarm
            </Button>
          ) : (
            <Button onClick={startAlarm} disabled={!targetLocation} className="w-full">
              Start Alarm
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}
