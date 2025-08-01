export interface LoginData {
  username: string;
  password: string;
}

export interface SignUpData {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  houseNumber: string;
  streetName: string;
  barangay: string;
  cityMunicipality: string;
  province: string;
  postalCode: string;
  birthMonth: string;
  birthDate: string;
  birthYear: string;
  gender: 'male' | 'female' | '';
  acceptedTerms: boolean;
}