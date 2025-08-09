import React from 'react';
import { Text, TextInput, View } from 'react-native';
import { PLACEHOLDERS } from '../../../../constants/registerField';
import { HELP_TEXTS } from '../../../../constants/registerField';
import styles from '../../styles/RegisterScreen.styles';
import { PhoneSectionProps } from './common/types';

export const PhoneSection: React.FC<PhoneSectionProps> = ({ signUpData, updateSignUpData, handlePhoneInput }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>Phone Number *</Text>
    <TextInput
      style={styles.textInput}
      value={signUpData.phoneNumber}
      onChangeText={handlePhoneInput}
      placeholder={PLACEHOLDERS.PHONE_NUMBER}
      placeholderTextColor="#9CA3AF"
      keyboardType="phone-pad"
      autoCapitalize="none"
      maxLength={13}
    />
    <Text style={styles.helpText}>{HELP_TEXTS.PHONE_NUMBER}</Text>
  </View>
);
