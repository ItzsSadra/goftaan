import { Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import type { Meeting } from '../models/meeting';
import type { MeetingSummary } from '../models/meetingSummary';
import { formatMeetingTime } from '../../../utils/date';
import { colors } from '../../../theme/colors';
import { typography } from '../../../theme/typography';

type MeetingCardProps = {
  meeting: Meeting;
  onPress: (meeting: Meeting) => void;
  onDeletePress?: (meeting: Meeting) => void;
  compact?: boolean;
  summary?: MeetingSummary | null;
  showSummary?: boolean;
};

export const MeetingCard = ({ meeting, onPress, onDeletePress, compact = false, summary, showSummary = false }: MeetingCardProps) => {
  const { width } = useWindowDimensions();
  const isSmall = width < 380;
  const isPast = new Date(meeting.endDateISO).getTime() < Date.now();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        compact ? styles.compactCard : null,
        pressed ? styles.cardPressed : null,
        isPast && styles.cardPast,
      ]}
      onPress={() => onPress(meeting)}
    >
      <View style={[styles.accentBar, { backgroundColor: isPast ? colors.textSecondary : meeting.source === 'manual' ? colors.success : colors.accent }]} />
      <View style={styles.body}>
        <View style={styles.row}>
          <Text style={[styles.title, isSmall && styles.titleSmall]} numberOfLines={compact ? 1 : 2}>
            {meeting.title}
          </Text>
          <View style={[styles.badge, isPast ? styles.badgePast : meeting.source === 'manual' ? styles.badgeManual : styles.badgeCalendar]}>
            <Text style={styles.badgeText}>
              {isPast ? 'گذشته' : meeting.source === 'manual' ? 'دستی' : 'تقویم'}
            </Text>
          </View>
        </View>
        <Text style={[styles.time, isSmall && styles.timeSmall]}>{formatMeetingTime(meeting.startDateISO, meeting.endDateISO)}</Text>
        {meeting.location ? (
          <View style={styles.locationRow}>
            <Text style={[styles.location, isSmall && styles.locationSmall]}>📍 {meeting.location}</Text>
          </View>
        ) : null}

        {showSummary && summary ? (
          <View style={styles.summaryPreview}>
            {summary.summary ? (
              <Text style={styles.summaryText} numberOfLines={3}>
                {summary.summary}
              </Text>
            ) : null}
            <View style={styles.summaryMeta}>
              {summary.keyPoints.length > 0 ? (
                <Text style={styles.summaryMetaText}>💡 {summary.keyPoints.length} نکته کلیدی</Text>
              ) : null}
              {summary.actionItems.length > 0 ? (
                <Text style={styles.summaryMetaText}>📋 {summary.actionItems.length} اقدام</Text>
              ) : null}
            </View>
          </View>
        ) : showSummary && summary === null ? (
          <View style={styles.noSummary}>
            <Text style={styles.noSummaryText}>بدون خلاصه</Text>
          </View>
        ) : null}

        {onDeletePress ? (
          <View style={styles.actionsRow}>
            <Pressable
              style={styles.deleteButton}
              onPress={(event) => {
                event.stopPropagation();
                onDeletePress(meeting);
              }}
              hitSlop={8}
            >
              <Text style={styles.deleteButtonText}>حذف</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: colors.shadow,
        shadowOpacity: 0.06,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 2 },
      web: { boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.06)' },
    }),
  },
  cardPast: {
    opacity: 0.85,
  },
  compactCard: {
    borderRadius: 12,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  accentBar: {
    width: 4,
  },
  body: {
    flex: 1,
    padding: 14,
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  title: {
    fontSize: 17,
    fontFamily: typography.bold,
    color: colors.textPrimary,
    flex: 1,
  },
  titleSmall: {
    fontSize: 15,
  },
  time: {
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: typography.regular,
  },
  timeSmall: {
    fontSize: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
    fontSize: 13,
    color: colors.accentDark,
    fontFamily: typography.regular,
  },
  locationSmall: {
    fontSize: 12,
  },
  summaryPreview: {
    backgroundColor: colors.backgroundAccent,
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  summaryText: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.textPrimary,
    fontFamily: typography.regular,
  },
  summaryMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryMetaText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontFamily: typography.bold,
  },
  noSummary: {
    backgroundColor: colors.backgroundAccent,
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
  },
  noSummaryText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: typography.regular,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  deleteButton: {
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  deleteButtonText: {
    color: colors.danger,
    fontSize: 12,
    fontFamily: typography.bold,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeCalendar: {
    backgroundColor: colors.accentSoft,
  },
  badgeManual: {
    backgroundColor: '#D1FAE5',
  },
  badgePast: {
    backgroundColor: colors.backgroundAccent,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: typography.bold,
    color: colors.textPrimary,
  },
});
