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
    status: 'none' | 'pending' | 'approved' | 'rejected';
    percentage: number;
    document: {
      uri: string;
      name: string;
      type: string;
    } | null;
    applicationDate?: string;
    verifiedBy?: string;
    verifiedAt?: string;
  };
}

// New interface for passenger profile with discount status
export interface PassengerProfile {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  username: string;
  picture?: string; // Profile picture URL from Auth0
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
  fareDiscount: {
    type: 'PWD' | 'Pregnant' | 'Senior Citizen' | 'Student' | '';
    status: 'none' | 'pending' | 'approved' | 'rejected';
    percentage: number;
    document: {
      uri: string;
      name: string;
      type: string;
    } | null;
    applicationDate?: string;
    verifiedBy?: string;
    verifiedAt?: string;
  };
}