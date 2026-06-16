import { Platform } from 'react-native';
import { audioRecordingService } from '../../recording/services/audioRecordingService';
import type { MeetingSummary } from '../../meetings/models/meetingSummary';
import { API_BASE_URL } from '../../../utils/api';

const getErrorMessage = (payload: unknown, fallback: string): string => {
  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    if (typeof obj.error === 'string') return obj.error;
    if (typeof obj.message === 'string') return obj.message;
  }
  return fallback;
};

export const aiService = {
  async processRecording(audioUri: string, meetingId: string): Promise<MeetingSummary> {
    const formData = new FormData();

    if (Platform.OS === 'web') {
      let blob: Blob | null = null;
      try {
        blob = await audioRecordingService.getWebRecordingBlob(audioUri);
      } catch {
        throw new Error('خطا در بازیابی فایل صوتی. لطفا دوباره ضبط کنید.');
      }
      if (!blob) {
        throw new Error('فایل صوتی پیدا نشد. لطفا دوباره ضبط کنید.');
      }
      formData.append('audio', blob, 'recording.webm');
    } else {
      formData.append('audio', {
        uri: audioUri,
        type: 'audio/m4a',
        name: 'recording.m4a',
      } as unknown as Blob);
    }

    formData.append('meetingId', meetingId);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000);

    try {
      const response = await fetch(`${API_BASE_URL}/api/process-recording`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(getErrorMessage(data, 'پردازش هوش مصنوعی انجام نشد.'));
      }

      return {
        id: data.id,
        meetingId: data.meetingId,
        transcript: data.transcript || '',
        summary: data.summary || '',
        keyPoints: data.keyPoints || [],
        actionItems: data.actionItems || [],
        createdAt: data.createdAt,
      };
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new Error('درخواست پردازش بیش از حد طول کشید. لطفا دوباره تلاش کنید.');
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  },
};
