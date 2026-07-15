"use client"

import { useState, useCallback, useRef, useEffect } from "react"

interface UseAudioPlayerReturn {
  isPlaying: boolean
  currentTime: number
  duration: number
  play: () => void
  pause: () => void
  replay: () => void
  seek: (time: number) => void
}

export function useAudioPlayer(audioUrl: string | null): UseAudioPlayerReturn {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (!audioUrl) return

    const audio = new Audio(audioUrl)
    audioRef.current = audio

    audio.addEventListener("loadedmetadata", () => {
      setDuration(audio.duration * 1000)
    })

    audio.addEventListener("timeupdate", () => {
      setCurrentTime(audio.currentTime * 1000)
    })

    audio.addEventListener("ended", () => {
      setIsPlaying(false)
      setCurrentTime(0)
    })

    return () => {
      audio.pause()
      audio.src = ""
      audioRef.current = null
    }
  }, [audioUrl])

  const play = useCallback(() => {
    audioRef.current?.play()
    setIsPlaying(true)
  }, [])

  const pause = useCallback(() => {
    audioRef.current?.pause()
    setIsPlaying(false)
  }, [])

  const replay = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play()
      setIsPlaying(true)
    }
  }, [])

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time / 1000
      setCurrentTime(time)
    }
  }, [])

  return {
    isPlaying,
    currentTime,
    duration,
    play,
    pause,
    replay,
    seek,
  }
}
