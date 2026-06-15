// Define the structure for a meeting summary row
export interface MeetingSummary {
  id: string;
  meetingId: string;
  transcript: string;
  summary: string;
  keyPoints: string[];
  actionItems: string[];
  createdAt: string;
}

export interface CreateMeetingSummaryInput {
  meetingId: string;
  transcript?: string;
  summary: string;
  keyPoints?: string[];
  actionItems?: string[];
}
