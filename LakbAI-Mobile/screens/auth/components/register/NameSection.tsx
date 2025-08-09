import React from 'react';
import { Text, TextInput, View } from 'react-native';
import { PLACEHOLDERS } from '../../../../constants/registerField';
import styles from '../../styles/RegisterScreen.styles';
import { FormSectionProps } from './common/types';

export const NameSection: React.FC<FormSectionProps> = ({ signUpData, updateSignUpData }) => (
  <View style={styles.rowContainer}>
    <View style={[styles.inputGroup, styles.halfWidth]}>
      <Text style={styles.label}>First Name *</Text>
      <TextInput
        style={styles.textInput}
        value={signUpData.firstName}
        onChangeText={(text) => updateSignUpData('firstName', text)}
        placeholder={PLACEHOLDERS.FIRST_NAME}
        placeholderTextColor="#9CA3AF"
        autoCapitalize="words"
      />
    </View>
    <View style={[styles.inputGroup, styles.halfWidth]}>
      <Text style={styles.label}>Last Name *</Text>
      <TextInput
        style={styles.textInput}
        value={signUpData.lastName}
        onChangeText={(text) => updateSignUpData('lastName', text)}
        placeholder={PLACEHOLDERS.LAST_NAME}
        placeholderTextColor="#9CA3AF"
        autoCapitalize="words"
      />
    </View>
  </View>
);
