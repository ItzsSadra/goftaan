// Meeting detail screen - shows meeting info and AI summary
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View, Dimensions } from 'react-native';
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

const { width } = Dimensions.get('window');
const isDesktop = width > 768;
const CONTAINER_MAX_WIDTH = 800;
const CONTAINER_WIDTH = isDesktop ? CONTAINER_MAX_WIDTH : '100%';

export const MeetingDetailScreen = ({ route, navigation }: Props) => {
  const { meeting } = route.params;
  const [summary, setSummary] = useState<MeetingSummary | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      const loadSummary = async () => {
        try {
          setIsSummaryLoading(true);
          setSummaryError(null);
          const summaryData = await meetingSummaryService.getLatestSummary(meeting.id);
          if (!isMounted) {
            return;
          }
          setSummary(summaryData);
        } catch (error) {
          if (!isMounted) {
            return;
          }
          const message = error instanceof Error && error.message.trim() ? error.message : 'بارگذاری خلاصه انجام نشد.';
          setSummaryError(message);
        } finally {
          if (isMounted) {
            setIsSummaryLoading(false);
          }
        }
      };

      void loadSummary();

      return () => {
        isMounted = false;
      };
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
      if (ok) {
        runDeleteMeeting();
      }
      return;
    }

    Alert.alert('حذف جلسه', 'آیا از حذف این جلسه مطمئن هستید؟', [
      { text: 'انصراف', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: runDeleteMeeting,
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.centeredContainer}>
          <View style={styles.headerCard}>
            <Text style={styles.kicker}>جزئیات جلسه</Text>
            <Text style={styles.title}>{meeting.title}</Text>
            <Text style={styles.meta}>{formatMeetingTime(meeting.startDateISO, meeting.endDateISO)}</Text>
            {meeting.location ? <Text style={styles.meta}>محل: {meeting.location}</Text> : null}
            <View style={[styles.badge, meeting.source === 'manual' ? styles.manualBadge : styles.calendarBadge]}>
              <Text style={styles.badgeText}>{meeting.source === 'manual' ? 'جلسه دستی' : 'جلسه تقویمی'}</Text>
            </View>
            {meeting.notes ? <Text style={styles.notes}>{meeting.notes}</Text> : null}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>ضبط صدا</Text>
            <Text style={styles.cardText}>صدای جلسه را ضبط کنید تا بعدا متن و خلاصه ساخته شود.</Text>
            <View style={styles.stepsBox}>
              <Text style={styles.stepText}>۱. ضبط صدا را شروع کنید</Text>
              <Text style={styles.stepText}>۲. در طول جلسه می‌توانید مکث و ادامه دهید</Text>
              <Text style={styles.stepText}>۳. پس از پایان، ضبط را ذخیره کنید</Text>
              <Text style={styles.stepText}>۴. به صدای ضبط‌شده گوش دهید و بررسی کنید</Text>
            </View>
            <Pressable style={styles.primaryButton} onPress={() => navigation.navigate('Recording', { meeting })}>
              <Text style={styles.primaryButtonText}>شروع ضبط</Text>
            </Pressable>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>خلاصه و نکات کلیدی</Text>
            <Text style={styles.cardText}>صدای جلسه را با هوش مصنوعی پردازش کنید تا متن، خلاصه، نکات کلیدی و اقدام‌ها ساخته شود.</Text>

            {isSummaryLoading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator size="small" color={colors.accentDark} />
                <Text style={styles.cardText}>در حال دریافت خلاصه جلسه...</Text>
              </View>
            ) : null}

            {!isSummaryLoading && summaryError ? (
              <Text style={styles.errorText}>{summaryError}</Text>
            ) : null}

            {!isSummaryLoading && !summaryError && !summary ? (
              <Text style={styles.cardText}>هنوز خلاصه‌ای برای این جلسه ذخیره نشده است. ابتدا صدای جلسه را ضبط کنید و سپس با هوش مصنوعی پردازش کنید.</Text>
            ) : null}

            {!isSummaryLoading && !summaryError && summary ? (
              <View style={styles.summaryWrap}>
                {summary.transcript ? (
                  <View style={styles.summarySection}>
                    <Text style={styles.summarySectionTitle}>متن پیاده‌شده</Text>
                    <Text style={styles.summaryText}>{summary.transcript}</Text>
                  </View>
                ) : null}
                {summary.summary ? (
                  <View style={styles.summarySection}>
                    <Text style={styles.summarySectionTitle}>خلاصه</Text>
                    <Text style={styles.summaryText}>{summary.summary}</Text>
                  </View>
                ) : null}
                {summary.keyPoints.length > 0 ? (
                  <View style={styles.summarySection}>
                    <Text style={styles.summarySectionTitle}>نکات کلیدی</Text>
                    {summary.keyPoints.map((item, index) => (
                      <Text style={styles.summaryItem} key={`keypoint-${index}`}>
                        • {item}
                      </Text>
                    ))}
                  </View>
                ) : null}
                {summary.actionItems.length > 0 ? (
                  <View style={styles.summarySection}>
                    <Text style={styles.summarySectionTitle}>اقدام‌ها</Text>
                    {summary.actionItems.map((item, index) => (
                      <Text style={styles.summaryItem} key={`action-${index}`}>
                        • {item}
                      </Text>
                    ))}
                  </View>
                ) : null}
              </View>
            ) : null}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>مدیریت جلسه</Text>
            <Text style={styles.cardText}>
              {meeting.source === 'manual'
                ? 'این جلسه به صورت دستی ساخته شده و با حذف آن از برنامه حذف می‌شود.'
                : 'این جلسه از تقویم گوشی شما می‌آید و حذف آن از برنامه، آن را از تقویم نیز حذف می‌کند.'}
            </Text>
            <Pressable style={styles.dangerButton} onPress={confirmDelete}>
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
  scrollContent: {
    flexGrow: 1,
  },
  centeredContainer: {
    width: CONTAINER_WIDTH,
    maxWidth: CONTAINER_MAX_WIDTH,
    alignSelf: 'center',
    padding: isDesktop ? 20 : 16,
    paddingBottom: 24,
    gap: 14,
  },
  headerCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    backgroundColor: colors.surfaceElevated,
    padding: 18,
    gap: 8,
  },
  kicker: {
    fontSize: 11,
    letterSpacing: 0.9,
    color: colors.accentDark,
    fontFamily: typography.bold,
  },
  title: {
    fontSize: 29,
    fontFamily: typography.bold,
    color: colors.textPrimary,
  },
  meta: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: typography.regular,
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
    backgroundColor: '#DCFCE7',
  },
  badgeText: {
    fontSize: 11,
    fontFamily: typography.bold,
    color: colors.textPrimary,
  },
  notes: {
    marginTop: 2,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textPrimary,
    fontFamily: typography.regular,
  },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    backgroundColor: colors.surfaceElevated,
    padding: 16,
    gap: 10,
  },
  cardTitle: {
    fontSize: 18,
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
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  stepText: {
    fontSize: 13,
    color: colors.accentDark,
    lineHeight: 20,
    fontFamily: typography.regular,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryWrap: {
    gap: 10,
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.textPrimary,
    fontFamily: typography.regular,
  },
  summarySection: {
    gap: 6,
  },
  summarySectionTitle: {
    fontSize: 14,
    color: colors.accentDark,
    fontFamily: typography.bold,
  },
  summaryItem: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textPrimary,
    fontFamily: typography.regular,
  },
  errorText: {
    fontSize: 14,
    color: colors.danger,
    fontFamily: typography.regular,
  },
  primaryButton: {
    marginTop: 4,
    backgroundColor: colors.accentDark,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontFamily: typography.bold,
    fontSize: 15,
  },
  dangerButton: {
    marginTop: 4,
    backgroundColor: colors.danger,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  dangerButtonText: {
    color: '#FFFFFF',
    fontFamily: typography.bold,
    fontSize: 15,
  },
});