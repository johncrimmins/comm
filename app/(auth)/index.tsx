import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import GradientBackground from '@/components/ui/GradientBackground';
import GlassCard from '@/components/ui/GlassCard';
import GradientButton from '@/components/ui/GradientButton';
import FormInput from '@/components/auth/FormInput';
import FormLabel from '@/components/auth/FormLabel';
import ErrorText from '@/components/auth/ErrorText';
import { useAuthForm } from '@/hooks/useAuthForm';
import { Colors } from '@/constants/Colors';

export default function AuthScreen() {
  const {
    mode,
    email,
    password,
    displayName,
    loading,
    errors,
    setEmail,
    setPassword,
    setDisplayName,
    toggleMode,
    handleAuth,
    clearError,
  } = useAuthForm();

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
          scrollEnabled={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Comm</Text>
            <Text style={styles.heroText}>
              context at the speed of thought
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
                  <FormLabel>name</FormLabel>
                  <FormInput
                    hasError={!!errors.displayName}
                    placeholder="your name"
                    value={displayName}
                    onChangeText={(text) => {
                      setDisplayName(text);
                      if (errors.displayName) clearError('displayName');
                    }}
                    autoCapitalize="words"
                    editable={!loading}
                  />
                  <ErrorText>{errors.displayName}</ErrorText>
                </View>
              )}

              <View style={styles.inputGroup}>
                <FormLabel>email</FormLabel>
                <FormInput
                  hasError={!!errors.email}
                  placeholder="you@example.com"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (errors.email) clearError('email');
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  editable={!loading}
                />
                <ErrorText>{errors.email}</ErrorText>
              </View>

              <View style={styles.inputGroup}>
                <FormLabel>password</FormLabel>
                <FormInput
                  hasError={!!errors.password}
                  placeholder="enter your password"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) clearError('password');
                  }}
                  secureTextEntry
                  editable={!loading}
                />
                <ErrorText>{errors.password}</ErrorText>
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
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
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
    fontSize: 36,
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
