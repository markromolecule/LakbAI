import { useState, useEffect, useMemo, useCallback } from 'react';
import { PassengerProfile } from '../../../shared/types/authentication';
import { useAuthContext } from '../../../shared/providers/AuthProvider';
import sessionManager from '../../../shared/services/sessionManager';

export const usePassengerState = () => {
  const { isAuthenticated, user, session } = useAuthContext();
  const [passengerProfile, setPassengerProfile] = useState<PassengerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Default passenger profile for fallback (no hardcoded data)
  const defaultPassengerProfile: PassengerProfile = {
    firstName: 'User',
    lastName: '',
    email: '',
    phoneNumber: '',
    username: 'user',
    address: {
      houseNumber: '',
      streetName: '',
      barangay: '',
      cityMunicipality: '',
      province: '',
      postalCode: '',
    },
    personalInfo: {
      birthDate: '',
      gender: 'male',
    },
    fareDiscount: {
      type: '',
      status: 'none',
      percentage: 0,
      document: null,
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
        const isTraditionalUser = !isAuth0User && (user.provider === 'traditional' || user.connection === 'database' || user.connection === 'oauth'); // Check if user is traditional

        console.log('🔍 usePassengerState: User type detection:', { 
          isAuth0User, 
          isTraditionalUser, 
          userSub: user.sub, 
          userProvider: user.provider,
          userConnection: user.connection,
          hasSessionData: !!session?.dbUserData,
          sessionDataSample: session?.dbUserData ? {
            first_name: session.dbUserData.first_name,
            last_name: session.dbUserData.last_name,
            email: session.dbUserData.email
          } : null
        });

        // For Auth0 users, check if we need to refresh data from backend
        if (isAuth0User && session?.dbUserData) {
          console.log('🔍 usePassengerState: Auth0 user with session data:', session.dbUserData);
          let dbUser = session.dbUserData;
          
          // If profile is marked as incomplete but user is on home screen, refresh data
          if (dbUser.profile_completed === 0 || dbUser.profile_completed === false) {
            console.log('🔄 usePassengerState: Profile marked incomplete, refreshing from backend...');
            try {
              const syncResult = await sessionManager.syncUserWithDatabase(user);
              if (syncResult.status === 'success' && syncResult.data?.user) {
                dbUser = syncResult.data.user;
                console.log('✅ usePassengerState: Got fresh user data from backend');
              }
            } catch (refreshError) {
              console.error('❌ usePassengerState: Error refreshing data:', refreshError);
            }
          }
          
          // Verify the session data belongs to the current user
          console.log('🔍 usePassengerState: Verifying session data:', {
            dbUserAuth0Id: dbUser.auth0_id,
            userSub: user.sub,
            match: dbUser.auth0_id === user.sub
          });
          
          if (dbUser.auth0_id === user.sub) {
            console.log('✅ usePassengerState: Using stored database user data for Auth0 user');
            const profile: PassengerProfile = {
              firstName: dbUser.first_name || dbUser.name?.split(' ')[0] || '',
              lastName: dbUser.last_name || dbUser.name?.split(' ').slice(1).join(' ') || '',
              email: dbUser.email || '',
              phoneNumber: dbUser.phone_number || '',
              username: dbUser.username || dbUser.nickname || 'user',
              picture: dbUser.picture || undefined,
              address: {
                houseNumber: dbUser.house_number || '',
                streetName: dbUser.street_name || '',
                barangay: dbUser.barangay || '',
                cityMunicipality: dbUser.city_municipality || '',
                province: dbUser.province || '',
                postalCode: dbUser.postal_code || '',
              },
              personalInfo: {
                birthDate: dbUser.birthday || '',
                gender: dbUser.gender ? (dbUser.gender.toLowerCase() === 'male' ? 'male' : 'female') : '',
              },
              fareDiscount: {
                type: dbUser.discount_type || '' as const,
                status: dbUser.discount_applied && dbUser.discount_status === 'approved' ? 'approved' as const : 
                       dbUser.discount_applied && dbUser.discount_status === 'pending' ? 'pending' as const :
                       dbUser.discount_applied && dbUser.discount_status === 'rejected' ? 'rejected' as const : 'none' as const,
                percentage: dbUser.discount_amount ? parseFloat(dbUser.discount_amount) : (dbUser.discount_type === 'Student' ? 20 : 
                           dbUser.discount_type === 'PWD' ? 20 :
                           dbUser.discount_type === 'Senior Citizen' ? 30 : 0),
                document: dbUser.discount_document_path ? {
                  uri: dbUser.discount_document_path,
                  name: dbUser.discount_document_name || 'document',
                  type: 'image/jpeg',
                } : null,
              },
              // Verification fields
              isVerified: dbUser.is_verified === 1 || dbUser.is_verified === true,
              verificationStatus: (dbUser.is_verified === 1 || dbUser.is_verified === true) ? 'verified' as const : 'unverified' as const,
            };
            console.log('✅ usePassengerState: Profile created from database data:', profile);
            setPassengerProfile(profile);
            return;
          } else {
            console.log('⚠️ usePassengerState: Session data mismatch, clearing stale data');
            console.log('🔍 Mismatch details:', {
              dbUserAuth0Id: dbUser.auth0_id,
              userSub: user.sub,
              dbUserEmail: dbUser.email,
              userEmail: user.email
            });
            // Session data doesn't match current user, clear it
            setPassengerProfile(null);
          }
        }

        // For traditional users or Auth0 users without valid session data
        if (isTraditionalUser || (session?.dbUserData && !session.dbUserData.auth0_id)) {
          console.log('✅ usePassengerState: Creating profile for traditional user');
          console.log('🔍 Taking traditional user path because:', {
            isTraditionalUser,
            hasSessionData: !!session?.dbUserData,
            sessionDataHasNoAuth0Id: session?.dbUserData && !session.dbUserData.auth0_id
          });
          console.log('🔍 Traditional user data source:', { 
            hasSessionData: !!session?.dbUserData, 
            sessionAuth0Id: session?.dbUserData?.auth0_id,
            userAuth0Id: user?.sub 
          });
          
          // Use session.dbUserData for traditional users (contains the actual database data)
          const traditionalUser = session?.dbUserData || user as any;
          console.log('🔍 Traditional user data:', traditionalUser);
          
          const profile: PassengerProfile = {
            firstName: traditionalUser.first_name || traditionalUser.name?.split(' ')[0] || 'User',
            lastName: traditionalUser.last_name || traditionalUser.name?.split(' ').slice(1).join(' ') || '',
            email: traditionalUser.email || '',
            phoneNumber: traditionalUser.phone_number || '',
            username: traditionalUser.username || traditionalUser.name || 'user',
            picture: traditionalUser.picture || undefined,
            address: {
              houseNumber: traditionalUser.house_number || '',
              streetName: traditionalUser.street_name || '',
              barangay: traditionalUser.barangay || '',
              cityMunicipality: traditionalUser.city_municipality || '',
              province: traditionalUser.province || '',
              postalCode: traditionalUser.postal_code || '',
            },
            personalInfo: {
              birthDate: traditionalUser.birthday || '',
              gender: traditionalUser.gender?.toLowerCase() === 'male' ? 'male' : 'female',
            },
            fareDiscount: {
              type: traditionalUser.discount_type || '' as const,
              status: traditionalUser.discount_applied && traditionalUser.discount_status === 'approved' ? 'approved' as const : 
                     traditionalUser.discount_applied && traditionalUser.discount_status === 'pending' ? 'pending' as const :
                     traditionalUser.discount_applied && traditionalUser.discount_status === 'rejected' ? 'rejected' as const : 'none' as const,
              percentage: traditionalUser.discount_amount ? parseFloat(traditionalUser.discount_amount) : (traditionalUser.discount_type === 'Student' ? 20 : 
                         traditionalUser.discount_type === 'PWD' ? 20 :
                         traditionalUser.discount_type === 'Senior Citizen' ? 30 : 0),
              document: traditionalUser.discount_document_path ? {
                uri: traditionalUser.discount_document_path,
                name: traditionalUser.discount_document_name || 'document',
                type: 'image/jpeg',
              } : null,
            },
          };
          console.log('✅ usePassengerState: Profile created from traditional user data:', profile);
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
        console.log('🔍 Profile creation failed, using default profile. User data was:', {
          isAuthenticated,
          userSub: user?.sub,
          userProvider: user?.provider,
          userConnection: user?.connection,
          hasSession: !!session,
          hasDbUserData: !!session?.dbUserData
        });
        setError(err instanceof Error ? err.message : 'Failed to create profile');
        setPassengerProfile(defaultPassengerProfile);
      } finally {
        setIsLoading(false);
      }
    };

    createPassengerProfile();
  }, [isAuthenticated, user, session]);

  // Return the profile data, with fallback to default data if not authenticated
  const profileToReturn = useMemo(() => {
    console.log('🎯 Profile Selection Debug:', {
      isAuthenticated,
      hasPassengerProfile: !!passengerProfile,
      passengerProfileDiscount: passengerProfile?.fareDiscount,
      userEmail: user?.email,
      sessionAuth0Id: session?.auth0Id
    });
    
    if (isAuthenticated && passengerProfile) {
      console.log('✅ Using authenticated passenger profile');
      return passengerProfile;
    }
    console.log('⚠️ Using default passenger profile');
    return defaultPassengerProfile;
  }, [isAuthenticated, passengerProfile]);

  const refreshProfile = useCallback(async () => {
    if (!isAuthenticated || !user) return;
    
    try {
      setIsLoading(true);
      console.log('🔄 usePassengerState: Manually refreshing profile data...');
      
      // Check if this is a traditional user
      const isAuth0User = user.sub && (user.sub.startsWith('google-oauth2|') || user.sub.startsWith('auth0|'));
      const isTraditionalUser = !isAuth0User && (user.provider === 'traditional' || user.connection === 'database' || user.connection === 'oauth');
      
      let dbUser = null;
      
      if (isTraditionalUser) {
        // For traditional users, call the profile endpoint directly
        console.log('🔄 usePassengerState: Refreshing traditional user profile...');
        const { getBaseUrl } = require('../../../config/apiConfig');
        const profileResponse = await fetch(`${getBaseUrl()}/profile?user_id=${user.sub}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (profileResponse.ok) {
          const profileResult = await profileResponse.json();
          if (profileResult.status === 'success' && profileResult.user) {
            dbUser = profileResult.user;
            console.log('✅ usePassengerState: Got fresh traditional user data from backend');
          }
        }
      } else {
        // For Auth0 users, check if session data is more recent than backend data
        if (session?.dbUserData?.updated_at) {
          console.log('🔍 usePassengerState: Checking if session data is more recent than backend...');
          const sessionUpdateTime = new Date(session.dbUserData.updated_at).getTime();
          const now = Date.now();
          const timeDiff = now - sessionUpdateTime;
          
          // If session data was updated within the last 30 seconds, use it instead of backend sync
          if (timeDiff < 30000) {
            console.log('✅ usePassengerState: Using recent session data (updated', Math.round(timeDiff / 1000), 'seconds ago)');
            dbUser = session.dbUserData;
          } else {
            console.log('🔄 usePassengerState: Session data is old, syncing with backend...');
            const syncResult = await sessionManager.syncUserWithDatabase(user);
            if (syncResult.status === 'success' && syncResult.data?.user) {
              dbUser = syncResult.data.user;
              console.log('✅ usePassengerState: Got fresh Auth0 user data from backend');
            }
          }
        } else {
          // No session data or no updated_at, sync with backend
          console.log('🔄 usePassengerState: No session data or timestamp, syncing with backend...');
          const syncResult = await sessionManager.syncUserWithDatabase(user);
          if (syncResult.status === 'success' && syncResult.data?.user) {
            dbUser = syncResult.data.user;
            console.log('✅ usePassengerState: Got fresh Auth0 user data from backend');
          }
        }
      }
      
      if (dbUser) {
        // Update session data with fresh user data to prevent stale data override
        if (isTraditionalUser && session) {
          const updatedSession = {
            ...session,
            dbUserData: dbUser
          };
          await sessionManager.setTraditionalUserSession(updatedSession);
          console.log('✅ usePassengerState: Session data updated with fresh user data');
        }
        
        const profile: PassengerProfile = {
          firstName: dbUser.first_name || dbUser.name?.split(' ')[0] || '',
          lastName: dbUser.last_name || dbUser.name?.split(' ').slice(1).join(' ') || '',
          email: dbUser.email || '',
          phoneNumber: dbUser.phone_number || '',
          username: dbUser.username || dbUser.nickname || 'user',
          picture: dbUser.picture || undefined,
          address: {
            houseNumber: dbUser.house_number || '',
            streetName: dbUser.street_name || '',
            barangay: dbUser.barangay || '',
            cityMunicipality: dbUser.city_municipality || '',
            province: dbUser.province || '',
            postalCode: dbUser.postal_code || '',
          },
          personalInfo: {
            birthDate: dbUser.birthday || '',
            gender: dbUser.gender ? (dbUser.gender.toLowerCase() === 'male' ? 'male' : 'female') : '',
          },
          fareDiscount: {
            type: dbUser.discount_type || '' as const,
            status: dbUser.discount_applied ? (dbUser.discount_status || (dbUser.discount_verified ? 'approved' as const : 'pending' as const)) : 'none' as const,
            percentage: dbUser.discount_amount || (dbUser.discount_type === 'Student' ? 20 : 
                       dbUser.discount_type === 'PWD' ? 20 :
                       dbUser.discount_type === 'Senior Citizen' ? 30 : 0),
            document: dbUser.discount_document_path ? {
              uri: dbUser.discount_document_path,
              name: dbUser.discount_document_name || 'document',
              type: 'image/jpeg',
            } : null,
          },
          // Verification fields
          isVerified: dbUser.is_verified === 1 || dbUser.is_verified === true,
          verificationStatus: (dbUser.is_verified === 1 || dbUser.is_verified === true) ? 'verified' as const : 'unverified' as const,
        };
        
        setPassengerProfile(profile);
        console.log('✅ usePassengerState: Profile refreshed successfully');
      }
    } catch (error) {
      console.error('❌ usePassengerState: Error refreshing profile:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  return {
    passengerProfile: profileToReturn,
    isLoading,
    error,
    refreshProfile,
  };
};
