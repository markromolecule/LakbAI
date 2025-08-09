// Validation functions for user input in the SignUpScreen
import { MONTHS_DATA } from '../../constants/registerField';

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhoneNumber = (phoneNumber: string): boolean => {
  // Remove all non-digit characters for validation
  const cleanNumber = phoneNumber.replace(/\D/g, '');
  
  // Philippine mobile number formats:
  // 09XXXXXXXXX (11 digits starting with 09)
  // +639XXXXXXXXX (13 digits starting with +639)
  // 639XXXXXXXXX (12 digits starting with 639)
  
  if (cleanNumber.length === 11 && cleanNumber.startsWith('09')) {
    return true;
  }
  if (cleanNumber.length === 12 && cleanNumber.startsWith('639')) {
    return true;
  }
  if (cleanNumber.length === 13 && cleanNumber.startsWith('639')) {
    return true;
  }
  
  return false;
};

export const formatPhoneNumber = (phoneNumber: string): string => {
  // Remove all non-digit characters
  const cleanNumber = phoneNumber.replace(/\D/g, '');
  
  // Format as Philippine mobile number
  if (cleanNumber.length <= 11) {
    if (cleanNumber.length <= 4) {
      return cleanNumber;
    } else if (cleanNumber.length <= 7) {
      return `${cleanNumber.slice(0, 4)} ${cleanNumber.slice(4)}`;
    } else {
      return `${cleanNumber.slice(0, 4)} ${cleanNumber.slice(4, 7)} ${cleanNumber.slice(7, 11)}`;
    }
  }
  
  return phoneNumber;
};

export const validatePassword = (password: string): boolean => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

export const validateBirthDate = (day: string, month: string, year: string): boolean => {
  const dayNum = parseInt(day);
  const yearNum = parseInt(year);
  
  if (dayNum < 1 || dayNum > 31) return false;
  if (yearNum < 1920 || yearNum > 2025) return false;
  
  // Check days in month
  const monthIndex = MONTHS_DATA.findIndex(m => m.value === month);
  if (monthIndex === -1) return false;
  
  const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (dayNum > daysInMonth[monthIndex]) return false;
  
  // Check February for leap year
  if (monthIndex === 1 && dayNum === 29) {
    const isLeapYear = (yearNum % 4 === 0 && yearNum % 100 !== 0) || (yearNum % 400 === 0);
    return isLeapYear;
  }
  
  return true;
};