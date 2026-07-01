import { useCallback, useEffect, useRef, useState } from 'react';

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  error: unknown;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionError extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionError) => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

type SpeechStatus = 'idle' | 'listening' | 'error' | 'done';

export interface UseWebSpeechRecognitionResult {
  status: SpeechStatus;
  transcript: string;
  interimTranscript: string;
  errorMessage: string | null;
  isSupported: boolean;
  start: () => Promise<void>;
  stop: () => Promise<string>;
  reset: () => void;
}

export const useWebSpeechRecognition = (
  language = 'fa-IR',
): UseWebSpeechRecognitionResult => {
  const [status, setStatus] = useState<SpeechStatus>('idle');
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef('');
  const shouldRestartRef = useRef(false);

  const isSupported =
    typeof window !== 'undefined' &&
    !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  const cleanup = useCallback(() => {
    shouldRestartRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.abort();
      } catch {
        // ignore cleanup errors
      }
      recognitionRef.current = null;
    }
  }, []);

  const start = useCallback(async () => {
    if (!isSupported) {
      setErrorMessage('مرورگر شما از تشخیص گفتار پشتیبانی نمی‌کند.');
      setStatus('error');
      return;
    }

    cleanup();
    finalTranscriptRef.current = '';
    setTranscript('');
    setInterimTranscript('');
    setErrorMessage(null);

    const SpeechRecognitionClass =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setErrorMessage('مرورگر شما از تشخیص گفتار پشتیبانی نمی‌کند.');
      setStatus('error');
      return;
    }

    const recognition = new SpeechRecognitionClass();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let final = '';

      for (let i = event.results.length - 1; i >= 0; i--) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript + ' ';
        } else {
          interim = result[0].transcript;
        }
      }

      if (final) {
        finalTranscriptRef.current += final;
        setTranscript(finalTranscriptRef.current.trim());
      }
      setInterimTranscript(interim.trim());
    };

    recognition.onerror = (event: SpeechRecognitionError) => {
      if (event.error === 'no-speech') {
        return;
      }
      if (event.error === 'aborted') {
        return;
      }
      setErrorMessage(`خطا در تشخیص گفتار: ${event.error}`);
      setStatus('error');
    };

    recognition.onend = () => {
      if (shouldRestartRef.current) {
        recognition.start();
      }
    };

    recognitionRef.current = recognition;
    shouldRestartRef.current = true;
    recognition.start();
    setStatus('listening');
  }, [isSupported, language, cleanup]);

  const stop = useCallback(async (): Promise<string> => {
    return new Promise((resolve) => {
      shouldRestartRef.current = false;
      if (recognitionRef.current) {
        recognitionRef.current.onend = () => {
          const finalText = finalTranscriptRef.current.trim();
          setTranscript(finalText);
          setInterimTranscript('');
          setStatus('done');
          recognitionRef.current = null;
          resolve(finalText);
        };
        recognitionRef.current.stop();
      } else {
        const finalText = finalTranscriptRef.current.trim();
        setTranscript(finalText);
        setStatus('done');
        resolve(finalText);
      }
    });
  }, []);

  const reset = useCallback(() => {
    cleanup();
    finalTranscriptRef.current = '';
    setTranscript('');
    setInterimTranscript('');
    setErrorMessage(null);
    setStatus('idle');
  }, [cleanup]);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    status,
    transcript,
    interimTranscript,
    errorMessage,
    isSupported,
    start,
    stop,
    reset,
  };
};
