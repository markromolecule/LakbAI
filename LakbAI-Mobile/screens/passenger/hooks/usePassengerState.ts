import { useState } from 'react';
import { PassengerProfile } from '../../../shared/types/authentication';

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
      status: 'approved',
      percentage: 15,
      document: {
        uri: 'https://example.com/student-id.jpg',
        name: 'student_id_2024.jpg',
        type: 'image/jpeg',
      },
      applicationDate: '2024-01-15T10:30:00Z',
      verifiedBy: 'Admin User',
      verifiedAt: '2024-01-16T14:20:00Z',
    },
  };

  return {
    passengerProfile,
  };
};
