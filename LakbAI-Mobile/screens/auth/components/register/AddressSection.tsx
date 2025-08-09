import React from 'react';
import { Text, TextInput, View } from 'react-native';
import { PLACEHOLDERS } from '../../../../constants/registerField';
import styles from '../../styles/RegisterScreen.styles';
import { FormSectionProps } from './common/types';

export const AddressSection: React.FC<FormSectionProps> = ({ signUpData, updateSignUpData }) => (
  <>
    <Text style={styles.sectionSubtitle}>Full Address</Text>

    <View style={styles.rowContainer}>
      <View style={[styles.inputGroup, styles.halfWidth]}>
        <Text style={styles.label}>House/Building No. *</Text>
        <TextInput
          style={styles.textInput}
          value={signUpData.houseNumber}
          onChangeText={(text) => updateSignUpData('houseNumber', text)}
          placeholder={PLACEHOLDERS.HOUSE_NUMBER}
          placeholderTextColor="#9CA3AF"
        />
      </View>
      <View style={[styles.inputGroup, styles.halfWidth]}>
        <Text style={styles.label}>Street Name *</Text>
        <TextInput
          style={styles.textInput}
          value={signUpData.streetName}
          onChangeText={(text) => updateSignUpData('streetName', text)}
          placeholder={PLACEHOLDERS.STREET_NAME}
          placeholderTextColor="#9CA3AF"
          autoCapitalize="words"
        />
      </View>
    </View>

    <View style={styles.inputGroup}>
      <Text style={styles.label}>Barangay *</Text>
      <TextInput
        style={styles.textInput}
        value={signUpData.barangay}
        onChangeText={(text) => updateSignUpData('barangay', text)}
        placeholder={PLACEHOLDERS.BARANGAY}
        placeholderTextColor="#9CA3AF"
        autoCapitalize="words"
      />
    </View>

    <View style={styles.rowContainer}>
      <View style={[styles.inputGroup, styles.halfWidth]}>
        <Text style={styles.label}>City/Municipality *</Text>
        <TextInput
          style={styles.textInput}
          value={signUpData.cityMunicipality}
          onChangeText={(text) => updateSignUpData('cityMunicipality', text)}
          placeholder={PLACEHOLDERS.CITY}
          placeholderTextColor="#9CA3AF"
          autoCapitalize="words"
        />
      </View>
      <View style={[styles.inputGroup, styles.halfWidth]}>
        <Text style={styles.label}>Province *</Text>
        <TextInput
          style={styles.textInput}
          value={signUpData.province}
          onChangeText={(text) => updateSignUpData('province', text)}
          placeholder={PLACEHOLDERS.PROVINCE}
          placeholderTextColor="#9CA3AF"
          autoCapitalize="words"
        />
      </View>
    </View>

    <View style={styles.inputGroup}>
      <Text style={styles.label}>Postal Code *</Text>
      <TextInput
        style={styles.textInput}
        value={signUpData.postalCode}
        onChangeText={(text) => updateSignUpData('postalCode', text)}
        placeholder={PLACEHOLDERS.POSTAL_CODE}
        placeholderTextColor="#9CA3AF"
        keyboardType="numeric"
        maxLength={4}
      />
    </View>
  </>
);
