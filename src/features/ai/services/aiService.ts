import { Platform } from 'react-native';
import { audioRecordingService } from '../../recording/services/audioRecordingService';
import type { MeetingSummary } from '../../meetings/models/meetingSummary';
import { API_BASE_URL } from '../../../utils/api';

export type AiProcessingStep =
  | 'idle'
  | 'transcribing'
  | 'transcribed'
  | 'summarizing'
  | 'saving'
  | 'done'
  | 'error';

export const AI_STEP_LABELS: Record<Exclude<AiProcessingStep, 'idle' | 'error' | 'done'>, string> = {
  transcribing: 'در حال دریافت متن از صدا...',
  transcribed: 'متن دریافت شد',
  summarizing: 'در حال تولید خلاصه با هوش مصنوعی...',
  saving: 'در حال ذخیره‌سازی...',
};

const getErrorMessage = (payload: unknown, fallback: string): string => {
  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    if (typeof obj.error === 'string') return obj.error;
    if (typeof obj.message === 'string') return obj.message;
  }
  return fallback;
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const buildAudioFormData = async (audioUri: string): Promise<FormData> => {
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

  return formData;
};

const fetchWithTimeout = async (
  url: string,
  options: RequestInit,
  timeoutMs: number,
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('درخواست پردازش بیش از حد طول کشید. لطفا دوباره تلاش کنید.');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

async function transcribeStep(
  audioUri: string,
): Promise<string> {
  const audioFormData = await buildAudioFormData(audioUri);
  const transcribeRes = await fetchWithTimeout(
    `${API_BASE_URL}/api/transcribe`,
    { method: 'POST', body: audioFormData },
    180000,
  );

  const transcribeData = await transcribeRes.json();
  if (!transcribeRes.ok) {
    throw new Error(getErrorMessage(transcribeData, 'خطا در دریافت متن از صدا.'));
  }

  return transcribeData.transcript || '';
}

async function summarizeStep(
  transcript: string,
): Promise<{ summary: string; keyPoints: string[]; actionItems: string[] }> {
  const summarizeRes = await fetchWithTimeout(
    `${API_BASE_URL}/api/summarize`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript }),
    },
    180000,
  );

  const summarizeData = await summarizeRes.json();
  if (!summarizeRes.ok) {
    throw new Error(getErrorMessage(summarizeData, 'خطا در تولید خلاصه.'));
  }

  return {
    summary: summarizeData.summary || '',
    keyPoints: summarizeData.keyPoints || [],
    actionItems: summarizeData.actionItems || [],
  };
}

async function saveStep(
  meetingId: string,
  transcript: string,
  summaryResult: { summary: string; keyPoints: string[]; actionItems: string[] },
): Promise<MeetingSummary> {
  const saveRes = await fetchWithTimeout(
    `${API_BASE_URL}/summaries`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        meetingId,
        transcript,
        ...summaryResult,
      }),
    },
    30000,
  );

  const saveData = await saveRes.json();
  if (!saveRes.ok) {
    throw new Error(getErrorMessage(saveData, 'خطا در ذخیره‌سازی خلاصه.'));
  }

  return {
    id: saveData.id,
    meetingId: saveData.meetingId,
    transcript,
    summary: summaryResult.summary,
    keyPoints: summaryResult.keyPoints,
    actionItems: summaryResult.actionItems,
    createdAt: saveData.createdAt,
  };
}

export const aiService = {
  async processRecording(
    audioUri: string,
    meetingId: string,
    onStep?: (step: AiProcessingStep) => void,
  ): Promise<MeetingSummary> {
    const step = onStep || ((_: AiProcessingStep) => {});

    try {
      step('transcribing');
      const transcript = await transcribeStep(audioUri);
      step('transcribed');
      await sleep(500);

      step('summarizing');
      const summaryResult = await summarizeStep(transcript);

      step('saving');
      const result = await saveStep(meetingId, transcript, summaryResult);

      step('done');
      return result;
    } catch (error) {
      step('error');
      throw error;
    }
  },

  async processTranscript(
    transcript: string,
    meetingId: string,
    onStep?: (step: AiProcessingStep) => void,
  ): Promise<MeetingSummary> {
    const step = onStep || ((_: AiProcessingStep) => {});

    try {
      step('transcribed');
      await sleep(300);

      step('summarizing');
      const summaryResult = await summarizeStep(transcript);

      step('saving');
      const result = await saveStep(meetingId, transcript, summaryResult);

      step('done');
      return result;
    } catch (error) {
      step('error');
      throw error;
    }
  },
};
