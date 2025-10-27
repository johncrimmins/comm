import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
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
import { authStyles } from '@/styles/screens/auth';

export default function AuthScreen() {
  const {
    mode,
    email,
    password,
    displayName,
    title,
    loading,
    errors,
    setEmail,
    setPassword,
    setDisplayName,
    setTitle,
    toggleMode,
    handleAuth,
    clearError,
  } = useAuthForm();

  return (
    <GradientBackground>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={authStyles.container}
        enabled={Platform.OS !== 'web'}
      >
        <ScrollView
          contentContainerStyle={authStyles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={authStyles.header}>
            <Text style={authStyles.title}>Comm</Text>
            <Text style={authStyles.heroText}>
              context at the speed of thought
            </Text>
            <Text style={authStyles.subtitle}>
              {mode === 'signin'
                ? 'sign in to continue your conversations'
                : 'create your account to get started'}
            </Text>
          </View>

          <GlassCard style={authStyles.formCard} intensity={40}>
            <View style={authStyles.formContainer}>
              {mode === 'signup' && (
                <>
                  <View style={authStyles.inputGroup}>
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

                  <View style={authStyles.inputGroup}>
                    <FormLabel>title</FormLabel>
                    <FormInput
                      hasError={!!errors.title}
                      placeholder="e.g., Finance, Engineering"
                      value={title}
                      onChangeText={(text) => {
                        setTitle(text);
                        if (errors.title) clearError('title');
                      }}
                      autoCapitalize="words"
                      editable={!loading}
                    />
                    <ErrorText>{errors.title}</ErrorText>
                  </View>
                </>
              )}

              <View style={authStyles.inputGroup}>
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

              <View style={authStyles.inputGroup}>
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
                style={authStyles.submitButton}
              />

              <TouchableOpacity
                onPress={toggleMode}
                style={authStyles.toggleButton}
                activeOpacity={0.7}
              >
                <Text style={authStyles.toggleText}>
                  {mode === 'signin'
                    ? "don't have an account? "
                    : 'already have an account? '}
                  <Text style={authStyles.toggleTextAccent}>
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
