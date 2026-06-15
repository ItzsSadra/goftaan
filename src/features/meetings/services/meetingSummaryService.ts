import type { MeetingSummary, CreateMeetingSummaryInput } from '../models/meetingSummary';
import { API_BASE_URL } from '../../../utils/api';

const summariesEndpoint = `${API_BASE_URL}/summaries`;

// --- Helper Functions ---

const getErrorMessage = (payload: unknown, fallback: string): string => {
  if (payload && typeof payload === 'object' && 'message' in payload && typeof payload.message === 'string') {
    return payload.message as string;
  }
  return fallback;
};

// This function is largely kept the same as it deals with data transformation,
// but it needs to align with how the backend sends data (e.g., JSONB as arrays).
const toStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }
    return value
      .map((item: unknown) => {
      if (typeof item === 'string') {
        return item.trim();
      }
      if (item && typeof item === 'object') {
        if ('text' in item && typeof item.text === 'string') return item.text.trim();
        if ('title' in item && typeof item.title === 'string') return item.title.trim();
      }
      return String(item).trim();
    })
    .filter((item) => item.length > 0);
};

// Adjusted to match the Python backend's output structure
const toMeetingSummary = (data: any): MeetingSummary => ({
  id: String(data.id),
  meetingId: String(data.meetingId),
  transcript: data.transcript || '',
  summary: data.summary || '',
  keyPoints: toStringArray(data.keyPoints),
  actionItems: toStringArray(data.actionItems),
  createdAt: data.createdAt,
});

// --- Service Implementation ---

export const meetingSummaryService = {
  async getLatestSummary(meetingId: string): Promise<MeetingSummary | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/summaries/latest/${meetingId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(getErrorMessage(errorData, 'Failed to load latest summary.'));
      }

      const data = await response.json(); // Can be null or the summary object

      if (!data) {
        return null;
      }
      return toMeetingSummary(data);

    } catch (error) {
      console.error('Error fetching latest summary:', error);
      // Re-throw or handle as appropriate for your application
      throw error;
    }
  },

  async createSummary(input: CreateMeetingSummaryInput): Promise<MeetingSummary> {
    try {
      const response = await fetch(summariesEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meetingId: input.meetingId,
          transcript: input.transcript || '',
          summary: input.summary,
          keyPoints: input.keyPoints,
          actionItems: input.actionItems,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(getErrorMessage(data, 'Failed to save meeting summary.'));
      }

      return toMeetingSummary(data);

    } catch (error) {
      console.error('Error creating summary:', error);
      throw error;
    }
  },

  async getSummariesByMeetingIds(meetingIds: string[]): Promise<MeetingSummary[]> {
    if (!meetingIds || meetingIds.length === 0) {
      return [];
    }

    try {
      // Join IDs with a comma, assuming your backend expects this format
      const idsQueryParam = meetingIds.join(',');
      const response = await fetch(`${API_BASE_URL}/summaries/by-meeting-ids?meetingIds=${idsQueryParam}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(getErrorMessage(errorData, 'Failed to load summaries.'));
      }

      const data = await response.json();

      // The backend should return an array of MeetingSummary objects
      if (!Array.isArray(data)) {
        console.error("Backend did not return an array for getSummariesByMeetingIds");
        return [];
      }

      return data.map(toMeetingSummary);

    } catch (error) {
      console.error('Error fetching summaries by meeting IDs:', error);
      throw error;
    }
  },
};
