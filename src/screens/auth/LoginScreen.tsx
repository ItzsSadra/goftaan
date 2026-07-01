import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../../features/auth/context/AuthContext';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';

export const LoginScreen = () => {
  const { login, signup } = useAuth();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { width } = useWindowDimensions();
  const isDesktop = width > 768;
  const isSmall = width < 380;

  const isSignupMode = mode === 'signup';

  const handleSubmit = async () => {
    if (isSignupMode && !name.trim()) {
      setErrorMessage('نام را وارد کنید.');
      return;
    }
    if (!email.trim() || !password) {
      setErrorMessage('ایمیل و رمز عبور را وارد کنید.');
      return;
    }
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      if (isSignupMode) {
        await signup(name, email, password);
      } else {
        await login(email, password);
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : isSignupMode
            ? 'ثبت‌نام ناموفق بود.'
            : 'ورود ناموفق بود.';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.contentWrapper, isDesktop && styles.contentWrapperDesktop]}>
          <View style={styles.brandSection}>
            <View style={styles.brandIcon}>
              <Text style={styles.brandIconText}>G</Text>
            </View>
            <Text style={styles.brandName}>گفتان</Text>
            <Text style={styles.brandTagline}>مدیریت هوشمند جلسات</Text>
          </View>

          <View style={[styles.card, isSmall && styles.cardSmall]}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{isSignupMode ? 'ساخت حساب' : 'ورود'}</Text>
              <Text style={styles.cardSubtitle}>
                {isSignupMode
                  ? 'برای شروع، اطلاعات خود را وارد کنید.'
                  : 'به حساب خود وارد شوید.'}
              </Text>
            </View>

            <View style={styles.modeSwitch}>
              <Pressable
                style={[styles.modeTab, !isSignupMode ? styles.modeTabActive : null]}
                onPress={() => { setMode('login'); setErrorMessage(null); }}
                disabled={isSubmitting}
              >
                <Text style={[styles.modeTabText, !isSignupMode ? styles.modeTabTextActive : null]}>ورود</Text>
              </Pressable>
              <Pressable
                style={[styles.modeTab, isSignupMode ? styles.modeTabActive : null]}
                onPress={() => { setMode('signup'); setErrorMessage(null); }}
                disabled={isSubmitting}
              >
                <Text style={[styles.modeTabText, isSignupMode ? styles.modeTabTextActive : null]}>ثبت‌نام</Text>
              </Pressable>
            </View>

            <View style={styles.form}>
              {isSignupMode ? (
                <>
                  <Text style={styles.label}>نام</Text>
                  <TextInput
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    autoCorrect={false}
                    style={styles.input}
                    placeholder="نام شما"
                    placeholderTextColor={colors.textSecondary}
                    textAlign="left"
                    editable={!isSubmitting}
                  />
                </>
              ) : null}

              <Text style={styles.label}>ایمیل</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor={colors.textSecondary}
                textAlign="left"
                editable={!isSubmitting}
              />

              <Text style={styles.label}>رمز عبور</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={colors.textSecondary}
                textAlign="left"
                editable={!isSubmitting}
                onSubmitEditing={() => void handleSubmit()}
              />
            </View>

            {errorMessage ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            <Pressable
              style={({ pressed }) => [
                styles.submitButton,
                isSubmitting && styles.submitButtonDisabled,
                pressed && !isSubmitting && styles.submitButtonPressed,
              ]}
              onPress={() => void handleSubmit()}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {isSignupMode ? 'ثبت‌نام' : 'ورود'}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
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
  contentWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 28,
  },
  contentWrapperDesktop: {
    paddingHorizontal: 0,
  },
  brandSection: {
    alignItems: 'center',
    gap: 8,
  },
  brandIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandIconText: {
    fontSize: 28,
    fontFamily: typography.bold,
    color: '#FFFFFF',
  },
  brandName: {
    fontSize: 24,
    fontFamily: typography.bold,
    color: colors.textPrimary,
  },
  brandTagline: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: typography.regular,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 24,
    gap: 16,
  },
  cardSmall: {
    padding: 18,
    gap: 14,
  },
  cardHeader: {
    gap: 4,
  },
  cardTitle: {
    fontSize: 22,
    color: colors.textPrimary,
    fontFamily: typography.bold,
  },
  cardSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: typography.regular,
    lineHeight: 20,
  },
  modeSwitch: {
    flexDirection: 'row',
    borderRadius: 12,
    backgroundColor: colors.backgroundAccent,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 3,
  },
  modeTab: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 10,
    paddingVertical: 10,
  },
  modeTabActive: {
    backgroundColor: colors.surface,
    shadowColor: colors.shadow,
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  modeTabText: {
    color: colors.textSecondary,
    fontFamily: typography.bold,
    fontSize: 13,
  },
  modeTabTextActive: {
    color: colors.textPrimary,
  },
  form: {
    gap: 8,
  },
  label: {
    color: colors.textPrimary,
    fontFamily: typography.bold,
    fontSize: 13,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.background,
    paddingHorizontal: 14,
    color: colors.textPrimary,
    fontFamily: typography.regular,
    fontSize: 15,
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
    textAlign: 'left',
  },
  submitButton: {
    height: 50,
    borderRadius: 12,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontFamily: typography.bold,
    fontSize: 16,
  },
});
