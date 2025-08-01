import { Picker } from '@react-native-picker/picker';
import React, { useState } from 'react';
import {
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import TermsModal from '../../components/common/TermsModal';
import { SignUpData } from '../../shared/types/auth';

interface SignUpScreenProps {
  onSignUp: (data: SignUpData) => void;
}

const SignUpScreen: React.FC<SignUpScreenProps> = ({ onSignUp }) => {
  const [signUpData, setSignUpData] = useState<SignUpData>({
    firstName: '',
    lastName: '',
    email: '',
    username: '', // add 
    password: '', // add
    confirmPassword: '', // add
    houseNumber: '',
    streetName: '',
    barangay: '',
    cityMunicipality: '',
    province: '',
    postalCode: '',
    birthMonth: '',
    birthDate: '',
    birthYear: '',
    gender: '',
    acceptedTerms: false,
  });

  const [showTermsModal, setShowTermsModal] = useState(false);

  // Generate arrays for dropdowns
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dates = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
  const years = Array.from({ length: 46 }, (_, i) => (2025 - i).toString());

  const handleSignUp = () => {
    const requiredFields = [
      'firstName', 'lastName', 'email', 'houseNumber', 'streetName',
      'barangay', 'cityMunicipality', 'province', 'postalCode',
      'birthMonth', 'birthDate', 'birthYear', 'gender'
    ];

    const missingFields = requiredFields.filter(field => !signUpData[field as keyof SignUpData]);

    if (missingFields.length > 0) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!signUpData.acceptedTerms) {
      Alert.alert('Error', 'Please accept the Terms and Conditions');
      return;
    }

    onSignUp(signUpData);
  };

  const updateSignUpData = (field: keyof SignUpData, value: any) => {
    setSignUpData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      
      {/* Name Fields */}
      <View style={styles.rowContainer}>
        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={styles.label}>First Name *</Text>
          <TextInput
            style={styles.textInput}
            value={signUpData.firstName}
            onChangeText={(text) => updateSignUpData('firstName', text)}
            placeholder="First name"
            autoCapitalize="words"
          />
        </View>
        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={styles.label}>Last Name *</Text>
          <TextInput
            style={styles.textInput}
            value={signUpData.lastName}
            onChangeText={(text) => updateSignUpData('lastName', text)}
            placeholder="Last name"
            autoCapitalize="words"
          />
        </View>
      </View>

      {/* Email */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Email Address *</Text>
        <TextInput
          style={styles.textInput}
          value={signUpData.email}
          onChangeText={(text) => updateSignUpData('email', text)}
          placeholder="your.email@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      {/* Address Section */}
      <Text style={styles.sectionSubtitle}>Full Address</Text>
      
      <View style={styles.rowContainer}>
        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={styles.label}>House/Building No. *</Text>
          <TextInput
            style={styles.textInput}
            value={signUpData.houseNumber}
            onChangeText={(text) => updateSignUpData('houseNumber', text)}
            placeholder="123"
          />
        </View>
        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={styles.label}>Street Name *</Text>
          <TextInput
            style={styles.textInput}
            value={signUpData.streetName}
            onChangeText={(text) => updateSignUpData('streetName', text)}
            placeholder="Main Street"
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
          placeholder="Barangay name"
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
            placeholder="City"
            autoCapitalize="words"
          />
        </View>
        <View style={[styles.inputGroup, styles.halfWidth]}>
          <Text style={styles.label}>Province *</Text>
          <TextInput
            style={styles.textInput}
            value={signUpData.province}
            onChangeText={(text) => updateSignUpData('province', text)}
            placeholder="Province"
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
          placeholder="1234"
          keyboardType="numeric"
          maxLength={4}
        />
      </View>

      {/* Birthday Section */}
      <Text style={styles.sectionSubtitle}>Birthday</Text>
      
      <View style={styles.birthdayContainer}>
        <View style={styles.pickerContainer}>
          <Text style={styles.label}>Month *</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={signUpData.birthMonth}
              onValueChange={(value) => updateSignUpData('birthMonth', value)}
              style={styles.picker}
            >
              <Picker.Item label="Select Month" value="" />
              {months.map((month, index) => (
                <Picker.Item key={index} label={month} value={month} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.pickerContainer}>
          <Text style={styles.label}>Date *</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={signUpData.birthDate}
              onValueChange={(value) => updateSignUpData('birthDate', value)}
              style={styles.picker}
            >
              <Picker.Item label="Day" value="" />
              {dates.map((date) => (
                <Picker.Item key={date} label={date} value={date} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.pickerContainer}>
          <Text style={styles.label}>Year *</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={signUpData.birthYear}
              onValueChange={(value) => updateSignUpData('birthYear', value)}
              style={styles.picker}
            >
              <Picker.Item label="Year" value="" />
              {years.map((year) => (
                <Picker.Item key={year} label={year} value={year} />
              ))}
            </Picker>
          </View>
        </View>
      </View>

      {/* Gender Section */}
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

      {/* Terms and Conditions */}
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
        <TouchableOpacity onPress={() => setShowTermsModal(true)}>
          <Text style={styles.termsLink}>Terms and Conditions</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={handleSignUp}>
        <Text style={styles.primaryButtonText}>Create Account</Text>
      </TouchableOpacity>

      <TermsModal
        visible={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        onAccept={() => {
          updateSignUpData('acceptedTerms', true);
          setShowTermsModal(false);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 20,
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#1F2937',
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  birthdayContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  pickerContainer: {
    flex: 1,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 20,
  },
  genderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    flex: 1,
  },
  selectedGender: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 8,
    backgroundColor: '#FFFFFF',
  },
  radioSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#3B82F6',
  },
  genderText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 4,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  termsText: {
    fontSize: 14,
    color: '#374151',
  },
  termsLink: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 20,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default SignUpScreen;