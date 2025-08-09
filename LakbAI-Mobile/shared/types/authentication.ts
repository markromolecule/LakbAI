export interface LoginData {
  username: string;
  password: string;
}

export interface SignUpData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
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
  fareDiscount: {
    type: 'PWD' | 'Pregnant' | 'Senior Citizen' | 'Student' | '';
    document: {
      uri: string;
      name: string;
      type: string;
    } | null;
  };
}