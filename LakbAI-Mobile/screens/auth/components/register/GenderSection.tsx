import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import styles from '../../styles/RegisterScreen.styles';
import { FormSectionProps } from './common/types';

export const GenderSection: React.FC<FormSectionProps> = ({ signUpData, updateSignUpData }) => (
  <>
    <Text style={styles.sectionSubtitle}>Gender</Text>
    <View style={styles.genderContainer}>
      <TouchableOpacity
        style={[styles.genderOption, signUpData.gender === 'male' && styles.selectedGender]}
        onPress={() => updateSignUpData('gender', 'male')}
      >
        <View style={[styles.radio, signUpData.gender === 'male' && styles.radioSelected]} />
        <Text style={styles.genderText}>Male</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.genderOption, signUpData.gender === 'female' && styles.selectedGender]}
        onPress={() => updateSignUpData('gender', 'female')}
      >
        <View style={[styles.radio, signUpData.gender === 'female' && styles.radioSelected]} />
        <Text style={styles.genderText}>Female</Text>
      </TouchableOpacity>
    </View>
  </>
);





