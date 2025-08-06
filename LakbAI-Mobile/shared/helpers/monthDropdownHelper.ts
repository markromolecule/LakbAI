import { MONTHS_DATA, PLACEHOLDERS } from '../../constants/registerField';
import { SignUpData } from '../types/authentication';

export const getSelectedMonthLabel = (selectedMonth: string): string => {
  const selected = MONTHS_DATA.find(m => m.value === selectedMonth);
  return selected ? selected.label : PLACEHOLDERS.MONTH;
};

export const selectMonth = (
  month: { label: string; value: string },
  updateSignUpData: (field: keyof SignUpData, value: any) => void,
  setShowMonthDropdown: (show: boolean) => void
) => {
  updateSignUpData('birthMonth', month.value);
  setShowMonthDropdown(false);
};