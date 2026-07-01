import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Calendar from 'expo-calendar/legacy';

import type { AppStackParamList } from '../../navigation/types';
import { formatMeetingTime } from '../../utils/date';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { isDesktopWeb } from '../../utils/platform';
import type { MeetingSummary } from '../../features/meetings/models/meetingSummary';
import { manualMeetingsService } from '../../features/meetings/services/manualMeetingsService';
import { meetingSummaryService } from '../../features/meetings/services/meetingSummaryService';

type Props = NativeStackScreenProps<AppStackParamList, 'MeetingDetail'>;

export const MeetingDetailScreen = ({ route, navigation }: Props) => {
  const { meeting } = route.params;
  const [summary, setSummary] = useState<MeetingSummary | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const { width } = useWindowDimensions();
  const isDesktop = width > 768;
  const isSmall = width < 380;
  const CONTAINER_MAX_WIDTH = 800;

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      const loadSummary = async () => {
        try {
          setIsSummaryLoading(true);
          setSummaryError(null);
          const summaryData = await meetingSummaryService.getLatestSummary(meeting.id);
          if (!isMounted) return;
          setSummary(summaryData);
        } catch (error) {
          if (!isMounted) return;
          const message = error instanceof Error && error.message.trim() ? error.message : 'بارگذاری خلاصه انجام نشد.';
          setSummaryError(message);
        } finally {
          if (isMounted) setIsSummaryLoading(false);
        }
      };
      void loadSummary();
      return () => { isMounted = false; };
    }, [meeting.id]),
  );

  const runDeleteMeeting = () => {
    const remove = async () => {
      try {
        if (meeting.source === 'manual') {
          await manualMeetingsService.removeMeeting(meeting.id);
        } else {
          if (isDesktopWeb()) {
            Alert.alert('غیرفعال در نسخه دسکتاپ وب', 'در نسخه دسکتاپ وب، قابلیت تقویم غیرفعال است.');
            return;
          }
          const permission = await Calendar.requestCalendarPermissionsAsync();
          if (permission.status !== 'granted') {
            Alert.alert('دسترسی لازم است', 'برای حذف جلسه تقویمی، اجازه دسترسی تقویم را فعال کنید.');
            return;
          }
          await Calendar.deleteEventAsync(meeting.id);
        }
        navigation.goBack();
      } catch {
        Alert.alert('خطا', 'حذف جلسه انجام نشد. دوباره تلاش کنید.');
      }
    };
    void remove();
  };

  const confirmDelete = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const ok = window.confirm('آیا از حذف این جلسه مطمئن هستید؟');
      if (ok) runDeleteMeeting();
      return;
    }
    Alert.alert('حذف جلسه', 'آیا از حذف این جلسه مطمئن هستید؟', [
      { text: 'انصراف', style: 'cancel' },
      { text: 'حذف', style: 'destructive', onPress: runDeleteMeeting },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.centeredContainer, { maxWidth: CONTAINER_MAX_WIDTH }]}>
          <View style={[styles.headerCard, isSmall && styles.headerCardSmall]}>
            <Text style={styles.kicker}>جزئیات جلسه</Text>
            <Text style={[styles.title, isSmall && styles.titleSmall]}>{meeting.title}</Text>
            <Text style={styles.meta}>{formatMeetingTime(meeting.startDateISO, meeting.endDateISO)}</Text>
            {meeting.location ? (
              <View style={styles.metaRow}>
                <Text style={styles.metaIcon}>📍</Text>
                <Text style={styles.meta}>{meeting.location}</Text>
              </View>
            ) : null}
            <View style={[styles.badge, meeting.source === 'manual' ? styles.manualBadge : styles.calendarBadge]}>
              <Text style={styles.badgeText}>{meeting.source === 'manual' ? 'جلسه دستی' : 'جلسه تقویمی'}</Text>
            </View>
            {meeting.notes ? (
              <View style={styles.notesBox}>
                <Text style={styles.notesText}>{meeting.notes}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.card}>
            <View style={styles.cardIconRow}>
              <View style={styles.cardIcon}>
                <Text style={styles.cardIconText}>🎤</Text>
              </View>
              <View style={styles.cardTextWrap}>
                <Text style={styles.cardTitle}>ضبط صدا</Text>
                <Text style={styles.cardText}>صدای جلسه را ضبط کنید تا بعدا متن و خلاصه ساخته شود.</Text>
              </View>
            </View>
            <View style={[styles.stepsBox, isSmall && styles.stepsBoxSmall]}>
              <Text style={styles.stepText}>۱. ضبط صدا را شروع کنید</Text>
              <Text style={styles.stepText}>۲. در طول جلسه می‌توانید مکث و ادامه دهید</Text>
              <Text style={styles.stepText}>۳. پس از پایان، ضبط را ذخیره کنید</Text>
              <Text style={styles.stepText}>۴. به صدای ضبط‌شده گوش دهید و بررسی کنید</Text>
            </View>
            <Pressable
              style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
              onPress={() => navigation.navigate('Recording', { meeting })}
            >
              <Text style={styles.primaryButtonText}>شروع ضبط</Text>
            </Pressable>
          </View>

          <View style={styles.card}>
            <View style={styles.cardIconRow}>
              <View style={styles.cardIcon}>
                <Text style={styles.cardIconText}>🤖</Text>
              </View>
              <View style={styles.cardTextWrap}>
                <Text style={styles.cardTitle}>خلاصه و نکات کلیدی</Text>
                <Text style={styles.cardText}>صدای جلسه را با هوش مصنوعی پردازش کنید تا متن، خلاصه، نکات کلیدی و اقدام‌ها ساخته شود.</Text>
              </View>
            </View>

            {isSummaryLoading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color={colors.accentDark} />
                <Text style={styles.cardText}>در حال دریافت خلاصه جلسه...</Text>
              </View>
            ) : null}

            {!isSummaryLoading && summaryError ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{summaryError}</Text>
              </View>
            ) : null}

            {!isSummaryLoading && !summaryError && !summary ? (
              <Text style={styles.cardText}>هنوز خلاصه‌ای برای این جلسه ذخیره نشده است. ابتدا صدای جلسه را ضبط کنید و سپس با هوش مصنوعی پردازش کنید.</Text>
            ) : null}

            {!isSummaryLoading && !summaryError && summary ? (
              <View style={styles.summaryWrap}>
                {summary.transcript ? (
                  <View style={styles.summarySection}>
                    <Text style={styles.summarySectionTitle}>متن پیاده‌شده</Text>
                    <View style={styles.summaryContentBox}>
                      <Text style={styles.summaryText}>{summary.transcript}</Text>
                    </View>
                  </View>
                ) : null}
                {summary.summary ? (
                  <View style={styles.summarySection}>
                    <Text style={styles.summarySectionTitle}>خلاصه</Text>
                    <View style={styles.summaryContentBox}>
                      <Text style={styles.summaryText}>{summary.summary}</Text>
                    </View>
                  </View>
                ) : null}
                {summary.keyPoints.length > 0 ? (
                  <View style={styles.summarySection}>
                    <Text style={styles.summarySectionTitle}>نکات کلیدی</Text>
                    {summary.keyPoints.map((item, index) => (
                      <View style={styles.bulletRow} key={`keypoint-${index}`}>
                        <View style={styles.bullet} />
                        <Text style={styles.summaryItem}>{item}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
                {summary.actionItems.length > 0 ? (
                  <View style={styles.summarySection}>
                    <Text style={styles.summarySectionTitle}>اقدام‌ها</Text>
                    {summary.actionItems.map((item, index) => (
                      <View style={styles.bulletRow} key={`action-${index}`}>
                        <View style={[styles.bullet, styles.bulletAction]} />
                        <Text style={styles.summaryItem}>{item}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            ) : null}
          </View>

          <View style={[styles.card, styles.dangerCard]}>
            <Text style={styles.cardTitle}>مدیریت جلسه</Text>
            <Text style={styles.cardText}>
              {meeting.source === 'manual'
                ? 'این جلسه به صورت دستی ساخته شده و با حذف آن از برنامه حذف می‌شود.'
                : 'این جلسه از تقویم گوشی شما می‌آید و حذف آن از برنامه، آن را از تقویم نیز حذف می‌کند.'}
            </Text>
            <Pressable
              style={({ pressed }) => [styles.dangerButton, pressed && styles.buttonPressed]}
              onPress={confirmDelete}
            >
              <Text style={styles.dangerButtonText}>حذف جلسه</Text>
            </Pressable>
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
    paddingBottom: 24,
    gap: 14,
  },
  headerCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    backgroundColor: colors.surface,
    padding: 18,
    gap: 8,
  },
  headerCardSmall: {
    padding: 14,
  },
  kicker: {
    fontSize: 11,
    letterSpacing: 0.9,
    color: colors.accentDark,
    fontFamily: typography.bold,
  },
  title: {
    fontSize: 26,
    fontFamily: typography.bold,
    color: colors.textPrimary,
  },
  titleSmall: {
    fontSize: 22,
  },
  meta: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: typography.regular,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaIcon: {
    fontSize: 14,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  calendarBadge: {
    backgroundColor: colors.accentSoft,
  },
  manualBadge: {
    backgroundColor: '#D1FAE5',
  },
  badgeText: {
    fontSize: 11,
    fontFamily: typography.bold,
    color: colors.textPrimary,
  },
  notesBox: {
    backgroundColor: colors.backgroundAccent,
    borderRadius: 10,
    padding: 12,
  },
  notesText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textPrimary,
    fontFamily: typography.regular,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    backgroundColor: colors.surface,
    padding: 18,
    gap: 12,
  },
  cardIconRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.accentSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardIconText: {
    fontSize: 20,
  },
  cardTextWrap: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: 17,
    fontFamily: typography.bold,
    color: colors.textPrimary,
  },
  cardText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    fontFamily: typography.regular,
  },
  stepsBox: {
    backgroundColor: colors.accentSoft,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  stepsBoxSmall: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  stepText: {
    fontSize: 13,
    color: colors.accentDark,
    lineHeight: 22,
    fontFamily: typography.regular,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryWrap: {
    gap: 14,
  },
  summarySection: {
    gap: 8,
  },
  summarySectionTitle: {
    fontSize: 14,
    color: colors.accentDark,
    fontFamily: typography.bold,
  },
  summaryContentBox: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 14,
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.textPrimary,
    fontFamily: typography.regular,
  },
  summaryItem: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textPrimary,
    fontFamily: typography.regular,
    flex: 1,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
    marginTop: 6,
  },
  bulletAction: {
    backgroundColor: colors.warning,
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    fontSize: 14,
    color: colors.danger,
    fontFamily: typography.regular,
  },
  primaryButton: {
    backgroundColor: colors.accentDark,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontFamily: typography.bold,
    fontSize: 15,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  dangerCard: {
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  dangerButton: {
    backgroundColor: colors.danger,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  dangerButtonText: {
    color: '#FFFFFF',
    fontFamily: typography.bold,
    fontSize: 15,
  },
});
