import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import styles from '../../styles/RegisterScreen.styles';
import { TermsSectionProps } from './common/types';

export const TermsSection: React.FC<TermsSectionProps> = ({ signUpData, updateSignUpData, onTermsPress }) => (
  <View style={styles.termsContainer}>
    <TouchableOpacity
      style={styles.checkboxContainer}
      onPress={() => updateSignUpData('acceptedTerms', !signUpData.acceptedTerms)}
    >
      <View style={[styles.checkbox, signUpData.acceptedTerms && styles.checkboxSelected]}>
        {signUpData.acceptedTerms && <Text style={styles.checkmark}>✓</Text>}
      </View>
      <Text style={styles.termsText}>I accept the </Text>
    </TouchableOpacity>
    <TouchableOpacity onPress={onTermsPress}>
      <Text style={styles.termsLink}>Terms and Conditions</Text>
    </TouchableOpacity>
  </View>
);








