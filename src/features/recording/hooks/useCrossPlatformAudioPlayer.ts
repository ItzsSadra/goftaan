// Cross-platform audio player hook
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { 
  useAudioPlayer as useExpoAudioPlayer, 
  useAudioPlayerStatus as useExpoAudioPlayerStatus,
  AudioPlayer 
} from 'expo-audio';
import { audioRecordingService } from '../services/audioRecordingService';

export interface AudioPlayerState {
  isLoaded: boolean;
  isPlaying: boolean;
  currentTime: number; // in seconds
  duration: number; // in seconds
  error: string | null;
}

export interface AudioPlayerControls {
  play: () => Promise<void>;
  pause: () => void;
  seekTo: (positionSeconds: number) => Promise<void>;
  setPlaybackRate: (rate: number) => void;
}

export type CrossPlatformAudioPlayer = AudioPlayerState & AudioPlayerControls;

// Web implementation
const useWebAudioPlayer = (uri: string | null): CrossPlatformAudioPlayer => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [playableUrl, setPlayableUrl] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!uri) {
      setIsLoaded(false);
      setPlayableUrl(null);
      return;
    }

    let isMounted = true;

    // Get playable URL
    audioRecordingService.getPlayableUrl(uri)
      .then(url => {
        if (!isMounted) return;
        setPlayableUrl(url);
        setError(null);
      })
      .catch(err => {
        if (!isMounted) return;
        setError('Failed to load audio');
        console.error('Failed to get playable URL:', err);
      });

    return () => {
      isMounted = false;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      if (playableUrl) {
        audioRecordingService.revokeBlobUrl(playableUrl);
      }
    };
  }, [uri]);

  useEffect(() => {
    if (!playableUrl) return;

    const audio = new Audio(playableUrl);
    audioRef.current = audio;

    const handleLoadedMetadata = () => {
      setIsLoaded(true);
      setDuration(audio.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    
    const handleError = (e: ErrorEvent) => {
      setError('Audio playback error');
      setIsLoaded(false);
      console.error('Audio error:', e);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('error', handleError);

    // Start loading
    audio.load();

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('error', handleError);
      audio.pause();
      audio.src = '';
    };
  }, [playableUrl]);

  const play = async () => {
    if (!audioRef.current || !isLoaded) {
      setError('Audio not ready');
      return;
    }
    
    try {
      await audioRef.current.play();
    } catch (err) {
      setError('Failed to play audio');
      console.error('Play error:', err);
    }
  };

  const pause = () => {
    audioRef.current?.pause();
  };

  const seekTo = async (positionSeconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = positionSeconds;
    }
  };

  const setPlaybackRate = (rate: number) => {
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  return {
    isLoaded,
    isPlaying,
    currentTime,
    duration,
    error,
    play,
    pause,
    seekTo,
    setPlaybackRate,
  };
};

// Main hook that switches between implementations
export const useCrossPlatformAudioPlayer = (
  uri: string | null,
  options?: { updateInterval?: number }
): CrossPlatformAudioPlayer | AudioPlayer => {
  const isWeb = Platform.OS === 'web';
  
  // Web implementation
  const webPlayer = useWebAudioPlayer(uri);
  
  // Native implementation using expo-audio
  const nativePlayer = useExpoAudioPlayer(uri ?? undefined, options);
  
  // On web, return our custom player
  // On native, return the expo-audio player directly
  return isWeb ? webPlayer : nativePlayer;
};

// Helper hook to get status from either player type
export const useCrossPlatformAudioPlayerStatus = (
  player: CrossPlatformAudioPlayer | AudioPlayer | null
) => {
  const isWeb = Platform.OS === 'web';
  
  // For web, the player already has the status properties
  if (isWeb) {
    const webPlayer = player as CrossPlatformAudioPlayer;
    return {
      isLoaded: webPlayer?.isLoaded ?? false,
      playing: webPlayer?.isPlaying ?? false,
      currentTime: webPlayer?.currentTime ?? 0,
      duration: webPlayer?.duration ?? 0,
      error: webPlayer?.error ?? null,
    };
  }
  
  // For native, use the expo-audio status hook
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const nativeStatus = useExpoAudioPlayerStatus(player as AudioPlayer);
  
  return {
    isLoaded: nativeStatus.isLoaded,
    playing: nativeStatus.playing,
    currentTime: nativeStatus.currentTime ?? 0,
    duration: nativeStatus.duration ?? 0,
    error: null, // expo-audio doesn't provide error in status
  };
};