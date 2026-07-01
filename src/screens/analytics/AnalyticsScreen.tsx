import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../../features/auth/context/AuthContext';
import type { Meeting } from '../../features/meetings/models/meeting';
import type { MeetingSummary } from '../../features/meetings/models/meetingSummary';
import { manualMeetingsService } from '../../features/meetings/services/manualMeetingsService';
import { meetingSummaryService } from '../../features/meetings/services/meetingSummaryService';
import { settingsService } from '../../features/settings/services/settingsService';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

type AnalyticsState = {
  meetings: Meeting[];
  summaries: MeetingSummary[];
};

const parseActionItemMeta = (value: string) => {
  const completed = /^\s*(\[x\]|✅)/i.test(value.trim());
  const dueMatch = value.match(/(\d{4}-\d{2}-\d{2})/);
  const dueDate = dueMatch ? new Date(`${dueMatch[1]}T23:59:59`) : null;
  return { completed, dueDate };
};

const startOfWeek = (date: Date) => {
  const next = new Date(date);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  next.setDate(next.getDate() + diff);
  next.setHours(0, 0, 0, 0);
  return next;
};

export const AnalyticsScreen = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AnalyticsState>({ meetings: [], summaries: [] });
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);

  const { width } = useWindowDimensions();
  const isDesktop = width > 768;
  const isSmall = width < 380;
  const CONTAINER_MAX_WIDTH = 800;

  const load = useCallback(
    async (refreshing: boolean) => {
      if (!user) {
        setData({ meetings: [], summaries: [] });
        setIsLoading(false);
        return;
      }
      try {
        if (refreshing) setIsRefreshing(true);
        else setIsLoading(true);
        setError(null);
        const appSettings = await settingsService.getAppSettings();
        setShowOverdueOnly(appSettings.analyticsShowOverdueOnly);
        const meetings = await manualMeetingsService.getAllMeetings(user.id);
        const summaries = await meetingSummaryService.getSummariesByMeetingIds(meetings.map((item) => item.id));
        setData({ meetings, summaries });
      } catch {
        setError('به خاطر شرایط فعلی اینترنت قادر به تولید خلاصه نیستیم');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [user],
  );

  useFocusEffect(
    useCallback(() => { void load(false); }, [load]),
  );

  const stats = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const meetings = showOverdueOnly
      ? data.meetings.filter((meeting) => {
          const summary = data.summaries.find((item) => item.meetingId === meeting.id);
          if (!summary) return false;
          return summary.actionItems.some((action) => {
            const parsed = parseActionItemMeta(action);
            return Boolean(parsed.dueDate && !parsed.completed && parsed.dueDate.getTime() < now.getTime());
          });
        })
      : data.meetings;

    const summariesByMeeting = new Map(data.summaries.map((summary) => [summary.meetingId, summary]));
    const meetingsWithSummary = meetings.filter((meeting) => summariesByMeeting.has(meeting.id)).length;
    const summaryCoverage = meetings.length ? Math.round((meetingsWithSummary / meetings.length) * 100) : 0;
    const durations = meetings.map(
      (meeting) => (new Date(meeting.endDateISO).getTime() - new Date(meeting.startDateISO).getTime()) / 60000,
    );
    const avgDuration = durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;
    const thisWeekCount = meetings.filter((meeting) => {
      const start = new Date(meeting.startDateISO);
      return start >= weekStart && start < weekEnd;
    }).length;

    let keyPointsCount = 0;
    let overdueActions = 0;
    for (const summary of data.summaries) {
      keyPointsCount += summary.keyPoints.length;
      for (const action of summary.actionItems) {
        const parsed = parseActionItemMeta(action);
        if (parsed.dueDate && !parsed.completed && parsed.dueDate.getTime() < now.getTime()) {
          overdueActions += 1;
        }
      }
    }

    const upcoming7Days = Array.from({ length: 7 }, (_, index) => {
      const dayStart = new Date(now);
      dayStart.setHours(0, 0, 0, 0);
      dayStart.setDate(dayStart.getDate() + index);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      return meetings.filter((meeting) => {
        const start = new Date(meeting.startDateISO);
        return start >= dayStart && start < dayEnd;
      }).length;
    });

    return {
      totalMeetings: meetings.length,
      thisWeekCount,
      summaryCoverage,
      avgDuration,
      keyPointsCount,
      overdueActions,
      upcoming7Days,
    };
  }, [data.meetings, data.summaries, showOverdueOnly]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={colors.accentDark} />
        </View>
      </SafeAreaView>
    );
  }

  const metricCards = [
    { value: stats.totalMeetings, label: 'کل جلسه‌ها', desc: 'تعداد کل جلسات ثبت شده', danger: false },
    { value: stats.thisWeekCount, label: 'جلسه این هفته', desc: 'جلسات از شنبه تا جمعه', danger: false },
    { value: `${stats.summaryCoverage}%`, label: 'پوشش خلاصه', desc: 'درصد جلسات دارای خلاصه', danger: false },
    { value: stats.avgDuration, label: 'میانگین دقیقه', desc: 'میانگین مدت جلسات', danger: false },
    { value: stats.keyPointsCount, label: 'نکات کلیدی', desc: 'مجموع نکات ثبت شده', danger: false },
    { value: stats.overdueActions, label: 'اقدام معوق', desc: 'اقدام‌های عقب‌افتاده', danger: stats.overdueActions > 0 },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => void load(true)} />}
      >
        <View style={[styles.centeredContainer, { maxWidth: CONTAINER_MAX_WIDTH }]}>
          <View style={[styles.heroCard, isSmall && styles.heroCardSmall]}>
            <Text style={styles.kicker}>تحلیل</Text>
            <Text style={[styles.title, isSmall && styles.titleSmall]}>داشبورد عملکرد</Text>
            <Text style={styles.subtitle}>نمای کلی جلسه‌ها، خلاصه‌ها و اقدام‌ها</Text>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.grid}>
            {metricCards.map((card, index) => (
              <View key={index} style={[styles.metricCard, (isSmall || width < 500) && styles.metricCardFull]}>
                <Text style={[styles.metricValue, card.danger ? styles.metricDanger : null]}>
                  {card.value}
                </Text>
                <Text style={styles.metricLabel}>{card.label}</Text>
                <Text style={styles.metricDescription}>{card.desc}</Text>
              </View>
            ))}
          </View>

          <View style={[styles.chartCard, isSmall && styles.chartCardSmall]}>
            <Text style={styles.chartTitle}>۷ روز آینده</Text>
            <Text style={styles.chartDescription}>تعداد جلسات در هر روز از امروز به بعد</Text>
            <View style={styles.barRow}>
              {stats.upcoming7Days.map((count, index) => (
                <View style={[styles.barItem, isSmall && styles.barItemSmall]} key={`day-${index}`}>
                  <View style={[styles.bar, { height: Math.max(8, count * 12) }, isSmall && styles.barSmall]} />
                  <Text style={[styles.barLabel, isSmall && styles.barLabelSmall]}>{count}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loaderWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  centeredContainer: {
    width: '100%',
    alignSelf: 'center',
    padding: 16,
    paddingBottom: 26,
    gap: 14,
  },
  heroCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    backgroundColor: colors.surface,
    padding: 18,
    gap: 4,
  },
  heroCardSmall: {
    padding: 14,
  },
  kicker: {
    fontSize: 11,
    color: colors.accentDark,
    letterSpacing: 0.9,
    fontFamily: typography.bold,
  },
  title: {
    fontSize: 26,
    color: colors.textPrimary,
    fontFamily: typography.bold,
  },
  titleSmall: {
    fontSize: 22,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: typography.regular,
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    color: colors.danger,
    fontFamily: typography.regular,
    fontSize: 13,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCard: {
    width: '31.5%',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.surface,
    padding: 14,
    gap: 4,
    flexGrow: 1,
  },
  metricCardFull: {
    width: '100%',
  },
  metricValue: {
    fontSize: 28,
    color: colors.textPrimary,
    fontFamily: typography.bold,
  },
  metricDanger: {
    color: colors.danger,
  },
  metricLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: typography.bold,
  },
  metricDescription: {
    fontSize: 11,
    color: colors.textSecondary,
    fontFamily: typography.regular,
    lineHeight: 15,
  },
  chartCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    backgroundColor: colors.surface,
    padding: 18,
    gap: 12,
  },
  chartCardSmall: {
    padding: 14,
  },
  chartTitle: {
    fontSize: 16,
    color: colors.textPrimary,
    fontFamily: typography.bold,
  },
  chartDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: typography.regular,
    lineHeight: 16,
  },
  barRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    minHeight: 94,
    paddingTop: 8,
  },
  barItem: {
    alignItems: 'center',
    gap: 6,
    width: 36,
  },
  barItemSmall: {
    width: 28,
  },
  bar: {
    width: 28,
    borderRadius: 8,
    backgroundColor: colors.accent,
  },
  barSmall: {
    width: 20,
  },
  barLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontFamily: typography.bold,
  },
  barLabelSmall: {
    fontSize: 10,
  },
});
