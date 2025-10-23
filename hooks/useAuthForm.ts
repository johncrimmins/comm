import { useState } from 'react';
import { useRouter } from 'expo-router';

type AuthMode = 'signin' | 'signup';

interface ValidationErrors {
  email?: string;
  password?: string;
  displayName?: string;
}

export function useAuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const toggleMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin');
    setErrors({});
  };

  const clearError = (fieldName: keyof ValidationErrors) => {
    setErrors((prev) => ({ ...prev, [fieldName]: undefined }));
  };

  const validateAuthForm = (): boolean => {
    const newErrors: ValidationErrors = {};

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
    if (!validateAuthForm()) {
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

  return {
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
  };
}
