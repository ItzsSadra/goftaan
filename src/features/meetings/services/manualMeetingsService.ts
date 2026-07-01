import type { Meeting } from '../models/meeting';
import { API_BASE_URL } from '../../../utils/api';

type ManualMeetingInput = {
  userId: string;
  title: string;
  location?: string;
  notes?: string;
  startDateISO: string;
  endDateISO: string;
};

type MeetingRow = {
  id: string | number;
  user_id: string;
  title: string;
  location: string | null;
  notes: string | null;
  start_at: string;
  end_at: string;
};

const apiBase = `${API_BASE_URL}/api`;

const toMeeting = (row: MeetingRow): Meeting => ({
  id: String(row.id),
  title: row.title,
  location: row.location || undefined,
  notes: row.notes || undefined,
  startDateISO: row.start_at,
  endDateISO: row.end_at,
  calendarId: 'postgres',
  isAllDay: false,
  source: 'manual',
});

const getErrorMessage = (payload: unknown, fallback: string): string => {
  if (payload && typeof payload === 'object' && 'message' in payload && typeof (payload as any).message === 'string') {
    return (payload as any).message;
  }
  return fallback;
};

export const manualMeetingsService = {
  async getMeetings(userId: string): Promise<Meeting[]> {
    const response = await fetch(`${apiBase}/meetings?user_id=${encodeURIComponent(userId)}&upcoming=true`);
    const data = await response.json();

    if (!response.ok || !Array.isArray(data)) {
      throw new Error(getErrorMessage(data, 'Failed to load meetings.'));
    }

    return data.map(toMeeting);
  },

  async getPastMeetings(userId: string): Promise<Meeting[]> {
    const response = await fetch(`${apiBase}/meetings?user_id=${encodeURIComponent(userId)}&past=true`);
    const data = await response.json();

    if (!response.ok || !Array.isArray(data)) {
      throw new Error(getErrorMessage(data, 'Failed to load past meetings.'));
    }

    return data.map(toMeeting);
  },

  async getAllMeetings(userId: string): Promise<Meeting[]> {
    const response = await fetch(`${apiBase}/meetings?user_id=${encodeURIComponent(userId)}`);
    const data = await response.json();

    if (!response.ok || !Array.isArray(data)) {
      throw new Error(getErrorMessage(data, 'Failed to load meetings.'));
    }

    return data.map(toMeeting);
  },

  async addMeeting(input: ManualMeetingInput): Promise<Meeting> {
    const res = await fetch(`${apiBase}/meetings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: input.userId,
        title: input.title,
        location: input.location ?? null,
        notes: input.notes ?? null,
        start_at: input.startDateISO,
        end_at: input.endDateISO,
      }),
    });

    const data = await res.json();

    if (!res.ok || !data) {
      throw new Error(getErrorMessage(data, 'Failed to save meeting.'));
    }

    return toMeeting(data);
  },

  async removeMeeting(meetingId: string): Promise<void> {
    const res = await fetch(`${apiBase}/meetings/${encodeURIComponent(meetingId)}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(getErrorMessage(data, 'Failed to delete meeting.'));
    }
  },
};
