// Validation functions for user input in the SignUpScreen
import { MONTHS_DATA } from '../../constants/registerField';

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
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