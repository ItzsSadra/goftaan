// Web audio recorder hook
import { useCallback, useEffect, useRef, useState } from 'react';

type WebRecorderStatus = 
  | 'idle'
  | 'requestingPermission'
  | 'permissionDenied'
  | 'recording'
  | 'paused'
  | 'stopping'
  | 'completed'
  | 'error';

interface UseWebAudioRecorderResult {
  status: WebRecorderStatus;
  durationMs: number;
  errorMessage: string | null;
  start: () => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  stop: () => Promise<Blob | null>;
  reset: () => void;
}

export const useWebAudioRecorder = (): UseWebAudioRecorderResult => {
  const [status, setStatus] = useState<WebRecorderStatus>('idle');
  const [durationMs, setDurationMs] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedDurationRef = useRef<number>(0);

  const clearDurationInterval = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
  }, []);

  const startDurationTracking = useCallback(() => {
    clearDurationInterval();
    startTimeRef.current = Date.now() - durationMs;
    durationIntervalRef.current = setInterval(() => {
      const currentDuration = Date.now() - startTimeRef.current;
      setDurationMs(currentDuration);
    }, 100);
  }, [clearDurationInterval, durationMs]);

  const stopDurationTracking = useCallback(() => {
    clearDurationInterval();
  }, [clearDurationInterval]);

  const cleanupStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  const start = useCallback(async () => {
    try {
      setStatus('requestingPermission');
      setErrorMessage(null);
      chunksRef.current = [];
      
      // Request microphone permission
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          } 
        });
        streamRef.current = stream;
      } catch (error) {
        setStatus('permissionDenied');
        throw new Error('دسترسی به میکروفون رد شد.');
      }

      // Create MediaRecorder with best available format
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const recorder = new MediaRecorder(streamRef.current, {
        mimeType,
        audioBitsPerSecond: 128000, // High quality
      });

      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onerror = () => {
        setStatus('error');
        setErrorMessage('خطا در ضبط صدا.');
        cleanupStream();
      };

      // Start recording
      recorder.start(1000); // Get data every second
      startDurationTracking();
      setStatus('recording');
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'ضبط صدا ناموفق بود. دوباره تلاش کنید.');
      cleanupStream();
      throw error;
    }
  }, [cleanupStream, startDurationTracking]);

  const pause = useCallback(async () => {
    if (!mediaRecorderRef.current || status !== 'recording') {
      return;
    }

    try {
      mediaRecorderRef.current.pause();
      stopDurationTracking();
      pausedDurationRef.current = durationMs;
      setStatus('paused');
    } catch (error) {
      setStatus('error');
      setErrorMessage('توقف ضبط ناموفق بود.');
      throw error;
    }
  }, [status, durationMs, stopDurationTracking]);

  const resume = useCallback(async () => {
    if (!mediaRecorderRef.current || status !== 'paused') {
      return;
    }

    try {
      mediaRecorderRef.current.resume();
      startDurationTracking();
      setStatus('recording');
    } catch (error) {
      setStatus('error');
      setErrorMessage('ادامه ضبط ناموفق بود.');
      throw error;
    }
  }, [status, startDurationTracking]);

  const stop = useCallback(async (): Promise<Blob | null> => {
    if (!mediaRecorderRef.current || (status !== 'recording' && status !== 'paused')) {
      return null;
    }

    return new Promise((resolve) => {
      setStatus('stopping');

      mediaRecorderRef.current!.onstop = () => {
        stopDurationTracking();
        
        const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: mimeType });
        
        cleanupStream();
        setStatus('completed');
        setDurationMs(0);
        resolve(blob);
      };

      mediaRecorderRef.current!.stop();
    });
  }, [status, cleanupStream, stopDurationTracking]);

  const reset = useCallback(() => {
    cleanupStream();
    stopDurationTracking();
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    setStatus('idle');
    setDurationMs(0);
    setErrorMessage(null);
    startTimeRef.current = 0;
    pausedDurationRef.current = 0;
  }, [cleanupStream, stopDurationTracking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupStream();
      stopDurationTracking();
    };
  }, [cleanupStream, stopDurationTracking]);

  return {
    status,
    durationMs,
    errorMessage,
    start,
    pause,
    resume,
    stop,
    reset,
  };
};