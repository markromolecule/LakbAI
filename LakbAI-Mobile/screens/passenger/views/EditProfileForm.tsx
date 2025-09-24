import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { User, Mail, Phone, MapPin, Calendar, Users } from 'lucide-react-native';
import { PassengerProfile } from '../../../shared/types/authentication';
import { COLORS, SPACING } from '../../../shared/styles';

interface EditProfileFormProps {
  initialData: PassengerProfile | null;
  onSave: (data: any) => void;
  isLoading: boolean;
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  address: {
    houseNumber: string;
    streetName: string;
    barangay: string;
    cityMunicipality: string;
    province: string;
    postalCode: string;
  };
  personalInfo: {
    birthDate: string;
    gender: 'male' | 'female' | '';
  };
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  address?: {
    houseNumber?: string;
    streetName?: string;
    barangay?: string;
    cityMunicipality?: string;
    province?: string;
    postalCode?: string;
  };
  personalInfo?: {
    birthDate?: string;
    gender?: string;
  };
}

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const days = Array.from({ length: 31 }, (_, i) => i + 1);
const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i);

export const EditProfileForm: React.FC<EditProfileFormProps> = ({
  initialData,
  onSave,
  isLoading
}) => {
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    address: {
      houseNumber: '',
      streetName: '',
      barangay: '',
      cityMunicipality: '',
      province: '',
      postalCode: '',
    },
    personalInfo: {
      birthDate: '',
      gender: '',
    },
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState({ day: '', month: '', year: '' });

  useEffect(() => {
    if (initialData) {
      setFormData({
        firstName: initialData.firstName || '',
        lastName: initialData.lastName || '',
        email: initialData.email || '',
        phoneNumber: initialData.phoneNumber || '',
        address: {
          houseNumber: initialData.address.houseNumber || '',
          streetName: initialData.address.streetName || '',
          barangay: initialData.address.barangay || '',
          cityMunicipality: initialData.address.cityMunicipality || '',
          province: initialData.address.province || '',
          postalCode: initialData.address.postalCode || '',
        },
        personalInfo: {
          birthDate: initialData.personalInfo.birthDate || '',
          gender: initialData.personalInfo.gender || '',
        },
      });

      // Parse existing birth date
      if (initialData.personalInfo.birthDate) {
        const dateParts = initialData.personalInfo.birthDate.split('-');
        if (dateParts.length === 3) {
          setSelectedDate({
            year: dateParts[0],
            month: months[parseInt(dateParts[1]) - 1] || '',
            day: dateParts[2],
          });
        }
      }
    }
  }, [initialData]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^09\d{9}$/.test(formData.phoneNumber.replace(/\s/g, ''))) {
      newErrors.phoneNumber = 'Phone number must be 11 digits starting with 09';
    }

    if (!formData.address.houseNumber.trim()) {
      newErrors.address = { ...newErrors.address, houseNumber: 'House number is required' };
    }

    if (!formData.address.streetName.trim()) {
      newErrors.address = { ...newErrors.address, streetName: 'Street name is required' };
    }

    if (!formData.address.barangay.trim()) {
      newErrors.address = { ...newErrors.address, barangay: 'Barangay is required' };
    }

    if (!formData.address.cityMunicipality.trim()) {
      newErrors.address = { ...newErrors.address, cityMunicipality: 'City/Municipality is required' };
    }

    if (!formData.address.province.trim()) {
      newErrors.address = { ...newErrors.address, province: 'Province is required' };
    }

    if (!formData.address.postalCode.trim()) {
      newErrors.address = { ...newErrors.address, postalCode: 'Postal code is required' };
    }

    if (!formData.personalInfo.gender) {
      newErrors.personalInfo = { ...newErrors.personalInfo, gender: 'Gender is required' };
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof FormData] as any),
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }

    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const handleDateSelect = (day: string, month: string, year: string) => {
    setSelectedDate({ day, month, year });
    const monthIndex = months.indexOf(month) + 1;
    const formattedDate = `${year}-${monthIndex.toString().padStart(2, '0')}-${day.padStart(2, '0')}`;
    
    setFormData(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        birthDate: formattedDate
      }
    }));

    setShowDatePicker(false);
  };

  const handleSave = () => {
    console.log('🔍 EditProfileForm: Save button pressed');
    console.log('🔍 Form data:', formData);
    
    const isValid = validateForm();
    console.log('🔍 Form validation result:', isValid);
    console.log('🔍 Current errors:', errors);
    
    if (isValid) {
      console.log('✅ Form is valid, calling onSave with data:', formData);
      onSave(formData);
    } else {
      console.log('❌ Form validation failed, not calling onSave');
    }
  };

  const renderInputField = (
    label: string,
    field: string,
    value: string,
    placeholder: string,
    icon: React.ReactNode,
    keyboardType: 'default' | 'email-address' | 'numeric' = 'default'
  ) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={[styles.inputContainer, errors[field as keyof FormErrors] && styles.inputError]}>
        {icon}
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={(text) => handleInputChange(field, text)}
          placeholder={placeholder}
          placeholderTextColor={COLORS.gray400}
          keyboardType={keyboardType}
        />
      </View>
      {errors[field as keyof FormErrors] && (
        <Text style={styles.errorText}>{String(errors[field as keyof FormErrors])}</Text>
      )}
    </View>
  );

  const renderAddressField = (
    label: string,
    field: string,
    value: string,
    placeholder: string
  ) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={[styles.inputContainer, errors.address?.[field as keyof typeof formData.address] && styles.inputError]}>
        <MapPin size={20} color={COLORS.gray400} />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={(text) => handleInputChange(`address.${field}`, text)}
          placeholder={placeholder}
          placeholderTextColor={COLORS.gray400}
        />
      </View>
      {errors.address?.[field as keyof typeof formData.address] && (
        <Text style={styles.errorText}>{errors.address[field as keyof typeof formData.address]}</Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Personal Information Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <User size={20} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Personal Information</Text>
        </View>

        {renderInputField(
          'First Name',
          'firstName',
          formData.firstName,
          'Enter your first name',
          <User size={20} color={COLORS.gray400} />
        )}

        {renderInputField(
          'Last Name',
          'lastName',
          formData.lastName,
          'Enter your last name',
          <User size={20} color={COLORS.gray400} />
        )}

        {renderInputField(
          'Email',
          'email',
          formData.email,
          'Enter your email',
          <Mail size={20} color={COLORS.gray400} />,
          'email-address'
        )}

        {renderInputField(
          'Phone Number',
          'phoneNumber',
          formData.phoneNumber,
          '09XXXXXXXXX',
          <Phone size={20} color={COLORS.gray400} />,
          'numeric'
        )}

        {/* Gender Selection */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Gender</Text>
          <View style={styles.genderContainer}>
            <TouchableOpacity
              style={[
                styles.genderOption,
                formData.personalInfo.gender === 'male' && styles.genderOptionSelected
              ]}
              onPress={() => handleInputChange('personalInfo.gender', 'male')}
            >
              <Text style={[
                styles.genderText,
                formData.personalInfo.gender === 'male' && styles.genderTextSelected
              ]}>
                Male
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.genderOption,
                formData.personalInfo.gender === 'female' && styles.genderOptionSelected
              ]}
              onPress={() => handleInputChange('personalInfo.gender', 'female')}
            >
              <Text style={[
                styles.genderText,
                formData.personalInfo.gender === 'female' && styles.genderTextSelected
              ]}>
                Female
              </Text>
            </TouchableOpacity>
          </View>
          {errors.personalInfo?.gender && (
            <Text style={styles.errorText}>{errors.personalInfo.gender}</Text>
          )}
        </View>

        {/* Birth Date */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Birth Date</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Calendar size={20} color={COLORS.gray400} />
            <Text style={styles.dateButtonText}>
              {selectedDate.day && selectedDate.month && selectedDate.year
                ? `${selectedDate.month} ${selectedDate.day}, ${selectedDate.year}`
                : 'Select your birth date'
              }
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Address Information Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MapPin size={20} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Address Information</Text>
        </View>

        {renderAddressField(
          'House Number',
          'houseNumber',
          formData.address.houseNumber,
          'Enter house number'
        )}

        {renderAddressField(
          'Street Name',
          'streetName',
          formData.address.streetName,
          'Enter street name'
        )}

        {renderAddressField(
          'Barangay',
          'barangay',
          formData.address.barangay,
          'Enter barangay'
        )}

        {renderAddressField(
          'City/Municipality',
          'cityMunicipality',
          formData.address.cityMunicipality,
          'Enter city or municipality'
        )}

        {renderAddressField(
          'Province',
          'province',
          formData.address.province,
          'Enter province'
        )}

        {renderAddressField(
          'Postal Code',
          'postalCode',
          formData.address.postalCode,
          'Enter postal code'
        )}
      </View>

      {/* Save Button */}
      <TouchableOpacity
        style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={isLoading}
      >
        <Text style={styles.saveButtonText}>
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Text>
      </TouchableOpacity>

      {/* Date Picker Modal */}
      {showDatePicker && (
        <View style={styles.modalOverlay}>
          <View style={styles.datePickerModal}>
            <Text style={styles.modalTitle}>Select Birth Date</Text>
            
            <View style={styles.datePickerContainer}>
              <View style={styles.datePickerColumn}>
                <Text style={styles.datePickerLabel}>Month</Text>
                <ScrollView style={styles.datePickerScroll}>
                  {months.map((month) => (
                    <TouchableOpacity
                      key={month}
                      style={[
                        styles.datePickerOption,
                        selectedDate.month === month && styles.datePickerOptionSelected
                      ]}
                      onPress={() => setSelectedDate(prev => ({ ...prev, month }))}
                    >
                      <Text style={[
                        styles.datePickerOptionText,
                        selectedDate.month === month && styles.datePickerOptionTextSelected
                      ]}>
                        {month}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.datePickerColumn}>
                <Text style={styles.datePickerLabel}>Day</Text>
                <ScrollView style={styles.datePickerScroll}>
                  {days.map((day) => (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.datePickerOption,
                        selectedDate.day === day.toString() && styles.datePickerOptionSelected
                      ]}
                      onPress={() => setSelectedDate(prev => ({ ...prev, day: day.toString() }))}
                    >
                      <Text style={[
                        styles.datePickerOptionText,
                        selectedDate.day === day.toString() && styles.datePickerOptionTextSelected
                      ]}>
                        {day}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.datePickerColumn}>
                <Text style={styles.datePickerLabel}>Year</Text>
                <ScrollView style={styles.datePickerScroll}>
                  {years.map((year) => (
                    <TouchableOpacity
                      key={year}
                      style={[
                        styles.datePickerOption,
                        selectedDate.year === year.toString() && styles.datePickerOptionSelected
                      ]}
                      onPress={() => setSelectedDate(prev => ({ ...prev, year: year.toString() }))}
                    >
                      <Text style={[
                        styles.datePickerOptionText,
                        selectedDate.year === year.toString() && styles.datePickerOptionTextSelected
                      ]}>
                        {year}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={() => handleDateSelect(selectedDate.day, selectedDate.month, selectedDate.year)}
                disabled={!selectedDate.day || !selectedDate.month || !selectedDate.year}
              >
                <Text style={[styles.modalButtonText, styles.modalButtonTextPrimary]}>
                  Select
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  section: {
    backgroundColor: COLORS.white,
    marginBottom: SPACING.md,
    padding: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray800,
    marginLeft: SPACING.sm,
  },
  inputGroup: {
    marginBottom: SPACING.lg,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray700,
    marginBottom: SPACING.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray50,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.gray800,
    marginLeft: SPACING.sm,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: SPACING.xs,
  },
  genderContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  genderOption: {
    flex: 1,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.gray300,
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  genderOptionSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  genderText: {
    fontSize: 16,
    color: COLORS.gray700,
    fontWeight: '500',
  },
  genderTextSelected: {
    color: COLORS.white,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.gray50,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  dateButtonText: {
    fontSize: 16,
    color: COLORS.gray800,
    marginLeft: SPACING.sm,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.lg,
    borderRadius: 8,
    alignItems: 'center',
    margin: SPACING.lg,
  },
  saveButtonDisabled: {
    backgroundColor: COLORS.gray400,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  datePickerModal: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.lg,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray800,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  datePickerContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  datePickerColumn: {
    flex: 1,
  },
  datePickerLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.gray700,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  datePickerScroll: {
    maxHeight: 200,
  },
  datePickerOption: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 6,
    marginBottom: SPACING.xs,
    alignItems: 'center',
  },
  datePickerOptionSelected: {
    backgroundColor: COLORS.primary,
  },
  datePickerOptionText: {
    fontSize: 14,
    color: COLORS.gray700,
  },
  datePickerOptionTextSelected: {
    color: COLORS.white,
    fontWeight: '500',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  modalButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.gray300,
  },
  modalButtonPrimary: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  modalButtonText: {
    fontSize: 16,
    color: COLORS.gray700,
    fontWeight: '500',
  },
  modalButtonTextPrimary: {
    color: COLORS.white,
  },
});
