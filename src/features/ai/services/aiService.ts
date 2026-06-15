import { Platform } from 'react-native';
import { audioRecordingService } from '../../recording/services/audioRecordingService';
import type { MeetingSummary } from '../../meetings/models/meetingSummary';
import { API_BASE_URL } from '../../../utils/api';

const getErrorMessage = (payload: unknown, fallback: string): string => {
  if (payload && typeof payload === 'object' && 'message' in payload && typeof (payload as Record<string, unknown>).message === 'string') {
    return (payload as Record<string, string>).message;
  }
  return fallback;
};

export const aiService = {
  async processRecording(audioUri: string, meetingId: string): Promise<MeetingSummary> {
    const formData = new FormData();

    if (Platform.OS === 'web') {
      const blob = await audioRecordingService.getWebRecordingBlob(audioUri);
      if (!blob) {
        throw new Error('فایل صوتی پیدا نشد.');
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

    const response = await fetch(`${API_BASE_URL}/api/process-recording`, {
      method: 'POST',
      body: formData,
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
  },
};
