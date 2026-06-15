// Meeting model - represents a calendar or manual meeting
export type Meeting = {
  id: string;
  title: string;
  startDateISO: string;
  endDateISO: string;
  location?: string;
  notes?: string;
  calendarId: string;
  isAllDay: boolean;
  source: 'calendar' | 'manual';
};
