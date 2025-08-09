import { useState } from 'react';
import { PassengerProfile } from '../../../shared/types/passenger';

export const usePassengerState = () => {
  // Mock passenger profile data
  const passengerProfile: PassengerProfile = {
    firstName: 'Biya',
    lastName: 'Bot',
    email: 'biyabot@email.com',
    phoneNumber: '0912 345 6789',
    username: 'biyabot',
    address: {
      houseNumber: 'BLK1, LOT2',
      streetName: 'Lancaster New City',
      barangay: 'Pasong Camachile I',
      cityMunicipality: 'General Trias',
      province: 'Cavite',
      postalCode: '4107',
    },
    personalInfo: {
      birthDate: '2004-03-25',
      gender: 'male',
    },
    fareDiscount: {
      type: 'Student',
      document: {
        uri: 'https://example.com/student-id.jpg',
        name: 'student_id_2024.jpg',
        type: 'image/jpeg',
      },
    },
  };

  return {
    passengerProfile,
  };
};
