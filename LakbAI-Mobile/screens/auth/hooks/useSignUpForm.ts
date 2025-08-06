
import { useState } from 'react';
import { Alert } from 'react-native';
import { SignUpData } from '../../../shared/types/authentication';
import { validateBirthDate, validateEmail, validatePassword } from '../../../shared/helpers/validation';

const initialSignUpData: SignUpData = {
  firstName: '',
  lastName: '',
  email: '',
  username: '',
  password: '',
  confirmPassword: '',
  houseNumber: '',
  streetName: '',
  barangay: '',
  cityMunicipality: '',
  province: '',
  postalCode: '',
  birthMonth: '',
  birthDate: '',
  birthYear: '',
  gender: '',
  acceptedTerms: false,
};

export const useSignUpForm = (onSignUp: (data: SignUpData) => void) => {
  const [signUpData, setSignUpData] = useState<SignUpData>(initialSignUpData);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);

  const updateSignUpData = (field: keyof SignUpData, value: any) => {
    setSignUpData(prev => ({ ...prev, [field]: value }));
  };

  const handleDateInput = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    if (numericValue.length <= 2) {
      updateSignUpData('birthDate', numericValue);
    }
  };

  const handleYearInput = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    if (numericValue.length <= 4) {
      updateSignUpData('birthYear', numericValue);
    }
  };

  const validateForm = (): boolean => {
    const requiredFields = [
      'firstName', 'lastName', 'email', 'username', 'password', 'confirmPassword',
      'houseNumber', 'streetName', 'barangay', 'cityMunicipality', 'province', 
      'postalCode', 'birthMonth', 'birthDate', 'birthYear', 'gender'
    ];

    const missingFields = requiredFields.filter(field => !signUpData[field as keyof SignUpData]);

    if (missingFields.length > 0) {
      Alert.alert('Error', 'Please fill in all required fields');
      return false;
    }

    if (!validateEmail(signUpData.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }

    if (signUpData.username.length < 3) {
      Alert.alert('Error', 'Username must be at least 3 characters long');
      return false;
    }

    if (!validatePassword(signUpData.password)) {
      Alert.alert('Error', 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number');
      return false;
    }

    if (signUpData.password !== signUpData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }

    if (!validateBirthDate(signUpData.birthDate, signUpData.birthMonth, signUpData.birthYear)) {
      Alert.alert('Error', 'Please enter a valid birth date');
      return false;
    }

    if (!signUpData.acceptedTerms) {
      Alert.alert('Error', 'Please accept the Terms and Conditions');
      return false;
    }

    return true;
  };

  const handleSignUp = () => {
    if (validateForm()) {
      onSignUp(signUpData);
    }
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);
  const toggleMonthDropdown = () => setShowMonthDropdown(!showMonthDropdown);

  const handleTermsAccept = () => {
    updateSignUpData('acceptedTerms', true);
    setShowTermsModal(false);
  };

  return {
    signUpData,
    showTermsModal,
    showPassword,
    showConfirmPassword,
    showMonthDropdown,
    updateSignUpData,
    handleDateInput,
    handleYearInput,
    handleSignUp,
    togglePasswordVisibility,
    toggleConfirmPasswordVisibility,
    toggleMonthDropdown,
    setShowTermsModal,
    handleTermsAccept,
  };
};