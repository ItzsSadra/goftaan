// Recording screen - audio recording and playback for meetings
import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AudioPlayer } from 'expo-audio';

import type { AppStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { formatDuration, formatMeetingTime } from '../../utils/date';
import { useAudioRecorder } from '../../features/recording/hooks/useAudioRecorder';
import { 
  useCrossPlatformAudioPlayer, 
  useCrossPlatformAudioPlayerStatus,
  type CrossPlatformAudioPlayer 
} from '../../features/recording/hooks/useCrossPlatformAudioPlayer';
import type { RecordingStatus } from '../../features/recording/models/recording';
import { aiService } from '../../features/ai/services/aiService';

type Props = NativeStackScreenProps<AppStackParamList, 'Recording'>;

const { width } = Dimensions.get('window');
const isDesktop = width > 768;
const CONTAINER_MAX_WIDTH = 800;
const CONTAINER_WIDTH = isDesktop ? CONTAINER_MAX_WIDTH : '100%';

const canStop = (status: RecordingStatus): boolean => status === 'recording' || status === 'paused';

export const RecordingScreen = ({ route, navigation }: Props) => {
  const { meeting } = route.params;
  const { status, durationMs, result, errorMessage, interruptionMessage, start, pause, resume, stop, reset } =
    useAudioRecorder(meeting.id);
  
  const player = useCrossPlatformAudioPlayer(result?.localUri ?? null, { updateInterval: 250 });
  const playbackStatus = useCrossPlatformAudioPlayerStatus(player);
  const playbackCurrentMs = Math.floor(playbackStatus.currentTime * 1000);
  const playbackDurationMs = Math.floor(playbackStatus.duration * 1000);
  const isPlaying = playbackStatus.playing && playbackStatus.isLoaded;
  
  const [aiProcessing, setAiProcessing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiDone, setAiDone] = useState(false);

  const handleAiProcess = async () => {
    if (!result?.localUri) return;
    setAiProcessing(true);
    setAiError(null);
    try {
      await aiService.processRecording(result.localUri, meeting.id);
      setAiDone(true);
    } catch (error) {
      setAiError(error instanceof Error ? error.message : 'پردازش هوش مصنوعی انجام نشد.');
    } finally {
      setAiProcessing(false);
    }
  };

  const stateLabel: Record<RecordingStatus, string> = {
    idle: 'آماده',
    requestingPermission: 'در حال گرفتن مجوز',
    permissionDenied: 'بدون دسترسی',
    recording: 'در حال ضبط',
    paused: 'مکث شده',
    stopping: 'در حال ذخیره',
    completed: 'ذخیره شد',
    error: 'خطا',
  };

  const guidanceText = (): string => {
    switch (status) {
      case 'idle':
        return 'دکمه "شروع ضبط" را بزنید تا صدای جلسه ضبط شود.';
      case 'requestingPermission':
        return 'لطفا دسترسی میکروفون را تأیید کنید.';
      case 'permissionDenied':
        return 'برای ضبط صدا باید دسترسی میکروفون را در تنظیمات دستگاه فعال کنید.';
      case 'recording':
        return 'در حال ضبط هستید. می‌توانید با دکمه مکث، ضبط را موقتا متوقف کنید.';
      case 'paused':
        return 'ضبط متوقف شده. برای ادامه دکمه "ادامه" یا برای پایان "پایان" را بزنید.';
      case 'stopping':
        return 'در حال ذخیره‌سازی فایل ضبط شده...';
      case 'completed':
        return 'ضبط با موفقیت ذخیره شد. می‌توانید گوش دهید یا دوباره ضبط کنید.';
      case 'error':
        return 'خطایی رخ داد. دکمه "شروع ضبط" را برای تلاش مجدد بزنید.';
    }
  };

  // Helper to handle player actions for both web and native
  const handlePlayPause = async () => {
    if (!playbackStatus.isLoaded) return;
    
    if (isPlaying) {
      // For native (AudioPlayer) or web (CrossPlatformAudioPlayer)
      if ('pause' in player) {
        player.pause();
      }
    } else {
      // For native (AudioPlayer) or web (CrossPlatformAudioPlayer)
      if ('play' in player) {
        await player.play();
      }
    }
  };

  const handleReplay = async () => {
    if (!playbackStatus.isLoaded) return;
    
    try {
      if ('seekTo' in player) {
        await player.seekTo(0);
        await player.play();
      }
    } catch {
      // Ignore replay failures
    }
  };

  useEffect(() => {
    if (status === 'completed' && result?.localUri) {
      return;
    }

    try {
      if ('pause' in player) {
        player.pause();
      }
    } catch {
      // Ignore player pause errors during source transitions.
    }
  }, [player, result?.localUri, status]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.centeredContainer}>
          <View style={styles.heroCard}>
            <Text style={styles.heroKicker}>استودیو ضبط</Text>
            <Text style={styles.title}>{meeting.title}</Text>
            <Text style={styles.meta}>{formatMeetingTime(meeting.startDateISO, meeting.endDateISO)}</Text>
          </View>

          <View style={styles.timerCard}>
            <Text style={styles.timerLabel}>مدت ضبط</Text>
            <Text style={styles.timerValue}>{formatDuration(durationMs)}</Text>
            <Text style={styles.stateText}>وضعیت: {stateLabel[status]}</Text>
          </View>

          <View style={styles.guidanceCard}>
            <Text style={styles.guidanceText}>{guidanceText()}</Text>
          </View>

          {status === 'permissionDenied' ? (
            <View style={styles.messageCard}>
              <Text style={styles.errorText}>دسترسی میکروفون لازم است.</Text>
              <Pressable style={styles.secondaryButton} onPress={() => void Linking.openSettings()}>
                <Text style={styles.secondaryButtonText}>باز کردن تنظیمات</Text>
              </Pressable>
            </View>
          ) : null}

          {interruptionMessage ? (
            <View style={styles.messageCard}>
              <Text style={styles.warningText}>{interruptionMessage}</Text>
            </View>
          ) : null}

          {errorMessage ? (
            <View style={styles.messageCard}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {status === 'completed' && result ? (
            <View style={styles.messageCard}>
              <Text style={styles.successTitle}>ضبط ذخیره شد</Text>
              <Text style={styles.uriText}>{result.localUri}</Text>
              <Text style={styles.successMeta}>مدت: {formatDuration(result.durationMs)}</Text>
              <View style={styles.playbackMetaRow}>
                <Text style={styles.playbackMetaLabel}>پخش</Text>
                <Text style={styles.playbackMetaValue}>
                  {playbackStatus.isLoaded 
                    ? `${formatDuration(playbackCurrentMs)} / ${formatDuration(playbackDurationMs)}`
                    : 'در حال بارگذاری...'}
                </Text>
              </View>
              <View style={styles.row}>
                <Pressable
                  style={[styles.secondaryButton, !playbackStatus.isLoaded && styles.disabledButton]}
                  onPress={handlePlayPause}
                  disabled={!playbackStatus.isLoaded}
                >
                  <Text style={styles.secondaryButtonText}>
                    {!playbackStatus.isLoaded 
                      ? 'بارگذاری...' 
                      : isPlaying 
                        ? 'مکث پخش' 
                        : 'پخش ضبط'}
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.secondaryButton, !playbackStatus.isLoaded && styles.disabledButton]}
                  onPress={handleReplay}
                  disabled={!playbackStatus.isLoaded}
                >
                  <Text style={styles.secondaryButtonText}>پخش دوباره</Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          <View style={styles.controls}>
            {status === 'idle' ||
            status === 'permissionDenied' ||
            status === 'error' ||
            status === 'requestingPermission' ? (
              <Pressable
                style={[styles.primaryButton, status === 'requestingPermission' ? styles.disabledButton : null]}
                onPress={() => void start()}
                disabled={status === 'requestingPermission'}
              >
                <Text style={styles.primaryButtonText}>
                  {status === 'requestingPermission' ? 'در حال دریافت مجوز...' : 'شروع ضبط'}
                </Text>
              </Pressable>
            ) : null}

            {status === 'recording' ? (
              <View style={styles.row}>
                <Pressable style={styles.secondaryButton} onPress={() => void pause()}>
                  <Text style={styles.secondaryButtonText}>مکث</Text>
                </Pressable>
                <Pressable style={styles.dangerButton} onPress={() => void stop()}>
                  <Text style={styles.dangerButtonText}>پایان</Text>
                </Pressable>
              </View>
            ) : null}

            {status === 'paused' ? (
              <View style={styles.row}>
                <Pressable style={styles.primaryButton} onPress={() => void resume()}>
                  <Text style={styles.primaryButtonText}>ادامه</Text>
                </Pressable>
                <Pressable style={styles.dangerButton} onPress={() => void stop()}>
                  <Text style={styles.dangerButtonText}>پایان</Text>
                </Pressable>
              </View>
            ) : null}

            {status === 'completed' ? (
              <View style={styles.row}>
                <Pressable style={styles.secondaryButton} onPress={reset}>
                  <Text style={styles.secondaryButtonText}>ضبط دوباره</Text>
                </Pressable>
                <Pressable style={styles.primaryButton} onPress={() => navigation.goBack()}>
                  <Text style={styles.primaryButtonText}>بازگشت به جلسه</Text>
                </Pressable>
              </View>
            ) : null}

            {status === 'completed' && !aiDone ? (
              <Pressable
                style={[styles.aiButton, aiProcessing ? styles.disabledButton : null]}
                onPress={handleAiProcess}
                disabled={aiProcessing}
              >
                {aiProcessing ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.aiButtonText}>دریافت متن و خلاصه با هوش مصنوعی</Text>
                )}
              </Pressable>
            ) : null}

            {aiProcessing ? (
              <View style={styles.aiStatusCard}>
                <ActivityIndicator size="small" color={colors.accentDark} />
                <Text style={styles.aiStatusText}>در حال پردازش صدا و تولید خلاصه. ممکن است این فرایند مقداری طول بکشد</Text>
              </View>
            ) : null}

            {aiError ? (
              <View style={styles.messageCard}>
                <Text style={styles.errorText}>{aiError}</Text>
              </View>
            ) : null}

            {aiDone ? (
              <View style={styles.aiDoneCard}>
                <Text style={styles.aiDoneTitle}>متن و خلاصه آماده شد</Text>
                <Text style={styles.aiDoneText}>برای مشاهده به صفحه جزئیات جلسه بروید.</Text>
                <Pressable style={styles.primaryButton} onPress={() => navigation.goBack()}>
                  <Text style={styles.primaryButtonText}>مشاهده در جلسه</Text>
                </Pressable>
              </View>
            ) : null}

            {status === 'stopping' ? <Text style={styles.helperText}>در حال ذخیره ضبط...</Text> : null}
            {!canStop(status) && status === 'requestingPermission' ? (
              <Text style={styles.helperText}>در حال درخواست دسترسی میکروفون...</Text>
            ) : null}
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
    padding: isDesktop ? 24 : 20,
    gap: 14,
  },
  heroCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 16,
    gap: 6,
    backgroundColor: colors.surfaceElevated,
  },
  heroKicker: {
    fontSize: 11,
    color: colors.accentDark,
    letterSpacing: 0.9,
    fontFamily: typography.bold,
  },
  title: {
    fontSize: 26,
    fontFamily: typography.bold,
    color: colors.textPrimary,
  },
  meta: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: typography.regular,
  },
  timerCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    backgroundColor: colors.surfaceElevated,
    padding: isDesktop ? 24 : 18,
    gap: 8,
  },
  timerLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: typography.regular,
  },
  timerValue: {
    fontSize: isDesktop ? 48 : 38,
    fontFamily: typography.bold,
    color: colors.textPrimary,
  },
  stateText: {
    fontSize: 14,
    color: colors.accentDark,
    fontFamily: typography.bold,
  },
  guidanceCard: {
    borderWidth: 1,
    borderColor: '#BFD9D6',
    borderRadius: 14,
    backgroundColor: colors.accentSoft,
    padding: 12,
  },
  guidanceText: {
    fontSize: 13,
    color: colors.accentDark,
    lineHeight: 20,
    fontFamily: typography.regular,
    textAlign: 'center',
  },
  messageCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.surfaceElevated,
    padding: isDesktop ? 18 : 14,
    gap: 10,
  },
  warningText: {
    color: '#935D00',
    fontSize: 14,
    lineHeight: 20,
    fontFamily: typography.regular,
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: typography.regular,
  },
  successTitle: {
    fontSize: 16,
    fontFamily: typography.bold,
    color: colors.textPrimary,
  },
  successMeta: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: typography.regular,
  },
  playbackMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  playbackMetaLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: typography.bold,
  },
  playbackMetaValue: {
    fontSize: 13,
    color: colors.textPrimary,
    fontFamily: typography.bold,
  },
  uriText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: typography.regular,
  },
  controls: {
    marginTop: 18,
    paddingBottom: 10,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: colors.accentDark,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: isDesktop ? 16 : 13,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'android' ? undefined : typography.bold,
    fontWeight: Platform.OS === 'android' ? '700' : 'normal',
    fontSize: isDesktop ? 16 : 15,
    lineHeight: 20,
    textAlign: 'center',
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: isDesktop ? 16 : 13,
    backgroundColor: '#F8F4EB',
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: colors.textPrimary,
    fontFamily: Platform.OS === 'android' ? undefined : typography.bold,
    fontWeight: Platform.OS === 'android' ? '700' : 'normal',
    fontSize: isDesktop ? 16 : 15,
  },
  dangerButton: {
    flex: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: isDesktop ? 16 : 13,
    backgroundColor: colors.danger,
    alignItems: 'center',
  },
  dangerButtonText: {
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'android' ? undefined : typography.bold,
    fontWeight: Platform.OS === 'android' ? '700' : 'normal',
    fontSize: isDesktop ? 16 : 15,
  },
  disabledButton: {
    opacity: 0.6,
  },
  helperText: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: typography.regular,
  },
  aiButton: {
    backgroundColor: '#2E7D4A',
    borderRadius: 14,
    paddingVertical: isDesktop ? 16 : 13,
    alignItems: 'center',
  },
  aiButtonText: {
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'android' ? undefined : typography.bold,
    fontWeight: Platform.OS === 'android' ? '700' : 'normal',
    fontSize: isDesktop ? 16 : 15,
  },
  aiStatusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#BFD9D6',
    borderRadius: 14,
    backgroundColor: colors.accentSoft,
    padding: 14,
  },
  aiStatusText: {
    fontSize: 14,
    color: colors.accentDark,
    fontFamily: typography.regular,
  },
  aiDoneCard: {
    borderWidth: 1,
    borderColor: '#BFD9D6',
    borderRadius: 14,
    backgroundColor: '#DCFCE7',
    padding: 16,
    gap: 8,
    alignItems: 'center',
  },
  aiDoneTitle: {
    fontSize: 16,
    fontFamily: typography.bold,
    color: '#1F2520',
  },
  aiDoneText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: typography.regular,
    textAlign: 'center',
  },
});