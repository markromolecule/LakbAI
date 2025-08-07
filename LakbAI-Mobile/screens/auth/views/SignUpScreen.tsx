// SignUpScreen.tsx
import React from 'react';
import { Text, TouchableOpacity, View, ScrollView } from 'react-native';
import TermsModal from '../../../components/common/TermsModal';
import {
  AddressSection,
  BirthdaySection,
  EmailSection,
  GenderSection,
  NameSection,
  PasswordSection,
  TermsSection,
  UsernameSection,
} from '../components/register/FormSection';
import { useSignUpForm } from '../hooks/useSignUpForm';
import { SignUpData } from '../../../shared/types/authentication';
import styles from '../styles/SignUpScreen.styles';

interface SignUpScreenProps {
  onSignUp: (data: SignUpData) => void;
}

const SignUpScreen: React.FC<SignUpScreenProps> = ({ onSignUp }) => {
  const {
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
  } = useSignUpForm(onSignUp);

  return (
    <ScrollView
      style={styles.scrollContainer}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Create Account</Text>

        <NameSection
          signUpData={signUpData}
          updateSignUpData={updateSignUpData}
        />

        <EmailSection
          signUpData={signUpData}
          updateSignUpData={updateSignUpData}
        />

        <UsernameSection
          signUpData={signUpData}
          updateSignUpData={updateSignUpData}
        />

        <PasswordSection
          signUpData={signUpData}
          updateSignUpData={updateSignUpData}
          showPassword={showPassword}
          showConfirmPassword={showConfirmPassword}
          togglePasswordVisibility={togglePasswordVisibility}
          toggleConfirmPasswordVisibility={toggleConfirmPasswordVisibility}
        />

        <AddressSection
          signUpData={signUpData}
          updateSignUpData={updateSignUpData}
        />

        <BirthdaySection
          signUpData={signUpData}
          updateSignUpData={updateSignUpData}
          showMonthDropdown={showMonthDropdown}
          toggleMonthDropdown={toggleMonthDropdown}
          handleDateInput={handleDateInput}
          handleYearInput={handleYearInput}
        />

        <GenderSection
          signUpData={signUpData}
          updateSignUpData={updateSignUpData}
        />

        <TermsSection
          signUpData={signUpData}
          updateSignUpData={updateSignUpData}
          onTermsPress={() => setShowTermsModal(true)}
        />

        <TouchableOpacity style={styles.primaryButton} onPress={handleSignUp}>
          <Text style={styles.primaryButtonText}>Create Account</Text>
        </TouchableOpacity>

        <TermsModal
          visible={showTermsModal}
          onClose={() => setShowTermsModal(false)}
          onAccept={handleTermsAccept}
        />
      </ScrollView>
    </ScrollView>
  );
};

export default SignUpScreen;