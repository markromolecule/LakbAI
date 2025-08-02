// components/signup/FormSections.tsx
import React from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { HELP_TEXTS, MONTHS_DATA, PLACEHOLDERS } from '../../constants/signUpField';
import styles from '../../screens/auth/styles/SignUpScreen.styles';
import { getSelectedMonthLabel, selectMonth } from '../../shared/helpers/monthDropdownHelper';
import { SignUpData } from '../../shared/types/authentication';

interface FormSectionProps {
  signUpData: SignUpData;
  updateSignUpData: (field: keyof SignUpData, value: any) => void;
}

interface PasswordSectionProps extends FormSectionProps {
  showPassword: boolean;
  showConfirmPassword: boolean;
  togglePasswordVisibility: () => void;
  toggleConfirmPasswordVisibility: () => void;
}

interface BirthdaySectionProps extends FormSectionProps {
  showMonthDropdown: boolean;
  toggleMonthDropdown: () => void;
  handleDateInput: (value: string) => void;
  handleYearInput: (value: string) => void;
}

interface GenderSectionProps extends FormSectionProps {

}

interface TermsSectionProps extends FormSectionProps {
  onTermsPress: () => void;
}

export const NameSection: React.FC<FormSectionProps> = ({ signUpData, updateSignUpData }) => (
  <View style={styles.rowContainer}>
    <View style={[styles.inputGroup, styles.halfWidth]}>
      <Text style={styles.label}>First Name *</Text>
      <TextInput
        style={styles.textInput}
        value={signUpData.firstName}
        onChangeText={(text) => updateSignUpData('firstName', text)}
        placeholder={PLACEHOLDERS.FIRST_NAME}
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
        autoCapitalize="words"
      />
    </View>
  </View>
);

export const EmailSection: React.FC<FormSectionProps> = ({ signUpData, updateSignUpData }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>Email Address *</Text>
    <TextInput
      style={styles.textInput}
      value={signUpData.email}
      onChangeText={(text) => updateSignUpData('email', text)}
      placeholder={PLACEHOLDERS.EMAIL}
      keyboardType="email-address"
      autoCapitalize="none"
    />
  </View>
);

export const UsernameSection: React.FC<FormSectionProps> = ({ signUpData, updateSignUpData }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>Username *</Text>
    <TextInput
      style={styles.textInput}
      value={signUpData.username}
      onChangeText={(text) => updateSignUpData('username', text.toLowerCase().replace(/\s/g, ''))}
      placeholder={PLACEHOLDERS.USERNAME}
      autoCapitalize="none"
      autoCorrect={false}
    />
    <Text style={styles.helpText}>{HELP_TEXTS.USERNAME}</Text>
  </View>
);

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
        />
      </View>
      <View style={[styles.inputGroup, styles.halfWidth]}>
        <Text style={styles.label}>Street Name *</Text>
        <TextInput
          style={styles.textInput}
          value={signUpData.streetName}
          onChangeText={(text) => updateSignUpData('streetName', text)}
          placeholder={PLACEHOLDERS.STREET_NAME}
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
        keyboardType="numeric"
        maxLength={4}
      />
    </View>
  </>
);

export const BirthdaySection: React.FC<BirthdaySectionProps> = ({
  signUpData,
  updateSignUpData,
  showMonthDropdown,
  toggleMonthDropdown,
  handleDateInput,
  handleYearInput,
}) => (
  <>
    <Text style={styles.sectionSubtitle}>Birthday</Text>
    
    <View style={styles.birthdayContainer}>
      <View style={styles.pickerContainer}>
        <Text style={styles.label}>Month *</Text>
        <TouchableOpacity
          style={styles.monthDropdown}
          onPress={toggleMonthDropdown}
        >
          <Text style={[styles.monthText, !signUpData.birthMonth && styles.placeholderText]}>
            {getSelectedMonthLabel(signUpData.birthMonth)}
          </Text>
          <Text style={styles.dropdownArrow}>{showMonthDropdown ? '▲' : '▼'}</Text>
        </TouchableOpacity>
        
        {showMonthDropdown && (
          <View style={styles.monthDropdownList}>
            <ScrollView 
              style={styles.monthScrollView}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
            >
              {MONTHS_DATA.map((month, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.monthOption,
                    index === MONTHS_DATA.length - 1 && styles.lastMonthOption
                  ]}
                  onPress={() => selectMonth(month, updateSignUpData, () => toggleMonthDropdown())}
                >
                  <Text style={styles.monthOptionText}>{month.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      <View style={styles.pickerContainer}>
        <Text style={styles.label}>Date *</Text>
        <TextInput
          style={styles.textInput}
          value={signUpData.birthDate}
          onChangeText={handleDateInput}
          placeholder={PLACEHOLDERS.BIRTH_DATE}
          keyboardType="numeric"
          maxLength={2}
        />
      </View>

      <View style={styles.pickerContainer}>
        <Text style={styles.label}>Year *</Text>
        <TextInput
          style={styles.textInput}
          value={signUpData.birthYear}
          onChangeText={handleYearInput}
          placeholder={PLACEHOLDERS.BIRTH_YEAR}
          keyboardType="numeric"
          maxLength={4}
        />
      </View>
    </View>
    <Text style={styles.helpText}>{HELP_TEXTS.BIRTH_DATE}</Text>
  </>
);

export const GenderSection: React.FC<GenderSectionProps> = ({ signUpData, updateSignUpData }) => (
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