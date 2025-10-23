import { useState } from 'react';

export interface ValidationRules {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: string) => boolean;
}

export interface FieldValidation {
  [fieldName: string]: ValidationRules;
}

export interface ValidationErrors {
  [fieldName: string]: string | undefined;
}

export function useFormValidation() {
  const [errors, setErrors] = useState<ValidationErrors>({});

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateField = (
    fieldName: string,
    value: string,
    rules: ValidationRules
  ): string | undefined => {
    if (rules.required && !value.trim()) {
      return `${fieldName} is required`;
    }

    if (rules.minLength && value.length < rules.minLength) {
      return `${fieldName} must be at least ${rules.minLength} characters`;
    }

    if (rules.maxLength && value.length > rules.maxLength) {
      return `${fieldName} must be no more than ${rules.maxLength} characters`;
    }

    if (rules.pattern && !rules.pattern.test(value)) {
      return `please enter a valid ${fieldName}`;
    }

    if (rules.custom && !rules.custom(value)) {
      return `${fieldName} is invalid`;
    }

    return undefined;
  };

  const validateForm = (
    values: { [key: string]: string },
    validationRules: FieldValidation
  ): boolean => {
    const newErrors: ValidationErrors = {};

    Object.keys(validationRules).forEach((fieldName) => {
      const error = validateField(
        fieldName,
        values[fieldName] || '',
        validationRules[fieldName]
      );
      if (error) {
        newErrors[fieldName] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const clearError = (fieldName: string) => {
    setErrors((prev) => ({ ...prev, [fieldName]: undefined }));
  };

  const clearAllErrors = () => {
    setErrors({});
  };

  return {
    errors,
    validateField,
    validateForm,
    validateEmail,
    clearError,
    clearAllErrors,
  };
}
