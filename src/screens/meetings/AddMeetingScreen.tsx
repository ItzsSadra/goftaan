import { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { AppStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { useAuth } from '../../features/auth/context/AuthContext';
import { settingsService } from '../../features/settings/services/settingsService';
import { manualMeetingsService } from '../../features/meetings/services/manualMeetingsService';

type Props = NativeStackScreenProps<AppStackParamList, 'AddMeeting'>;

const pad = (value: number): string => String(value).padStart(2, '0');

const buildDefaults = () => {
  const now = new Date();
  const start = new Date(now.getTime() + 30 * 60 * 1000);
  return {
    dateText: `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`,
    timeText: `${pad(start.getHours())}:${pad(start.getMinutes())}`,
  };
};

const parseLocalDateTime = (dateText: string, timeText: string): Date | null => {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateText.trim());
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(timeText.trim());
  if (!dateMatch || !timeMatch) return null;
  const year = Number(dateMatch[1]);
  const month = Number(dateMatch[2]);
  const day = Number(dateMatch[3]);
  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);
  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59) return null;
  const date = new Date(year, month - 1, day, hour, minute, 0, 0);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day || date.getHours() !== hour || date.getMinutes() !== minute) return null;
  return date;
};

export const AddMeetingScreen = ({ navigation }: Props) => {
  const { user } = useAuth();
  const defaults = useMemo(buildDefaults, []);
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [dateText, setDateText] = useState(defaults.dateText);
  const [timeText, setTimeText] = useState(defaults.timeText);
  const [durationText, setDurationText] = useState('45');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { width } = useWindowDimensions();
  const isDesktop = width > 768;
  const isSmall = width < 380;
  const CONTAINER_MAX_WIDTH = 800;

  useEffect(() => {
    const loadDefaultDuration = async () => {
      const appSettings = await settingsService.getAppSettings();
      setDurationText(String(appSettings.defaultMeetingDurationMinutes));
    };
    void loadDefaultDuration();
  }, []);

  const onSave = async () => {
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setError('عنوان جلسه الزامی است.');
      return;
    }
    const start = parseLocalDateTime(dateText, timeText);
    if (!start) {
      setError('تاریخ و ساعت معتبر نیست. قالب باید YYYY-MM-DD و HH:mm باشد.');
      return;
    }
    if (start.getTime() < Date.now() - 60 * 1000) {
      setError('زمان شروع باید اکنون یا در آینده باشد.');
      return;
    }
    const duration = Number(durationText);
    if (!Number.isFinite(duration) || duration < 5 || duration > 600) {
      setError('مدت جلسه باید بین ۵ تا ۶۰۰ دقیقه باشد.');
      return;
    }
    const end = new Date(start.getTime() + duration * 60 * 1000);
    try {
      if (!user) {
        setError('کاربر وارد نشده است.');
        return;
      }
      setIsSaving(true);
      setError(null);
      await manualMeetingsService.addMeeting({
        userId: user.id,
        title: cleanTitle,
        location,
        notes,
        startDateISO: start.toISOString(),
        endDateISO: end.toISOString(),
      });
      navigation.goBack();
    } catch {
      setError('ذخیره جلسه انجام نشد. دوباره تلاش کنید.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={10}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.centeredContainer, { maxWidth: CONTAINER_MAX_WIDTH }]}>
            <View style={[styles.heroCard, isSmall && styles.heroCardSmall]}>
              <Text style={styles.heroKicker}>جلسه جدید</Text>
              <Text style={[styles.title, isSmall && styles.titleSmall]}>افزودن جلسه</Text>
              <Text style={styles.subtitle}>یک جلسه دستی برای ضبط و پیاده‌سازی بسازید.</Text>
              <View style={styles.tip}>
                <Text style={styles.tipText}>جلسه‌هایی که در تقویم گوشی شما نیستند را اینجا اضافه کنید.</Text>
              </View>
            </View>

            <View style={[styles.formCard, isSmall && styles.formCardSmall]}>
              <Text style={styles.label}>عنوان</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="جلسه هفتگی"
                placeholderTextColor={colors.textSecondary}
                style={styles.input}
              />

              <Text style={styles.label}>محل (اختیاری)</Text>
              <TextInput
                value={location}
                onChangeText={setLocation}
                placeholder="اتاق جلسه یا لینک تماس"
                placeholderTextColor={colors.textSecondary}
                style={styles.input}
              />

              <View style={styles.row}>
                <View style={styles.halfField}>
                  <Text style={styles.label}>تاریخ</Text>
                  <TextInput
                    value={dateText}
                    onChangeText={setDateText}
                    autoCapitalize="none"
                    keyboardType="numbers-and-punctuation"
                    style={[styles.input, styles.inputLtr]}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
                <View style={styles.halfField}>
                  <Text style={styles.label}>ساعت</Text>
                  <TextInput
                    value={timeText}
                    onChangeText={setTimeText}
                    autoCapitalize="none"
                    keyboardType="numbers-and-punctuation"
                    style={[styles.input, styles.inputLtr]}
                    placeholder="HH:mm"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
              </View>

              <Text style={styles.label}>مدت (دقیقه)</Text>
              <TextInput
                value={durationText}
                onChangeText={setDurationText}
                keyboardType="number-pad"
                style={[styles.input, styles.inputLtr]}
              />

              <Text style={styles.label}>یادداشت‌ها (اختیاری)</Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="دستور جلسه یا توضیحات"
                placeholderTextColor={colors.textSecondary}
                style={[styles.input, styles.notesInput]}
                multiline
              />
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.actions}>
              <Pressable style={styles.secondaryButton} onPress={() => navigation.goBack()}>
                <Text style={styles.secondaryButtonText}>انصراف</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.primaryButton,
                  isSaving ? styles.buttonDisabled : null,
                  pressed && !isSaving ? styles.buttonPressed : null,
                ]}
                onPress={() => void onSave()}
                disabled={isSaving}
              >
                <Text style={styles.primaryButtonText}>
                  {isSaving ? 'در حال ذخیره...' : 'ذخیره جلسه'}
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
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
  heroCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    backgroundColor: colors.surface,
    padding: 18,
    gap: 6,
  },
  heroCardSmall: {
    padding: 14,
  },
  heroKicker: {
    fontSize: 11,
    fontFamily: typography.bold,
    letterSpacing: 0.9,
    color: colors.accentDark,
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
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: typography.regular,
  },
  tip: {
    backgroundColor: colors.accentSoft,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 2,
  },
  tipText: {
    fontSize: 12,
    color: colors.accentDark,
    lineHeight: 18,
    fontFamily: typography.regular,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 18,
    gap: 10,
  },
  formCardSmall: {
    padding: 14,
    gap: 8,
  },
  label: {
    color: colors.textPrimary,
    fontSize: 13,
    fontFamily: typography.bold,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.textPrimary,
    backgroundColor: colors.background,
    fontFamily: typography.regular,
    textAlign: 'right',
    minHeight: 48,
  },
  inputLtr: {
    textAlign: 'left',
    writingDirection: 'ltr',
  },
  notesInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  halfField: {
    flex: 1,
    gap: 6,
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
    fontSize: 13,
    fontFamily: typography.regular,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontFamily: typography.bold,
    fontSize: 15,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 14,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: colors.textPrimary,
    fontFamily: typography.bold,
    fontSize: 15,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonPressed: {
    opacity: 0.9,
  },
});
