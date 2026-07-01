import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { AppStackParamList } from '../../navigation/types';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { formatDuration, formatMeetingTime } from '../../utils/date';
import { useAudioRecorder } from '../../features/recording/hooks/useAudioRecorder';
import {
  useCrossPlatformAudioPlayer,
  useCrossPlatformAudioPlayerStatus,
} from '../../features/recording/hooks/useCrossPlatformAudioPlayer';
import type { RecordingStatus } from '../../features/recording/models/recording';
import { aiService, type AiProcessingStep, AI_STEP_LABELS } from '../../features/ai/services/aiService';
import { useWebSpeechRecognition } from '../../features/recording/hooks/useWebSpeechRecognition';

type Props = NativeStackScreenProps<AppStackParamList, 'Recording'>;

const isWeb = Platform.OS === 'web';

const canStop = (status: RecordingStatus): boolean => status === 'recording' || status === 'paused';

export const RecordingScreen = ({ route, navigation }: Props) => {
  const { meeting } = route.params;
  const { status, durationMs, result, errorMessage, interruptionMessage, start: startRec, pause, resume, stop: stopRec, reset } =
    useAudioRecorder(meeting.id);

  const speech = useWebSpeechRecognition('fa-IR');
  const player = useCrossPlatformAudioPlayer(result?.localUri ?? null, { updateInterval: 250 });
  const playbackStatus = useCrossPlatformAudioPlayerStatus(player);
  const playbackCurrentMs = Math.floor(playbackStatus.currentTime * 1000);
  const playbackDurationMs = Math.floor(playbackStatus.duration * 1000);
  const isPlaying = playbackStatus.playing && playbackStatus.isLoaded;

  const [aiStep, setAiStep] = useState<AiProcessingStep>('idle');
  const [aiError, setAiError] = useState<string | null>(null);

  const { width } = useWindowDimensions();
  const isDesktop = width > 768;
  const isSmall = width < 380;
  const CONTAINER_MAX_WIDTH = 800;

  const start = useCallback(async () => {
    if (isWeb) {
      speech.reset();
      await speech.start();
    }
    await startRec();
  }, [startRec, speech]);

  const stop = useCallback(async () => {
    if (isWeb) await speech.stop();
    await stopRec();
  }, [stopRec, speech]);

  const handleAiProcess = async () => {
    setAiError(null);
    if (isWeb && speech.transcript) {
      setAiStep('transcribed');
      try {
        await aiService.processTranscript(speech.transcript, meeting.id, setAiStep);
      } catch (error) {
        setAiError(error instanceof Error ? error.message : 'پردازش هوش مصنوعی انجام نشد.');
        setAiStep('error');
      }
      return;
    }
    if (!result?.localUri) return;
    setAiStep('transcribing');
    try {
      await aiService.processRecording(result.localUri, meeting.id, setAiStep);
    } catch (error) {
      setAiError(error instanceof Error ? error.message : 'پردازش هوش مصنوعی انجام نشد.');
      setAiStep('error');
    }
  };

  const handleReset = useCallback(() => {
    speech.reset();
    reset();
  }, [reset, speech]);

  const aiProcessing = aiStep !== 'idle' && aiStep !== 'done' && aiStep !== 'error';

  const STEP_ORDER: AiProcessingStep[] = ['transcribing', 'summarizing', 'saving'];
  const stepIndex = (s: AiProcessingStep) => STEP_ORDER.indexOf(s);

  const effectiveStepIndex = (() => {
    if (aiStep === 'done') return STEP_ORDER.length;
    if (aiStep === 'error') return Math.max(stepIndex(STEP_ORDER[0] as AiProcessingStep), 0);
    if (aiStep === 'transcribed') return stepIndex('transcribing' as AiProcessingStep) + 1;
    return stepIndex(aiStep as AiProcessingStep);
  })();

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
    if (isWeb && speech.status === 'error') {
      return `خطا در تشخیص گفتار: ${speech.errorMessage || 'میکروفون را بررسی کنید.'}`;
    }
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
        return isWeb && speech.transcript
          ? 'متن گفتار شما تشخیص داده شد. دکمه "دریافت خلاصه" را بزنید.'
          : 'ضبط با موفقیت ذخیره شد. می‌توانید گوش دهید یا دوباره ضبط کنید.';
      case 'error':
        return 'خطایی رخ داد. دکمه "شروع ضبط" را برای تلاش مجدد بزنید.';
    }
  };

  const handlePlayPause = async () => {
    if (!playbackStatus.isLoaded) return;
    if (isPlaying) {
      if ('pause' in player) player.pause();
    } else {
      if ('play' in player) await player.play();
    }
  };

  const handleReplay = async () => {
    if (!playbackStatus.isLoaded) return;
    try {
      if ('seekTo' in player) {
        await player.seekTo(0);
        await player.play();
      }
    } catch {}
  };

  useEffect(() => {
    if (status === 'completed' && result?.localUri) return;
    try {
      if ('pause' in player) player.pause();
    } catch {}
  }, [player, result?.localUri, status]);

  const showTranscribedText = isWeb && (speech.transcript || speech.interimTranscript);
  const hasTranscript = isWeb && speech.transcript.length > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.centeredContainer, { maxWidth: CONTAINER_MAX_WIDTH }]}>
          <View style={[styles.heroCard, isSmall && styles.heroCardSmall]}>
            <Text style={styles.heroKicker}>استودیو ضبط</Text>
            <Text style={[styles.title, isSmall && styles.titleSmall]}>{meeting.title}</Text>
            <Text style={styles.meta}>{formatMeetingTime(meeting.startDateISO, meeting.endDateISO)}</Text>
          </View>

          <View style={[styles.timerCard, isSmall && styles.timerCardSmall]}>
            <Text style={styles.timerLabel}>مدت ضبط</Text>
            <Text style={[styles.timerValue, isSmall && styles.timerValueSmall]}>{formatDuration(durationMs)}</Text>
            <View style={[styles.stateBadge, status === 'recording' && styles.stateBadgeRecording, status === 'idle' && styles.stateBadgeIdle]}>
              <View style={[styles.stateDot, status === 'recording' && styles.stateDotRecording]} />
              <Text style={styles.stateText}>وضعیت: {stateLabel[status]}</Text>
            </View>
          </View>

          {showTranscribedText ? (
            <View style={[styles.transcriptCard, isSmall && styles.transcriptCardSmall]}>
              <Text style={styles.transcriptLabel}>
                {speech.status === 'listening' ? 'متن در حال تشخیص...' : 'متن تشخیص داده شده:'}
              </Text>
              <View style={styles.transcriptContent}>
                <Text style={styles.transcriptText}>
                  {speech.interimTranscript || speech.transcript}
                </Text>
                {speech.status === 'listening' && speech.interimTranscript ? (
                  <Text style={styles.transcriptBlink}>|</Text>
                ) : null}
              </View>
            </View>
          ) : null}

          {isWeb && !speech.isSupported ? (
            <View style={[styles.messageCard, isSmall && styles.messageCardSmall]}>
              <Text style={styles.warningText}>
                مرورگر شما از تشخیص گفتار پشتیبانی نمی‌کند. لطفا از Chrome یا Safari استفاده کنید.
              </Text>
            </View>
          ) : null}

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
            <View style={[styles.messageCard, isSmall && styles.messageCardSmall]}>
              <Text style={styles.warningText}>{interruptionMessage}</Text>
            </View>
          ) : null}

          {errorMessage ? (
            <View style={[styles.messageCard, isSmall && styles.messageCardSmall]}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {speech.errorMessage && speech.status === 'error' && status !== 'recording' ? (
            <View style={[styles.messageCard, isSmall && styles.messageCardSmall]}>
              <Text style={styles.warningText}>{speech.errorMessage}</Text>
            </View>
          ) : null}

          {status === 'completed' && result ? (
            <View style={[styles.messageCard, isSmall && styles.messageCardSmall]}>
              <Text style={styles.successTitle}>✅ ضبط ذخیره شد</Text>
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
                    {!playbackStatus.isLoaded ? 'بارگذاری...' : isPlaying ? 'مکث' : 'پخش'}
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.secondaryButton, !playbackStatus.isLoaded && styles.disabledButton]}
                  onPress={handleReplay}
                  disabled={!playbackStatus.isLoaded}
                >
                  <Text style={styles.secondaryButtonText}>دوباره</Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          <View style={styles.controls}>
            {status === 'idle' || status === 'permissionDenied' || status === 'error' || status === 'requestingPermission' ? (
              <Pressable
                style={({ pressed }) => [
                  styles.primaryButton,
                  status === 'requestingPermission' ? styles.disabledButton : null,
                  pressed && status !== 'requestingPermission' ? styles.buttonPressed : null,
                ]}
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
                <Pressable style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]} onPress={() => void pause()}>
                  <Text style={styles.secondaryButtonText}>مکث</Text>
                </Pressable>
                <Pressable style={({ pressed }) => [styles.dangerButton, pressed && styles.buttonPressed]} onPress={() => void stop()}>
                  <Text style={styles.dangerButtonText}>پایان</Text>
                </Pressable>
              </View>
            ) : null}

            {status === 'paused' ? (
              <View style={styles.row}>
                <Pressable style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]} onPress={() => void resume()}>
                  <Text style={styles.primaryButtonText}>ادامه</Text>
                </Pressable>
                <Pressable style={({ pressed }) => [styles.dangerButton, pressed && styles.buttonPressed]} onPress={() => void stop()}>
                  <Text style={styles.dangerButtonText}>پایان</Text>
                </Pressable>
              </View>
            ) : null}

            {status === 'completed' ? (
              <View style={styles.row}>
                <Pressable style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]} onPress={handleReset}>
                  <Text style={styles.secondaryButtonText}>ضبط دوباره</Text>
                </Pressable>
                <Pressable style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]} onPress={() => navigation.goBack()}>
                  <Text style={styles.primaryButtonText}>بازگشت</Text>
                </Pressable>
              </View>
            ) : null}

            {status === 'completed' && aiStep === 'idle' ? (
              <Pressable
                style={({ pressed }) => [styles.aiButton, aiProcessing ? styles.disabledButton : null, pressed && !aiProcessing ? styles.buttonPressed : null]}
                onPress={handleAiProcess}
                disabled={aiProcessing}
              >
                <Text style={styles.aiButtonText}>
                  {isWeb && hasTranscript ? 'دریافت خلاصه با هوش مصنوعی' : 'دریافت متن و خلاصه با هوش مصنوعی'}
                </Text>
              </Pressable>
            ) : null}

            {aiProcessing || aiStep === 'done' ? (
              <View style={styles.aiProgressCard}>
                <Text style={styles.aiProgressTitle}>مراحل پردازش</Text>
                <View style={styles.aiStepsList}>
                  {(isWeb && hasTranscript ? ['summarizing', 'saving'] as AiProcessingStep[] : ['transcribing', 'summarizing', 'saving'] as AiProcessingStep[]).map((step) => {
                    const idx = stepIndex(step);
                    const isActive = aiStep === step;
                    const isCompleted = idx < effectiveStepIndex || aiStep === 'done';
                    const isErrorStep = aiStep === 'error' && idx === Math.min(effectiveStepIndex, STEP_ORDER.length - 1);

                    let icon: ReactNode;
                    if (isCompleted) {
                      icon = <View style={styles.aiStepIconCompleted}><Text style={styles.aiStepIconCheck}>✓</Text></View>;
                    } else if (isErrorStep) {
                      icon = <View style={styles.aiStepIconErrorWrap}><Text style={styles.aiStepIconError}>✗</Text></View>;
                    } else if (isActive) {
                      icon = <ActivityIndicator size="small" color={colors.accentDark} />;
                    } else {
                      icon = <View style={styles.aiStepDot} />;
                    }

                    return (
                      <View key={step} style={styles.aiStepRow}>
                        {icon}
                        <Text
                          style={[
                            styles.aiStepLabel,
                            isActive && styles.aiStepLabelActive,
                            isCompleted && styles.aiStepLabelCompleted,
                            isErrorStep && styles.aiStepLabelError,
                          ]}
                        >
                          {AI_STEP_LABELS[step]}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            ) : null}

            {aiStep === 'done' ? (
              <View style={styles.aiDoneCard}>
                <Text style={styles.aiDoneTitle}>✅ متن و خلاصه آماده شد</Text>
                <Text style={styles.aiDoneText}>برای مشاهده به صفحه جزئیات جلسه بروید.</Text>
                <Pressable style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]} onPress={() => navigation.goBack()}>
                  <Text style={styles.primaryButtonText}>مشاهده در جلسه</Text>
                </Pressable>
              </View>
            ) : null}

            {aiError ? (
              <View style={styles.messageCard}>
                <Text style={styles.errorText}>{aiError}</Text>
              </View>
            ) : null}

            {status === 'stopping' ? <Text style={styles.helperText}>در حال ذخیره ضبط...</Text> : null}
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
    gap: 14,
  },
  heroCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    padding: 18,
    gap: 6,
    backgroundColor: colors.surface,
  },
  heroCardSmall: {
    padding: 14,
  },
  heroKicker: {
    fontSize: 11,
    color: colors.accentDark,
    letterSpacing: 0.9,
    fontFamily: typography.bold,
  },
  title: {
    fontSize: 24,
    fontFamily: typography.bold,
    color: colors.textPrimary,
  },
  titleSmall: {
    fontSize: 20,
  },
  meta: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: typography.regular,
  },
  timerCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    backgroundColor: colors.surface,
    padding: 24,
    gap: 10,
    alignItems: 'center',
  },
  timerCardSmall: {
    padding: 18,
  },
  timerLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: typography.regular,
  },
  timerValue: {
    fontSize: 48,
    fontFamily: typography.bold,
    color: colors.textPrimary,
    letterSpacing: 2,
  },
  timerValueSmall: {
    fontSize: 36,
  },
  stateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.backgroundAccent,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  stateBadgeRecording: {
    backgroundColor: '#FEF2F2',
  },
  stateBadgeIdle: {
    backgroundColor: colors.accentSoft,
  },
  stateDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textSecondary,
  },
  stateDotRecording: {
    backgroundColor: colors.danger,
  },
  stateText: {
    fontSize: 13,
    color: colors.textPrimary,
    fontFamily: typography.bold,
  },
  transcriptCard: {
    borderWidth: 1,
    borderColor: colors.accentSoft,
    borderRadius: 16,
    backgroundColor: colors.surface,
    padding: 16,
    gap: 8,
  },
  transcriptCardSmall: {
    padding: 12,
  },
  transcriptLabel: {
    fontSize: 12,
    fontFamily: typography.bold,
    color: colors.accentDark,
    letterSpacing: 0.5,
  },
  transcriptContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  transcriptText: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.textPrimary,
    fontFamily: typography.regular,
    flex: 1,
  },
  transcriptBlink: {
    fontSize: 18,
    color: colors.accentDark,
    opacity: 0.6,
  },
  guidanceCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: colors.accentSoft,
    padding: 14,
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
    backgroundColor: colors.surface,
    padding: 16,
    gap: 10,
  },
  messageCardSmall: {
    padding: 12,
  },
  warningText: {
    color: '#92400E',
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
  controls: {
    marginTop: 8,
    gap: 12,
    paddingBottom: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: colors.accentDark,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontFamily: typography.bold,
    fontSize: 15,
    lineHeight: 20,
    textAlign: 'center',
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.background,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: colors.textPrimary,
    fontFamily: typography.bold,
    fontSize: 15,
  },
  dangerButton: {
    flex: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.danger,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  dangerButtonText: {
    color: '#FFFFFF',
    fontFamily: typography.bold,
    fontSize: 15,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  helperText: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 13,
    fontFamily: typography.regular,
  },
  aiButton: {
    backgroundColor: colors.success,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  aiButtonText: {
    color: '#FFFFFF',
    fontFamily: typography.bold,
    fontSize: 15,
  },
  aiProgressCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    backgroundColor: colors.surface,
    padding: 16,
    gap: 10,
  },
  aiProgressTitle: {
    fontSize: 13,
    fontFamily: typography.bold,
    color: colors.textPrimary,
  },
  aiStepsList: {
    gap: 8,
  },
  aiStepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  aiStepIconCompleted: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiStepIconCheck: {
    fontSize: 12,
    color: colors.success,
    fontWeight: 'bold',
  },
  aiStepIconErrorWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiStepIconError: {
    fontSize: 12,
    color: colors.danger,
    fontWeight: 'bold',
  },
  aiStepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#D1D5DB',
  },
  aiStepLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: typography.regular,
    flex: 1,
  },
  aiStepLabelActive: {
    color: colors.accentDark,
    fontFamily: typography.bold,
  },
  aiStepLabelCompleted: {
    color: colors.success,
  },
  aiStepLabelError: {
    color: colors.danger,
  },
  aiDoneCard: {
    borderWidth: 1,
    borderColor: '#D1FAE5',
    borderRadius: 16,
    backgroundColor: '#ECFDF5',
    padding: 20,
    gap: 10,
    alignItems: 'center',
  },
  aiDoneTitle: {
    fontSize: 16,
    fontFamily: typography.bold,
    color: colors.textPrimary,
  },
  aiDoneText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: typography.regular,
    textAlign: 'center',
  },
});
