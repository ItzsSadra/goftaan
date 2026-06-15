// Audio recording service - handles file operations for recordings
import { Platform } from 'react-native';

// Native imports
import {
  getRecordingPermissionsAsync,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';

const RECORDINGS_DIR = `${FileSystem.documentDirectory}recordings`;

const ensureRecordingsDir = async (): Promise<void> => {
  const info = await FileSystem.getInfoAsync(RECORDINGS_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(RECORDINGS_DIR, { intermediates: true });
  }
};

const sanitizeMeetingId = (meetingId: string): string => {
  return meetingId.replace(/[^a-zA-Z0-9-_]/g, '_');
};

const buildRecordingUri = (meetingId: string): string => {
  const timestamp = new Date().toISOString().replace(/[.:]/g, '-');
  return `${RECORDINGS_DIR}/${sanitizeMeetingId(meetingId)}-${timestamp}.m4a`;
};

// Web-specific implementations
const webRequestPermission = async (): Promise<boolean> => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch (error) {
    return false;
  }
};

const webPersistRecordingBlob = async (blob: Blob, meetingId: string): Promise<string> => {
  const filename = `${sanitizeMeetingId(meetingId)}-${Date.now()}.webm`;
  
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('AudioRecordingsDB', 1);
    
    request.onerror = () => reject(new Error('Failed to open database'));
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('recordings')) {
        db.createObjectStore('recordings', { keyPath: 'id' });
      }
    };
    
    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = db.transaction(['recordings'], 'readwrite');
      const store = transaction.objectStore('recordings');
      
      const recordingId = `${meetingId}-${Date.now()}`;
      const recordingData = {
        id: recordingId,
        meetingId,
        blob,
        timestamp: Date.now(),
        filename,
      };
      
      const addRequest = store.put(recordingData);
      
      addRequest.onsuccess = () => {
        // Create a blob URL for immediate playback
        const blobUrl = URL.createObjectURL(blob);
        // Store both the IndexedDB ID and the blob URL
        const uri = `indexeddb://recording/${recordingId}?blobUrl=${encodeURIComponent(blobUrl)}`;
        resolve(uri);
      };
      
      addRequest.onerror = () => reject(new Error('Failed to store recording'));
      
      transaction.oncomplete = () => db.close();
    };
  });
};

// Native implementations
const nativeRequestPermission = async (): Promise<boolean> => {
  const existing = await getRecordingPermissionsAsync();
  if (existing.granted) {
    return true;
  }

  const requested = await requestRecordingPermissionsAsync();
  return requested.granted;
};

const nativeConfigureAudioMode = async (): Promise<void> => {
  await setAudioModeAsync({
    allowsRecording: true,
    playsInSilentMode: true,
    shouldPlayInBackground: false,
  });
};

const nativeResetAudioMode = async (): Promise<void> => {
  await setAudioModeAsync({
    allowsRecording: false,
    playsInSilentMode: true,
  });
};

const nativePersistRecordingUri = async (sourceUri: string, meetingId: string): Promise<string> => {
  await ensureRecordingsDir();
  const destinationUri = buildRecordingUri(meetingId);

  await FileSystem.copyAsync({
    from: sourceUri,
    to: destinationUri,
  });

  return destinationUri;
};

// Unified service interface
export const audioRecordingService = {
  async requestPermission(): Promise<boolean> {
    if (Platform.OS === 'web') {
      return webRequestPermission();
    }
    return nativeRequestPermission();
  },

  async configureAudioMode(): Promise<void> {
    if (Platform.OS === 'web') {
      // No configuration needed for web
      return;
    }
    return nativeConfigureAudioMode();
  },

  async resetAudioMode(): Promise<void> {
    if (Platform.OS === 'web') {
      // No configuration needed for web
      return;
    }
    return nativeResetAudioMode();
  },

  async persistRecordingUri(sourceUri: string, meetingId: string): Promise<string> {
    if (Platform.OS === 'web') {
      // This shouldn't be called on web - use persistWebRecordingBlob instead
      throw new Error('Use persistWebRecordingBlob for web platform');
    }
    return nativePersistRecordingUri(sourceUri, meetingId);
  },

  async persistWebRecordingBlob(blob: Blob, meetingId: string): Promise<string> {
    if (Platform.OS !== 'web') {
      throw new Error('persistWebRecordingBlob is only available on web platform');
    }
    return webPersistRecordingBlob(blob, meetingId);
  },

  async getPlayableUrl(uri: string): Promise<string> {
    if (Platform.OS !== 'web') {
      // For native, return the file URI as is
      return uri;
    }
    
    // For web, extract blob URL or create a new one
    if (uri.startsWith('indexeddb://')) {
      // Check if we have a blobUrl in the query params
      const url = new URL(uri);
      const blobUrl = url.searchParams.get('blobUrl');
      if (blobUrl) {
        return decodeURIComponent(blobUrl);
      }
      
      // If no blobUrl, retrieve from IndexedDB and create a new blob URL
      const recordingId = url.pathname.split('/').pop() || '';
      
      return new Promise((resolve, reject) => {
        const request = indexedDB.open('AudioRecordingsDB', 1);
        
        request.onerror = () => reject(new Error('Failed to open database'));
        
        request.onsuccess = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          const transaction = db.transaction(['recordings'], 'readonly');
          const store = transaction.objectStore('recordings');
          const getRequest = store.get(recordingId);
          
          getRequest.onsuccess = () => {
            const result = getRequest.result;
            if (result?.blob) {
              const newBlobUrl = URL.createObjectURL(result.blob);
              resolve(newBlobUrl);
            } else {
              reject(new Error('Recording not found'));
            }
            db.close();
          };
          
          getRequest.onerror = () => {
            reject(new Error('Failed to retrieve recording'));
            db.close();
          };
        };
      });
    }
    
    return uri;
  },

  async getWebRecordingBlob(uri: string): Promise<Blob | null> {
    if (Platform.OS !== 'web') {
      throw new Error('getWebRecordingBlob is only available on web platform');
    }
    
    // Extract ID from uri (format: indexeddb://recording/{id})
    const match = uri.match(/indexeddb:\/\/recording\/([^?]+)/);
    const recordingId = match ? match[1] : uri.replace('indexeddb://recording/', '');
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('AudioRecordingsDB', 1);
      
      request.onerror = () => reject(new Error('Failed to open database'));
      
      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const transaction = db.transaction(['recordings'], 'readonly');
        const store = transaction.objectStore('recordings');
        const getRequest = store.get(recordingId);
        
        getRequest.onsuccess = () => {
          const result = getRequest.result;
          resolve(result?.blob || null);
          db.close();
        };
        
        getRequest.onerror = () => {
          reject(new Error('Failed to retrieve recording'));
          db.close();
        };
      };
    });
  },

  // Clean up blob URL when no longer needed
  revokeBlobUrl(blobUrl: string): void {
    if (Platform.OS === 'web' && blobUrl.startsWith('blob:')) {
      URL.revokeObjectURL(blobUrl);
    }
  },
};