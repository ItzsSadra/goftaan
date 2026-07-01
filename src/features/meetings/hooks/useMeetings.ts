import { useCallback, useEffect, useState } from 'react';

import type { Meeting } from '../models/meeting';
import type { MeetingSummary } from '../models/meetingSummary';
import { calendarService } from '../services/calendarService';
import { manualMeetingsService } from '../services/manualMeetingsService';
import { meetingSummaryService } from '../services/meetingSummaryService';
import { isDesktopWeb } from '../../../utils/platform';
import { useAuth } from '../../auth/context/AuthContext';

type Status = 'idle' | 'loading' | 'ready' | 'permissionDenied' | 'error';

type UseMeetingsResult = {
  status: Status;
  meetings: Meeting[];
  pastMeetings: Meeting[];
  pastSummaries: Map<string, MeetingSummary>;
  errorMessage: string | null;
  isRefreshing: boolean;
  refresh: () => Promise<void>;
};

const defaultError = 'بارگذاری جلسه‌ها انجام نشد. دوباره تلاش کنید.';

const mergeMeetings = (calendarMeetings: Meeting[], manualMeetings: Meeting[]): Meeting[] => {
  const byId = new Map<string, Meeting>();
  for (const meeting of [...calendarMeetings, ...manualMeetings]) {
    byId.set(meeting.id, meeting);
  }
  return Array.from(byId.values()).sort(
    (a, b) => new Date(a.startDateISO).getTime() - new Date(b.startDateISO).getTime(),
  );
};

export const useMeetings = (): UseMeetingsResult => {
  const { user } = useAuth();
  const [status, setStatus] = useState<Status>('idle');
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [pastMeetings, setPastMeetings] = useState<Meeting[]>([]);
  const [pastSummaries, setPastSummaries] = useState<Map<string, MeetingSummary>>(new Map());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadMeetings = useCallback(async (isInitialLoad: boolean) => {
    try {
      if (isInitialLoad) {
        setStatus('loading');
      } else {
        setIsRefreshing(true);
      }
      setErrorMessage(null);

      if (!user) {
        setMeetings([]);
        setPastMeetings([]);
        setPastSummaries(new Map());
        setStatus('ready');
        if (!isInitialLoad) setIsRefreshing(false);
        return;
      }

      if (isDesktopWeb()) {
        const [manualMeetings, pastMeetingsData] = await Promise.all([
          manualMeetingsService.getMeetings(user.id),
          manualMeetingsService.getPastMeetings(user.id),
        ]);
        setMeetings(mergeMeetings([], manualMeetings));
        setPastMeetings(pastMeetingsData);

        if (pastMeetingsData.length > 0) {
          const summaries = await meetingSummaryService.getSummariesByMeetingIds(
            pastMeetingsData.map((m) => m.id),
          );
          setPastSummaries(new Map(summaries.map((s) => [s.meetingId, s])));
        }

        setStatus('ready');
        if (!isInitialLoad) setIsRefreshing(false);
        return;
      }

      const [result, manualMeetings, pastMeetingsData] = await Promise.all([
        calendarService.fetchUpcomingMeetings(),
        manualMeetingsService.getMeetings(user.id),
        manualMeetingsService.getPastMeetings(user.id),
      ]);

      if (pastMeetingsData.length > 0) {
        const summaries = await meetingSummaryService.getSummariesByMeetingIds(
          pastMeetingsData.map((m) => m.id),
        );
        setPastSummaries(new Map(summaries.map((s) => [s.meetingId, s])));
      }

      setPastMeetings(pastMeetingsData);

      if (result.permission !== 'granted') {
        setMeetings(manualMeetings);
        setStatus('permissionDenied');
        if (!isInitialLoad) setIsRefreshing(false);
        return;
      }

      setMeetings(mergeMeetings(result.meetings, manualMeetings));
      setStatus('ready');
      if (!isInitialLoad) setIsRefreshing(false);
    } catch (error) {
      setStatus('error');
      if (!isInitialLoad) setIsRefreshing(false);
      if (error instanceof Error && error.message.trim()) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage(defaultError);
      }
    }
  }, [user]);

  const refresh = useCallback(async () => {
    await loadMeetings(false);
  }, [loadMeetings]);

  useEffect(() => {
    void loadMeetings(true);
  }, [loadMeetings]);

  return {
    status,
    meetings,
    pastMeetings,
    pastSummaries,
    errorMessage,
    isRefreshing,
    refresh,
  };
};
