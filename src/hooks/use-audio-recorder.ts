"use client"

import { useState, useCallback, useRef, useEffect } from "react"

type RecordingStatus =
  | "idle"
  | "requestingPermission"
  | "recording"
  | "paused"
  | "stopping"
  | "completed"
  | "error"

interface UseAudioRecorderReturn {
  status: RecordingStatus
  audioBlob: Blob | null
  audioUrl: string | null
  duration: number
  startRecording: () => Promise<void>
  pauseRecording: () => void
  resumeRecording: () => void
  stopRecording: () => void
  resetRecording: () => void
  error: string | null
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [status, setStatus] = useState<RecordingStatus>("idle")
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const elapsedRef = useRef<number>(0)
  const pauseStartRef = useRef<number>(0)
  const recordingStartRef = useRef<number>(0)

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }, [])

  useEffect(() => {
    return cleanup
  }, [cleanup])

  const startRecording = useCallback(async () => {
    try {
      setStatus("requestingPermission")
      setError(null)

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      })

      streamRef.current = stream
      chunksRef.current = []

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      })

      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" })
        setAudioBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))
        setStatus("completed")
        cleanup()
      }

      mediaRecorder.start(1000)
      elapsedRef.current = 0
      recordingStartRef.current = Date.now()

      timerRef.current = setInterval(() => {
        setDuration(Date.now() - recordingStartRef.current + elapsedRef.current)
      }, 100)

      setStatus("recording")
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to start recording"
      )
      setStatus("error")
    }
  }, [cleanup])

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.pause()
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      elapsedRef.current += Date.now() - recordingStartRef.current
      pauseStartRef.current = Date.now()
      setStatus("paused")
    }
  }, [])

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "paused") {
      mediaRecorderRef.current.resume()
      recordingStartRef.current = Date.now()

      timerRef.current = setInterval(() => {
        setDuration(Date.now() - recordingStartRef.current + elapsedRef.current)
      }, 100)

      setStatus("recording")
    }
  }, [])

  const stopRecording = useCallback(() => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      setStatus("stopping")
      mediaRecorderRef.current.stop()
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [])

  const resetRecording = useCallback(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
    }
    setAudioBlob(null)
    setAudioUrl(null)
    setDuration(0)
    setError(null)
    setStatus("idle")
    chunksRef.current = []
  }, [audioUrl])

  return {
    status,
    audioBlob,
    audioUrl,
    duration,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    resetRecording,
    error,
  }
}
