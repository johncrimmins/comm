import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import GradientBackground from '@/components/ui/GradientBackground';
import GlassCard from '@/components/ui/GlassCard';
import GradientButton from '@/components/ui/GradientButton';
import { Colors } from '@/constants/Colors';

type AuthMode = 'signin' | 'signup';

export default function AuthScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    displayName?: string;
  }>({});

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!email.trim()) {
      newErrors.email = 'email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'please enter a valid email';
    }

    if (!password.trim()) {
      newErrors.password = 'password is required';
    } else if (password.length < 6) {
      newErrors.password = 'password must be at least 6 characters';
    }

    if (mode === 'signup') {
      if (!displayName.trim()) {
        newErrors.displayName = 'display name is required';
      } else if (displayName.length < 2) {
        newErrors.displayName = 'display name must be at least 2 characters';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAuth = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Auth error:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    setErrors({});
  };

  return (
    <GradientBackground>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>💬</Text>
            </View>
            <Text style={styles.title}>Comm</Text>
            <Text style={styles.heroText}>
              comms + context at the{'\n'}speed of thought
            </Text>
            <Text style={styles.subtitle}>
              {mode === 'signin'
                ? 'sign in to continue your conversations'
                : 'create your account to get started'}
            </Text>
          </View>

          <GlassCard style={styles.formCard} intensity={40}>
            <View style={styles.formContainer}>
              {mode === 'signup' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>name</Text>
                  <TextInput
                    style={[styles.input, errors.displayName && styles.inputError]}
                    placeholder="your name"
                    placeholderTextColor={Colors.dark.textSecondary}
                    value={displayName}
                    onChangeText={(text) => {
                      setDisplayName(text);
                      if (errors.displayName) {
                        setErrors({ ...errors, displayName: undefined });
                      }
                    }}
                    autoCapitalize="words"
                    editable={!loading}
                  />
                  {errors.displayName && (
                    <Text style={styles.errorText}>{errors.displayName}</Text>
                  )}
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>email</Text>
                <TextInput
                  style={[styles.input, errors.email && styles.inputError]}
                  placeholder="you@example.com"
                  placeholderTextColor={Colors.dark.textSecondary}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errors.email) {
                      setErrors({ ...errors, email: undefined });
                    }
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  editable={!loading}
                />
                {errors.email && (
                  <Text style={styles.errorText}>{errors.email}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>password</Text>
                <TextInput
                  style={[styles.input, errors.password && styles.inputError]}
                  placeholder="enter your password"
                  placeholderTextColor={Colors.dark.textSecondary}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) {
                      setErrors({ ...errors, password: undefined });
                    }
                  }}
                  secureTextEntry
                  editable={!loading}
                />
                {errors.password && (
                  <Text style={styles.errorText}>{errors.password}</Text>
                )}
              </View>

              <GradientButton
                onPress={handleAuth}
                title={
                  loading
                    ? 'loading...'
                    : mode === 'signin'
                    ? 'sign in'
                    : 'create account'
                }
                disabled={loading}
                style={styles.submitButton}
              />

              <TouchableOpacity
                onPress={toggleMode}
                style={styles.toggleButton}
                activeOpacity={0.7}
              >
                <Text style={styles.toggleText}>
                  {mode === 'signin'
                    ? "don't have an account? "
                    : 'already have an account? '}
                  <Text style={styles.toggleTextAccent}>
                    {mode === 'signin' ? 'sign up' : 'sign in'}
                  </Text>
                </Text>
              </TouchableOpacity>
            </View>
          </GlassCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
    minHeight: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.dark.glassLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  icon: {
    fontSize: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.dark.text,
    marginBottom: 12,
    fontFamily: 'Inter_800ExtraBold',
    letterSpacing: -1,
  },
  heroText: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.dark.text,
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'Inter_700Bold',
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    fontFamily: 'Inter_400Regular',
    lineHeight: 22,
  },
  formCard: {
    marginTop: 8,
  },
  formContainer: {
    padding: 24,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.dark.text,
    marginBottom: 8,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.dark.text,
    fontFamily: 'Inter_400Regular',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    marginTop: 6,
    fontFamily: 'Inter_400Regular',
  },
  submitButton: {
    marginTop: 8,
    marginBottom: 16,
  },
  toggleButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  toggleText: {
    color: Colors.dark.textSecondary,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  toggleTextAccent: {
    color: Colors.dark.accentStart,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
});
