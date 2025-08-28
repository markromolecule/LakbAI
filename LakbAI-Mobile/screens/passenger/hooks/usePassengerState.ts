import { useState, useEffect, useMemo } from 'react';
import { PassengerProfile } from '../../../shared/types/authentication';
import { useAuthContext } from '../../../shared/providers/AuthProvider';

export const usePassengerState = () => {
  const { isAuthenticated, user, session } = useAuthContext();
  const [passengerProfile, setPassengerProfile] = useState<PassengerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock passenger profile data for development/fallback
  const mockPassengerProfile: PassengerProfile = {
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

  useEffect(() => {
    const createPassengerProfile = async () => {
      console.log('🔍 usePassengerState: Creating profile...', { isAuthenticated, user, session });
      
      if (!isAuthenticated || !user) {
        console.log('❌ usePassengerState: Not authenticated or no user');
        setPassengerProfile(null);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Check if this is an Auth0 user or traditional user
        const isAuth0User = user.sub && (user.sub.startsWith('google-oauth2|') || user.sub.startsWith('auth0|'));
        const isTraditionalUser = !isAuth0User && session?.dbUserData && !session.dbUserData.auth0_id; // Traditional users have dbUserData but no auth0_id

        console.log('🔍 usePassengerState: User type detection:', { 
          isAuth0User, 
          isTraditionalUser, 
          userSub: user.sub, 
          hasId: 'id' in user,
          hasSessionData: !!session?.dbUserData,
          sessionAuth0Id: session?.dbUserData?.auth0_id
        });

        // For Auth0 users, only use session data if it matches the current user
        if (isAuth0User && session?.dbUserData) {
          const dbUser = session.dbUserData;
          
          // Verify the session data belongs to the current user
          if (dbUser.auth0_id === user.sub) {
            console.log('✅ usePassengerState: Using stored database user data for Auth0 user');
            const profile: PassengerProfile = {
              firstName: dbUser.first_name || dbUser.name?.split(' ')[0] || 'User',
              lastName: dbUser.last_name || dbUser.name?.split(' ').slice(1).join(' ') || '',
              email: dbUser.email || '',
              phoneNumber: dbUser.phone_number || 'N/A',
              username: dbUser.username || dbUser.nickname || 'user',
              picture: dbUser.picture || undefined,
              address: {
                houseNumber: dbUser.house_number || 'N/A',
                streetName: dbUser.street_name || 'N/A',
                barangay: dbUser.barangay || 'N/A',
                cityMunicipality: dbUser.city_municipality || 'N/A',
                province: dbUser.province || 'N/A',
                postalCode: dbUser.postal_code || 'N/A',
              },
              personalInfo: {
                birthDate: dbUser.birthday || 'N/A',
                gender: dbUser.gender?.toLowerCase() === 'male' ? 'male' : 'female',
              },
              fareDiscount: {
                type: dbUser.discount_type || '' as const,
                status: dbUser.discount_verified ? 'approved' as const : 'none' as const,
                percentage: dbUser.discount_type === 'Student' ? 15 : 
                           dbUser.discount_type === 'PWD' ? 20 :
                           dbUser.discount_type === 'Senior Citizen' ? 30 : 0,
                document: dbUser.discount_document_path ? {
                  uri: dbUser.discount_document_path,
                  name: dbUser.discount_document_name || 'document',
                  type: 'image/jpeg',
                } : null,
              },
            };
            console.log('✅ usePassengerState: Profile created from database data:', profile);
            setPassengerProfile(profile);
            return;
          } else {
            console.log('⚠️ usePassengerState: Session data mismatch, clearing stale data');
            // Session data doesn't match current user, clear it
            setPassengerProfile(null);
          }
        }

        // For traditional users or Auth0 users without valid session data
        if (isTraditionalUser && session?.dbUserData) {
          // Traditional user - use session data
          console.log('✅ usePassengerState: Creating profile for traditional user from session data');
          const dbUser = session.dbUserData;
          const profile: PassengerProfile = {
            firstName: dbUser.first_name || dbUser.name?.split(' ')[0] || 'User',
            lastName: dbUser.last_name || dbUser.name?.split(' ').slice(1).join(' ') || '',
            email: dbUser.email || '',
            phoneNumber: dbUser.phone_number || 'N/A',
            username: dbUser.username || dbUser.name || 'user',
            picture: dbUser.picture || undefined,
            address: {
              houseNumber: dbUser.house_number || 'N/A',
              streetName: dbUser.street_name || 'N/A',
              barangay: dbUser.barangay || 'N/A',
              cityMunicipality: dbUser.city_municipality || 'N/A',
              province: dbUser.province || 'N/A',
              postalCode: dbUser.postal_code || 'N/A',
            },
            personalInfo: {
              birthDate: dbUser.birthday || 'N/A',
              gender: dbUser.gender?.toLowerCase() === 'male' ? 'male' : 'female',
            },
            fareDiscount: {
              type: dbUser.discount_type || '' as const,
              status: dbUser.discount_verified ? 'approved' as const : 'none' as const,
              percentage: dbUser.discount_type === 'Student' ? 15 : 
                         dbUser.discount_type === 'PWD' ? 20 :
                         dbUser.discount_type === 'Senior Citizen' ? 30 : 0,
              document: dbUser.discount_document_path ? {
                uri: dbUser.discount_document_path,
                name: dbUser.discount_document_name || 'document',
                type: 'image/jpeg',
              } : null,
            },
          };
          console.log('✅ usePassengerState: Profile created from traditional user session data:', profile);
          setPassengerProfile(profile);
        } else {
          // Auth0 user without valid session data
          console.log('⚠️ usePassengerState: No valid database user data, using Auth0 data');
          const profile: PassengerProfile = {
            firstName: user.name?.split(' ')[0] || 'User',
            lastName: user.name?.split(' ').slice(1).join(' ') || '',
            email: user.email || '',
            phoneNumber: 'N/A',
            username: user.nickname || user.name || 'user',
            picture: user.picture || undefined,
            address: {
              houseNumber: 'N/A',
              streetName: 'N/A',
              barangay: 'N/A',
              cityMunicipality: 'N/A',
              province: 'N/A',
              postalCode: 'N/A',
            },
            personalInfo: {
              birthDate: 'N/A',
              gender: 'male',
            },
            fareDiscount: {
              type: '' as const,
              status: 'none' as const,
              percentage: 0,
              document: null,
            },
          };
          console.log('✅ usePassengerState: Profile created from Auth0 data:', profile);
          setPassengerProfile(profile);
        }
      } catch (err) {
        console.error('❌ usePassengerState: Error creating profile:', err);
        setError(err instanceof Error ? err.message : 'Failed to create profile');
        setPassengerProfile(mockPassengerProfile);
      } finally {
        setIsLoading(false);
      }
    };

    createPassengerProfile();
  }, [isAuthenticated, user, session]);

  // Return the profile data, with fallback to mock data if not authenticated
  const profileToReturn = useMemo(() => {
    if (isAuthenticated && passengerProfile) {
      return passengerProfile;
    }
    return mockPassengerProfile;
  }, [isAuthenticated, passengerProfile]);

  return {
    passengerProfile: profileToReturn,
    isLoading,
    error,
  };
};
