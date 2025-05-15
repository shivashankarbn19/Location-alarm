"use client"

import { useEffect, useRef } from "react"

export default function AlarmSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    // Create audio element
    const audio = new Audio()
    audio.src = "/alarm.mp3" // This would be your alarm sound
    audio.loop = true
    audioRef.current = audio

    // Play the sound
    const playSound = async () => {
      try {
        await audio.play()
      } catch (error) {
        console.error("Failed to play alarm sound:", error)
      }
    }

    playSound()

    // Clean up
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }
    }
  }, [])

  const stopSound = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
  }

  return (
    <button
      onClick={stopSound}
      className="ml-auto p-2 bg-red-200 dark:bg-red-800 rounded-full"
      aria-label="Stop alarm sound"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-red-600 dark:text-red-300"
      >
        <path d="M18.36 6.64a9 9 0 0 1 .28 12.72m-2.5-2.5a5 5 0 0 0-7.08-7.08m-2.5-2.5A9 9 0 0 1 18.36 6.64"></path>
        <line x1="2" y1="2" x2="22" y2="22"></line>
      </svg>
    </button>
  )
}
