import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../../features/auth/context/AuthContext';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import type { SettingsState } from '../../features/settings/models/settings';
import { settingsService } from '../../features/settings/services/settingsService';

const PRE_MEETING_MINUTES = [5, 10, 15, 30];
const DEFAULT_DURATION_OPTIONS = [30, 45, 60, 90];

export const SettingsScreen = () => {
  const { user, updateUserProfile, updateUserPassword, deleteUserAccount, logout } = useAuth();
  const [settings, setSettings] = useState<SettingsState | null>(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const { width } = useWindowDimensions();
  const isDesktop = width > 768;
  const isSmall = width < 380;
  const CONTAINER_MAX_WIDTH = 800;

  useEffect(() => {
    const load = async () => {
      const current = await settingsService.getSettings();
      setSettings(current);
      setProfileName(user?.name || '');
      setProfileEmail(user?.email || '');
    };
    void load();
  }, [user?.email, user?.name]);

  const saveSettings = async (next: SettingsState) => {
    setSettings(next);
    setIsSavingSettings(true);
    try {
      await settingsService.saveSettings(next);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const onSaveProfile = async () => {
    if (!profileName.trim() || !profileEmail.trim()) {
      Alert.alert('خطا', 'نام و ایمیل را کامل وارد کنید.');
      return;
    }
    try {
      setIsSavingProfile(true);
      await updateUserProfile(profileName, profileEmail);
      Alert.alert('انجام شد', 'اطلاعات حساب به‌روزرسانی شد.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'به‌روزرسانی حساب انجام نشد.';
      Alert.alert('خطا', message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const onChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      Alert.alert('خطا', 'رمز فعلی و جدید را وارد کنید.');
      return;
    }
    if (newPassword.length < 4) {
      Alert.alert('خطا', 'رمز جدید باید حداقل ۴ کاراکتر باشد.');
      return;
    }
    try {
      setIsSavingPassword(true);
      await updateUserPassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      Alert.alert('انجام شد', 'رمز عبور تغییر کرد.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'تغییر رمز عبور انجام نشد.';
      Alert.alert('خطا', message);
    } finally {
      setIsSavingPassword(false);
    }
  };

  const onDeleteAccount = () => {
    Alert.alert('حذف حساب', 'همه داده‌های حساب حذف می‌شود. مطمئن هستید؟', [
      { text: 'انصراف', style: 'cancel' },
      {
        text: 'حذف دائمی',
        style: 'destructive',
        onPress: () => {
          const remove = async () => {
            try {
              await deleteUserAccount();
            } catch (error) {
              const message = error instanceof Error ? error.message : 'حذف حساب انجام نشد.';
              Alert.alert('خطا', message);
            }
          };
          void remove();
        },
      },
    ]);
  };

  const savingLabel = useMemo(() => {
    if (isSavingSettings) return 'در حال ذخیره تنظیمات...';
    if (isSavingProfile) return 'در حال ذخیره حساب...';
    if (isSavingPassword) return 'در حال تغییر رمز عبور...';
    return '';
  }, [isSavingPassword, isSavingProfile, isSavingSettings]);

  if (!settings) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={colors.accentDark} />
        </View>
      </SafeAreaView>
    );
  }

  const SettingRow = ({ title, subtitle, value, onValueChange }: {
    title: string;
    subtitle: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
  }) => (
    <View style={[styles.row, isSmall && styles.rowSmall]}>
      <View style={styles.rowTextWrap}>
        <Text style={[styles.rowTitle, isSmall && styles.rowTitleSmall]}>{title}</Text>
        <Text style={[styles.rowSubtitle, isSmall && styles.rowSubtitleSmall]}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        thumbColor={colors.surface}
        trackColor={{ false: '#D1D5DB', true: colors.accentSoft }}

      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.centeredContainer, { maxWidth: CONTAINER_MAX_WIDTH }]}>
          <View style={[styles.heroCard, isSmall && styles.heroCardSmall]}>
            <Text style={styles.kicker}>مرکز کنترل</Text>
            <Text style={[styles.title, isSmall && styles.titleSmall]}>تنظیمات</Text>
            <Text style={styles.subtitle}>مدیریت حساب، رفتار برنامه و اعلان‌ها</Text>
          </View>

          <View style={[styles.card, isSmall && styles.cardSmall]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>👤 حساب کاربری</Text>
            </View>
            <Text style={styles.sectionDescription}>نام و ایمیل خود را مدیریت کنید.</Text>
            <Text style={styles.label}>نام</Text>
            <TextInput
              style={styles.input}
              value={profileName}
              onChangeText={setProfileName}
              autoCapitalize="words"
              placeholder="نام"
              placeholderTextColor={colors.textSecondary}
            />
            <Text style={styles.label}>ایمیل</Text>
            <TextInput
              style={styles.input}
              value={profileEmail}
              onChangeText={setProfileEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="you@example.com"
              placeholderTextColor={colors.textSecondary}
            />
            <Pressable
              style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
              onPress={() => void onSaveProfile()}
              disabled={isSavingProfile}
            >
              <Text style={styles.primaryButtonText}>ذخیره حساب</Text>
            </Pressable>
          </View>

          <View style={[styles.card, isSmall && styles.cardSmall]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🔒 امنیت</Text>
            </View>
            <Text style={styles.sectionDescription}>برای تغییر رمز عبور، رمز فعلی و جدید را وارد کنید.</Text>
            <Text style={styles.label}>رمز عبور فعلی</Text>
            <TextInput
              style={styles.input}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              placeholder="رمز فعلی"
              placeholderTextColor={colors.textSecondary}
            />
            <Text style={styles.label}>رمز عبور جدید</Text>
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              placeholder="رمز جدید"
              placeholderTextColor={colors.textSecondary}
            />
            <Pressable
              style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
              onPress={() => void onChangePassword()}
              disabled={isSavingPassword}
            >
              <Text style={styles.primaryButtonText}>تغییر رمز عبور</Text>
            </Pressable>
          </View>

          <View style={[styles.card, isSmall && styles.cardSmall]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>⚙️ اپلیکیشن</Text>
            </View>
            <SettingRow
              title="تازه‌سازی خودکار"
              subtitle="هنگام ورود به صفحه جلسه‌ها خودکار رفرش شود"
              value={settings.app.autoRefreshMeetings}
              onValueChange={(value) => void saveSettings({ ...settings, app: { ...settings.app, autoRefreshMeetings: value } })}
            />
            <View style={styles.divider} />
            <SettingRow
              title="کارت‌های فشرده"
              subtitle="چیدمان کم‌فاصله‌تر برای لیست جلسه‌ها"
              value={settings.app.compactCards}
              onValueChange={(value) => void saveSettings({ ...settings, app: { ...settings.app, compactCards: value } })}
            />
            <View style={styles.divider} />
            <SettingRow
              title="تحلیل فقط اقدام معوق"
              subtitle="داشبورد تحلیل فقط جلسه‌های دارای اقدام معوق را نشان دهد"
              value={settings.app.analyticsShowOverdueOnly}
              onValueChange={(value) => void saveSettings({ ...settings, app: { ...settings.app, analyticsShowOverdueOnly: value } })}
            />

            <Text style={[styles.sectionLabel, isSmall && styles.sectionLabelSmall]}>مدت پیش‌فرض جلسه جدید</Text>
            <View style={styles.chipsRow}>
              {DEFAULT_DURATION_OPTIONS.map((duration) => {
                const selected = settings.app.defaultMeetingDurationMinutes === duration;
                return (
                  <Pressable
                    key={duration}
                    style={[styles.chip, selected ? styles.chipActive : null]}
                    onPress={() => void saveSettings({ ...settings, app: { ...settings.app, defaultMeetingDurationMinutes: duration } })}
                  >
                    <Text style={[styles.chipText, selected ? styles.chipTextActive : null]}>{duration}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={[styles.card, isSmall && styles.cardSmall]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🔔 اعلان‌ها و یادآورها</Text>
            </View>
            <SettingRow
              title="یادآوری قبل از جلسه"
              subtitle="برای جلسه‌های آینده اعلان زمان‌بندی شود"
              value={settings.reminders.preMeetingEnabled}
              onValueChange={(value) => void saveSettings({ ...settings, reminders: { ...settings.reminders, preMeetingEnabled: value } })}
            />

            <Text style={[styles.sectionLabel, isSmall && styles.sectionLabelSmall]}>زمان یادآوری</Text>
            <View style={styles.chipsRow}>
              {PRE_MEETING_MINUTES.map((minute) => {
                const selected = settings.reminders.preMeetingMinutes === minute;
                return (
                  <Pressable
                    key={minute}
                    style={[styles.chip, selected ? styles.chipActive : null]}
                    onPress={() => void saveSettings({ ...settings, reminders: { ...settings.reminders, preMeetingMinutes: minute } })}
                  >
                    <Text style={[styles.chipText, selected ? styles.chipTextActive : null]}>{minute}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.divider} />
            <SettingRow
              title="اعلان آماده شدن خلاصه"
              subtitle="وقتی خلاصه جدید ثبت شود به شما اطلاع می‌دهد"
              value={settings.reminders.summaryReadyEnabled}
              onValueChange={(value) => void saveSettings({ ...settings, reminders: { ...settings.reminders, summaryReadyEnabled: value } })}
            />
            <View style={styles.divider} />
            <SettingRow
              title="هشدار اقدام‌های معوق"
              subtitle="روزانه اقدام‌های عقب‌افتاده را یادآوری می‌کند"
              value={settings.reminders.overdueActionsEnabled}
              onValueChange={(value) => void saveSettings({ ...settings, reminders: { ...settings.reminders, overdueActionsEnabled: value } })}
            />
          </View>

          <View style={[styles.card, styles.dangerCard, isSmall && styles.cardSmall]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.danger }]}>⚠️ خروج و حذف حساب</Text>
            </View>
            <Pressable
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
              onPress={() => void logout()}
            >
              <Text style={styles.secondaryButtonText}>خروج از حساب</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.dangerButton, pressed && styles.buttonPressed]}
              onPress={onDeleteAccount}
            >
              <Text style={styles.dangerButtonText}>حذف دائمی حساب</Text>
            </Pressable>
          </View>

          {savingLabel ? <Text style={styles.savingText}>{savingLabel}</Text> : null}
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
    justifyContent: 'center',
    alignItems: 'center',
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
    paddingBottom: 30,
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
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    backgroundColor: colors.surface,
    padding: 18,
    gap: 12,
  },
  cardSmall: {
    padding: 14,
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 17,
    color: colors.textPrimary,
    fontFamily: typography.bold,
  },
  sectionDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: typography.regular,
    lineHeight: 18,
  },
  sectionLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: typography.bold,
    marginTop: 4,
  },
  sectionLabelSmall: {
    fontSize: 12,
  },
  label: {
    fontSize: 13,
    color: colors.textPrimary,
    fontFamily: typography.bold,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.textPrimary,
    backgroundColor: colors.background,
    fontFamily: typography.regular,
    fontSize: 15,
    textAlign: 'left',
    minHeight: 48,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowSmall: {
    gap: 8,
  },
  rowTextWrap: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontSize: 15,
    color: colors.textPrimary,
    fontFamily: typography.bold,
  },
  rowTitleSmall: {
    fontSize: 14,
  },
  rowSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    fontFamily: typography.regular,
  },
  rowSubtitleSmall: {
    fontSize: 12,
    lineHeight: 16,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  chipsRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.background,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 48,
    alignItems: 'center',
  },
  chipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  chipText: {
    color: colors.textPrimary,
    fontFamily: typography.bold,
    fontSize: 13,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  primaryButton: {
    marginTop: 2,
    backgroundColor: colors.accentDark,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: typography.bold,
  },
  secondaryButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontFamily: typography.bold,
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
    minHeight: 48,
    justifyContent: 'center',
  },
  dangerButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: typography.bold,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  savingText: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontFamily: typography.regular,
    fontSize: 13,
  },
});
