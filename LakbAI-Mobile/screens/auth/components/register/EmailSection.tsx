import React from 'react';
import { Text, TextInput, View } from 'react-native';
import { PLACEHOLDERS } from '../../../../constants/registerField';
import styles from '../../styles/RegisterScreen.styles';
import { FormSectionProps } from './common/types';

export const EmailSection: React.FC<FormSectionProps> = ({ signUpData, updateSignUpData }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>Email Address *</Text>
    <TextInput
      style={styles.textInput}
      value={signUpData.email}
      onChangeText={(text) => updateSignUpData('email', text)}
      placeholder={PLACEHOLDERS.EMAIL}
      placeholderTextColor="#9CA3AF"
      keyboardType="email-address"
      autoCapitalize="none"
    />
  </View>
);








