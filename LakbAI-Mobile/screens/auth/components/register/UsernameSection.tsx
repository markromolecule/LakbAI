import React from 'react';
import { Text, TextInput, View } from 'react-native';
import { HELP_TEXTS, PLACEHOLDERS } from '../../../../constants/registerField';
import styles from '../../styles/RegisterScreen.styles';
import { FormSectionProps } from './common/types';

export const UsernameSection: React.FC<FormSectionProps> = ({ signUpData, updateSignUpData }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>Username *</Text>
    <TextInput
      style={styles.textInput}
      value={signUpData.username}
      onChangeText={(text) => updateSignUpData('username', text.toLowerCase().replace(/\s/g, ''))}
      placeholder={PLACEHOLDERS.USERNAME}
      placeholderTextColor="#9CA3AF"
      autoCapitalize="none"
      autoCorrect={false}
    />
    <Text style={styles.helpText}>{HELP_TEXTS.USERNAME}</Text>
  </View>
);





