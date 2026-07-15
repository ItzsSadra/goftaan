export interface User {
  id: string
  name: string
  email: string
}

export interface Meeting {
  id: string
  userId: string
  title: string
  location: string
  notes: string
  startAt: string
  endAt: string
  source: "manual" | "calendar"
  createdAt: string
}

export interface MeetingSummary {
  id: string
  meetingId: string
  transcript: string
  summary: string
  keyPoints: string[]
  actionItems: string[]
  createdAt: string
}

export type AiProcessingStep =
  | "idle"
  | "transcribing"
  | "transcribed"
  | "summarizing"
  | "saving"
  | "done"
  | "error"

export interface RecordingSettings {
  reminders: {
    preMeetingEnabled: boolean
    preMeetingMinutes: number
    summaryReadyEnabled: boolean
    overdueActionsEnabled: boolean
  }
  app: {
    autoRefreshMeetings: boolean
    defaultMeetingDurationMinutes: number
    analyticsShowOverdueOnly: boolean
    compactCards: boolean
  }
}

export const DEFAULT_SETTINGS: RecordingSettings = {
  reminders: {
    preMeetingEnabled: true,
    preMeetingMinutes: 15,
    summaryReadyEnabled: true,
    overdueActionsEnabled: true,
  },
  app: {
    autoRefreshMeetings: true,
    defaultMeetingDurationMinutes: 45,
    analyticsShowOverdueOnly: false,
    compactCards: false,
  },
}
