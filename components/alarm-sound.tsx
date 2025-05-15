"use client"

import { useEffect, useRef, useState } from "react"
import { Volume2, VolumeX } from "lucide-react"

export default function AlarmSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(true)

  useEffect(() => {
    // Create audio context to better handle mobile devices
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()

    // Create audio element
    const audio = new Audio()
    audio.src = "https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3" // Using a direct URL instead of local file
    audio.loop = true
    audioRef.current = audio

    // Play the sound with user interaction handling
    const playSound = async () => {
      try {
        // Resume audio context for iOS
        if (audioContext.state === "suspended") {
          await audioContext.resume()
        }

        const playPromise = audio.play()

        // Handle the play promise to avoid uncaught promise errors
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true)
            })
            .catch((error) => {
              console.error("Failed to play alarm sound:", error)
              setIsPlaying(false)
            })
        }
      } catch (error) {
        console.error("Failed to play alarm sound:", error)
        setIsPlaying(false)
      }
    }

    // Try to play, but this might fail due to autoplay policies
    playSound()

    // Add a click event listener to the document to enable sound on first user interaction
    const enableAudio = () => {
      if (audioRef.current && !isPlaying) {
        playSound()
      }
      document.removeEventListener("click", enableAudio)
    }

    document.addEventListener("click", enableAudio)

    // Clean up
    return () => {
      document.removeEventListener("click", enableAudio)
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }
    }
  }, [])

  const toggleSound = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play().catch((error) => {
        console.error("Failed to play alarm sound:", error)
      })
      setIsPlaying(true)
    }
  }

  return (
    <button
      onClick={toggleSound}
      className="ml-auto p-2 bg-red-200 dark:bg-red-800 rounded-full"
      aria-label={isPlaying ? "Mute alarm sound" : "Play alarm sound"}
    >
      {isPlaying ? (
        <Volume2 className="h-4 w-4 text-red-600 dark:text-red-300" />
      ) : (
        <VolumeX className="h-4 w-4 text-red-600 dark:text-red-300" />
      )}
    </button>
  )
}
