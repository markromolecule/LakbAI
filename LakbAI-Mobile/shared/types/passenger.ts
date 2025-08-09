export interface PassengerProfile {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  username: string;
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
    gender: 'male' | 'female';
  };
  fareDiscount: {
    type: 'PWD' | 'Pregnant' | 'Senior Citizen' | 'Student' | '';
    document: {
      uri: string;
      name: string;
      type: string;
    } | null;
  };

}

export interface PassengerViewProps {
  passengerProfile: PassengerProfile;
}
