// Common types for register form components
import { SignUpData } from '../../../../../shared/types/authentication';

export interface FormSectionProps {
  signUpData: SignUpData;
  updateSignUpData: (field: keyof SignUpData, value: any) => void;
}

export interface PasswordSectionProps extends FormSectionProps {
  showPassword: boolean;
  showConfirmPassword: boolean;
  togglePasswordVisibility: () => void;
  toggleConfirmPasswordVisibility: () => void;
}

export interface BirthdaySectionProps extends FormSectionProps {
  showMonthDropdown: boolean;
  toggleMonthDropdown: () => void;
  handleDateInput: (value: string) => void;
  handleYearInput: (value: string) => void;
}

export interface PhoneSectionProps extends FormSectionProps {
  handlePhoneInput: (value: string) => void;
}

export interface TermsSectionProps extends FormSectionProps {
  onTermsPress: () => void;
}

export interface FareDiscountSectionProps extends FormSectionProps {
  showDiscountDropdown: boolean;
  toggleDiscountDropdown: () => void;
  handleDiscountTypeSelect: (type: 'PWD' | 'Pregnant' | 'Senior Citizen' | 'Student' | '') => void;
  handleDocumentUpload: (document: { uri: string; name: string; type: string } | null) => void;
}
