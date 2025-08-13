import React from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { HELP_TEXTS, MONTHS_DATA, PLACEHOLDERS } from '../../../../constants/registerField';
import { getSelectedMonthLabel, selectMonth } from '../../../../shared/helpers/monthDropdownHelper';
import styles from '../../styles/RegisterScreen.styles';
import { BirthdaySectionProps } from './common/types';

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
          placeholderTextColor="#9CA3AF"
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
          placeholderTextColor="#9CA3AF"
          keyboardType="numeric"
          maxLength={4}
        />
      </View>
    </View>
    <Text style={styles.helpText}>{HELP_TEXTS.BIRTH_DATE}</Text>
  </>
);





