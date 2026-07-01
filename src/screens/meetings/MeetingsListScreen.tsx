import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';

import { MeetingCard } from '../../features/meetings/components/MeetingCard';
import { useMeetings } from '../../features/meetings/hooks/useMeetings';
import { useAuth } from '../../features/auth/context/AuthContext';
import type { AppStackParamList, HomeTabParamList } from '../../navigation/types';
import { CenteredState } from '../../components/CenteredState';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { manualMeetingsService } from '../../features/meetings/services/manualMeetingsService';
import { settingsService } from '../../features/settings/services/settingsService';

type Props = CompositeScreenProps<
  BottomTabScreenProps<HomeTabParamList, 'MeetingsList'>,
  NativeStackScreenProps<AppStackParamList>
>;

type Section = 'upcoming' | 'past';

export const MeetingsListScreen = ({ navigation }: Props) => {
  const { status, meetings, pastMeetings, pastSummaries, errorMessage, isRefreshing, refresh } = useMeetings();
  const { logout } = useAuth();
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [compactCardsEnabled, setCompactCardsEnabled] = useState(false);
  const [activeSection, setActiveSection] = useState<Section>('upcoming');

  const { width } = useWindowDimensions();
  const isDesktop = width > 768;
  const isSmall = width < 380;
  const CONTAINER_MAX_WIDTH = 800;

  useEffect(() => {
    const loadAppSettings = async () => {
      const appSettings = await settingsService.getAppSettings();
      setAutoRefreshEnabled(appSettings.autoRefreshMeetings);
      setCompactCardsEnabled(appSettings.compactCards);
    };
    void loadAppSettings();
  }, []);

  const runDeleteMeeting = (meetingId: string) => {
    const remove = async () => {
      try {
        await manualMeetingsService.removeMeeting(meetingId);
        await refresh();
      } catch {
        Alert.alert('خطا', 'حذف جلسه انجام نشد. دوباره تلاش کنید.');
      }
    };
    void remove();
  };

  const handleDeleteMeeting = (meetingId: string) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const ok = window.confirm('آیا از حذف این جلسه مطمئن هستید؟');
      if (ok) runDeleteMeeting(meetingId);
      return;
    }
    Alert.alert('حذف جلسه', 'آیا از حذف این جلسه مطمئن هستید؟', [
      { text: 'انصراف', style: 'cancel' },
      { text: 'حذف', style: 'destructive', onPress: () => runDeleteMeeting(meetingId) },
    ]);
  };

  useFocusEffect(
    useCallback(() => {
      if (!autoRefreshEnabled) return;
      void refresh();
    }, [autoRefreshEnabled, refresh]),
  );

  const upcomingEmptyState = useMemo(() => {
    if (status === 'permissionDenied' && meetings.length === 0) {
      return (
        <CenteredState
          title="دسترسی به تقویم لازم است"
          description="برای دیدن رویدادهای تقویم گوشی خود، دسترسی تقویم را از تنظیمات دستگاه فعال کنید. همچنین می‌توانید بدون نیاز به تقویم، یک جلسه دستی اضافه کنید."
          action={
            <View style={styles.stateActionsRow}>
              <Pressable style={styles.secondaryActionButton} onPress={() => navigation.navigate('AddMeeting')}>
                <Text style={styles.secondaryActionText}>افزودن جلسه</Text>
              </Pressable>
              <Pressable style={styles.primaryActionButton} onPress={() => void Linking.openSettings()}>
                <Text style={styles.primaryActionText}>باز کردن تنظیمات</Text>
              </Pressable>
            </View>
          }
        />
      );
    }

    if (status === 'error' && meetings.length === 0) {
      return (
        <CenteredState
          title="بارگذاری جلسه‌ها ناموفق بود"
          description={errorMessage || 'برای اتصال دوباره به تقویم، مجددا تلاش کنید.'}
          action={
            <Pressable style={styles.primaryActionButton} onPress={() => void refresh()}>
              <Text style={styles.primaryActionText}>تلاش مجدد</Text>
            </Pressable>
          }
        />
      );
    }

    if ((status === 'ready' || status === 'permissionDenied') && meetings.length === 0) {
      return (
        <CenteredState
          title="جلسه‌ای در راه نیست"
          description="در ۷ روز آینده جلسه‌ای در تقویم شما نیست. یک جلسه دستی اضافه کنید یا با زدن دکمه تازه‌سازی، رویدادهای تقویم را دوباره بررسی کنید."
          action={
            <View style={styles.stateActionsRow}>
              <Pressable style={styles.secondaryActionButton} onPress={() => navigation.navigate('AddMeeting')}>
                <Text style={styles.secondaryActionText}>افزودن جلسه</Text>
              </Pressable>
              <Pressable style={styles.primaryActionButton} onPress={() => void refresh()}>
                <Text style={styles.primaryActionText}>تازه‌سازی</Text>
              </Pressable>
            </View>
          }
        />
      );
    }

    return null;
  }, [errorMessage, meetings.length, navigation, refresh, status]);

  const pastEmptyState = useMemo(() => {
    if (status === 'loading') return null;
    if (pastMeetings.length === 0) {
      return (
        <CenteredState
          title="جلسه‌ای ثبت نشده"
          description="هنوز جلسه‌ای برگزار نکرده‌اید. پس از برگزاری جلسات، تاریخچه آن‌ها اینجا نمایش داده می‌شود."
        />
      );
    }
    return null;
  }, [pastMeetings.length, status]);

  const hasUpcomingList = meetings.length > 0 && (status === 'ready' || status === 'permissionDenied');
  const hasPastList = pastMeetings.length > 0;
  const isLoading = status === 'loading';

  const renderPastMeeting = ({ item }: { item: (typeof pastMeetings)[0] }) => (
    <MeetingCard
      meeting={item}
      compact={compactCardsEnabled}
      summary={pastSummaries.get(item.id) ?? null}
      showSummary
      onPress={(meeting) => navigation.navigate('MeetingDetail', { meeting })}
      onDeletePress={
        item.source === 'manual'
          ? (meeting) => handleDeleteMeeting(meeting.id)
          : undefined
      }
    />
  );

  const renderUpcomingMeeting = ({ item }: { item: (typeof meetings)[0] }) => (
    <MeetingCard
      meeting={item}
      compact={compactCardsEnabled}
      onPress={(meeting) => navigation.navigate('MeetingDetail', { meeting })}
      onDeletePress={
        item.source === 'manual'
          ? (meeting) => handleDeleteMeeting(meeting.id)
          : undefined
      }
    />
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.wrapper}>
        <View style={[styles.centeredContainer, { maxWidth: CONTAINER_MAX_WIDTH }]}>
          <View style={[styles.headerCard, isSmall && styles.headerCardSmall]}>
            <View style={styles.headerTopRow}>
              <View style={styles.headerTextWrap}>
                <Text style={styles.kicker}>داشبورد</Text>
                <Text style={[styles.title, isSmall && styles.titleSmall]}>جلسه‌های من</Text>
              </View>
              <View style={styles.counterChip}>
                <Text style={styles.counterChipText}>
                  {activeSection === 'upcoming' ? meetings.length : pastMeetings.length}
                </Text>
              </View>
            </View>
            <Text style={styles.subtitle}>جلسه موردنظر را انتخاب کنید تا ضبط، پیاده‌سازی و خلاصه را شروع کنید.</Text>

            <View style={styles.sectionTabs}>
              <Pressable
                style={[styles.sectionTab, activeSection === 'upcoming' && styles.sectionTabActive]}
                onPress={() => setActiveSection('upcoming')}
              >
                <View style={[styles.sectionTabDot, activeSection === 'upcoming' && styles.sectionTabDotActive]} />
                <Text style={[styles.sectionTabText, activeSection === 'upcoming' && styles.sectionTabTextActive]}>
                  پیش رو
                </Text>
              </Pressable>
              <Pressable
                style={[styles.sectionTab, activeSection === 'past' && styles.sectionTabActive]}
                onPress={() => setActiveSection('past')}
              >
                <View style={[styles.sectionTabDot, activeSection === 'past' && styles.sectionTabDotPast]} />
                <Text style={[styles.sectionTabText, activeSection === 'past' && styles.sectionTabTextActive]}>
                  گذشته
                </Text>
              </Pressable>
            </View>

            <View style={[styles.guide, isSmall && styles.guideSmall]}>
              <Text style={styles.guideText}>
                {activeSection === 'upcoming'
                  ? 'جلسه‌های پیش رو از تقویم گوشی و جلسات دستی شما'
                  : 'جلسه‌های برگزار شده به همراه خلاصه و نکات'}
              </Text>
            </View>

            <View style={styles.headerActions}>
              {activeSection === 'upcoming' ? (
                <Pressable style={styles.addButton} onPress={() => navigation.navigate('AddMeeting')}>
                  <Text style={styles.addButtonText}>+ افزودن جلسه</Text>
                </Pressable>
              ) : null}
              <Pressable style={styles.refreshButton} onPress={() => void refresh()}>
                <Text style={styles.refreshButtonText}>تازه‌سازی</Text>
              </Pressable>
              <Pressable style={styles.logoutButton} onPress={() => void logout()}>
                <Text style={styles.logoutButtonText}>خروج</Text>
              </Pressable>
            </View>
          </View>

          {isLoading ? (
            <View style={styles.loaderWrap}>
              <ActivityIndicator size="large" color={colors.accent} />
            </View>
          ) : null}

          {activeSection === 'upcoming' && hasUpcomingList ? (
            <FlatList
              data={meetings}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              renderItem={renderUpcomingMeeting}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              onRefresh={() => void refresh()}
              refreshing={isRefreshing}
              showsVerticalScrollIndicator={false}
            />
          ) : null}

          {activeSection === 'past' && hasPastList ? (
            <FlatList
              data={pastMeetings}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              renderItem={renderPastMeeting}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              onRefresh={() => void refresh()}
              refreshing={isRefreshing}
              showsVerticalScrollIndicator={false}
            />
          ) : null}

          {!isLoading && activeSection === 'upcoming' && !hasUpcomingList ? upcomingEmptyState : null}
          {!isLoading && activeSection === 'past' && !hasPastList ? pastEmptyState : null}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  wrapper: {
    flex: 1,
  },
  centeredContainer: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 16,
  },
  headerCard: {
    marginTop: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    backgroundColor: colors.surface,
    padding: 18,
    gap: 10,
  },
  headerCardSmall: {
    padding: 14,
    gap: 8,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  headerTextWrap: {
    flex: 1,
    gap: 2,
  },
  counterChip: {
    minWidth: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  counterChipText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: typography.bold,
  },
  kicker: {
    fontSize: 11,
    color: colors.accentDark,
    fontFamily: typography.bold,
    letterSpacing: 0.9,
  },
  title: {
    fontSize: 26,
    fontFamily: typography.bold,
    color: colors.textPrimary,
  },
  titleSmall: {
    fontSize: 22,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    fontFamily: typography.regular,
  },
  sectionTabs: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundAccent,
    borderRadius: 12,
    padding: 3,
    gap: 3,
  },
  sectionTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 10,
    paddingVertical: 10,
  },
  sectionTabActive: {
    backgroundColor: colors.surface,
    shadowColor: colors.shadow,
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  sectionTabDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textSecondary,
  },
  sectionTabDotActive: {
    backgroundColor: colors.accent,
  },
  sectionTabDotPast: {
    backgroundColor: colors.textSecondary,
  },
  sectionTabText: {
    fontSize: 13,
    fontFamily: typography.bold,
    color: colors.textSecondary,
  },
  sectionTabTextActive: {
    color: colors.textPrimary,
  },
  guide: {
    backgroundColor: colors.accentSoft,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  guideSmall: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  guideText: {
    fontSize: 12,
    color: colors.accentDark,
    lineHeight: 18,
    fontFamily: typography.regular,
  },
  headerActions: {
    flexDirection: 'row-reverse',
    gap: 8,
    flexWrap: 'wrap',
  },
  addButton: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontFamily: typography.bold,
    fontSize: 14,
  },
  refreshButton: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  refreshButtonText: {
    color: colors.textPrimary,
    fontFamily: typography.bold,
    fontSize: 14,
  },
  logoutButton: {
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  logoutButtonText: {
    color: colors.danger,
    fontFamily: typography.bold,
    fontSize: 14,
  },
  loaderWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingTop: 4,
    paddingBottom: 40,
  },
  separator: {
    height: 10,
  },
  stateActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  primaryActionButton: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 44,
    justifyContent: 'center',
    flex: 1,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontFamily: typography.bold,
    fontSize: 14,
    textAlign: 'center',
  },
  secondaryActionButton: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 44,
    justifyContent: 'center',
    flex: 1,
  },
  secondaryActionText: {
    color: colors.textPrimary,
    fontFamily: typography.bold,
    fontSize: 14,
    textAlign: 'center',
  },
});
