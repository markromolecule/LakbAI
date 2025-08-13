import React from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { PLACEHOLDERS } from '../../../../constants/registerField';
import { HELP_TEXTS } from '../../../../constants/registerField';
import styles from '../../styles/RegisterScreen.styles';
import { PasswordSectionProps } from './common/types';

export const PasswordSection: React.FC<PasswordSectionProps> = ({
  signUpData,
  updateSignUpData,
  showPassword,
  showConfirmPassword,
  togglePasswordVisibility,
  toggleConfirmPasswordVisibility,
}) => (
  <>
    <View style={styles.rowContainer}>
      <View style={[styles.inputGroup, styles.halfWidth]}>
        <Text style={styles.label}>Password *</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={[styles.textInput, styles.passwordInput]}
            value={signUpData.password}
            onChangeText={(text) => updateSignUpData('password', text)}
            placeholder={PLACEHOLDERS.PASSWORD}
            placeholderTextColor="#9CA3AF"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={togglePasswordVisibility}
          >
            <Text style={styles.eyeText}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={[styles.inputGroup, styles.halfWidth]}>
        <Text style={styles.label}>Confirm Password *</Text>
        <View style={styles.passwordContainer}>
          <TextInput
            style={[styles.textInput, styles.passwordInput]}
            value={signUpData.confirmPassword}
            onChangeText={(text) => updateSignUpData('confirmPassword', text)}
            placeholder={PLACEHOLDERS.CONFIRM_PASSWORD}
            placeholderTextColor="#9CA3AF"
            secureTextEntry={!showConfirmPassword}
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={toggleConfirmPasswordVisibility}
          >
            <Text style={styles.eyeText}>{showConfirmPassword ? '👁️' : '👁️‍🗨️'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
    <Text style={styles.helpText}>{HELP_TEXTS.PASSWORD}</Text>
  </>
);





