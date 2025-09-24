import { buildAuth0Url, buildApiUrl } from '../../config/developerConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface DiscountApplication {
  discountType: string;
  document: {
    uri: string;
    name: string;
    type: string;
  };
}

export interface DiscountStatus {
  status: 'none' | 'pending' | 'approved' | 'rejected';
  type: string;
  percentage: number;
  document?: {
    uri: string;
    name: string;
    type: string;
  };
  applicationDate?: string;
  verifiedBy?: string;
  verifiedAt?: string;
}

class DiscountService {
  private baseUrl: string;
  private apiUrl: string;

  constructor() {
    // Use the Auth0 endpoint for legacy compatibility
    this.baseUrl = buildAuth0Url();
    // Use the API endpoint for new discount functionality
    this.apiUrl = buildApiUrl();
    console.log('DiscountService initialized with baseUrl:', this.baseUrl);
    console.log('DiscountService initialized with apiUrl:', this.apiUrl);
  }

  /**
   * Build API endpoint URL
   */
  private buildApiEndpoint(endpoint: string): string {
    // The API endpoints are accessed through the api.php file with the endpoint as a path
    // Convert from: http://ip:port/LakbAI/LakbAI-API/routes/api.php
    // To: http://ip:port/LakbAI/LakbAI-API/api/endpoint
    const baseApiUrl = this.apiUrl.replace('/routes/api.php', '/api');
    return `${baseApiUrl}/${endpoint}`;
  }

  /**
   * Submit a discount application
   */
  async submitApplication(application: DiscountApplication): Promise<{ success: boolean; message: string }> {
    try {
      // First upload the document
      const documentUpload = await this.uploadDocument(application.document);
      
      if (!documentUpload.success) {
        throw new Error(documentUpload.message || 'Failed to upload document');
      }

      // Get user ID from storage
      const userId = await this.getUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Submit the application to the new discount application endpoint
      const applicationUrl = this.buildApiEndpoint('discount-applications');
      console.log('📝 Submitting application to:', applicationUrl);
      console.log('📋 Application data:', { 
        userId, 
        discountType: application.discountType, 
        documentPath: documentUpload.documentPath, 
        documentName: application.document.name 
      });
      
      const response = await fetch(applicationUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          discount_type: application.discountType,
          document_path: documentUpload.documentPath,
          document_name: application.document.name,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Discount application response:', errorText);
        throw new Error('Failed to submit application');
      }

      const data = await response.json();
      return {
        success: data.status === 'success',
        message: data.message || 'Application submitted successfully',
      };
    } catch (error) {
      console.error('Error submitting discount application:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Get current discount status for a user
   */
  async getDiscountStatus(): Promise<DiscountStatus> {
    try {
      // Get user ID first
      const userId = await this.getUserId();
      if (!userId) {
        console.log('No user ID found, returning default discount status');
        return {
          status: 'none',
          type: '',
          percentage: 0,
        };
      }

      // Use the correct API endpoint
      const response = await fetch(`${this.apiUrl}/discount-status?user_id=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch discount status');
      }

      const data = await response.json();
      if (data.status === 'success' && data.data) {
        const discountData = data.data;
        return {
          status: discountData.discount_status || 'none',
          type: discountData.discount_type || '',
          percentage: discountData.discount_type === 'Student' ? 20 : 
                     discountData.discount_type === 'PWD' ? 20 :
                     discountData.discount_type === 'Senior Citizen' ? 30 : 0,
          document: discountData.discount_document_path ? {
            uri: discountData.discount_document_path,
            name: discountData.discount_document_name || 'document',
            type: 'image/jpeg',
          } : undefined,
        };
      }
      
      return {
        status: 'none',
        type: '',
        percentage: 0,
      };
    } catch (error) {
      console.error('Error fetching discount status:', error);
      return {
        status: 'none',
        type: '',
        percentage: 0,
      };
    }
  }

  /**
   * Upload document to server
   */
  private async uploadDocument(document: { uri: string; name: string; type: string }): Promise<{ success: boolean; documentPath?: string; message?: string }> {
    try {
      const formData = new FormData();
      formData.append('discount_document', {
        uri: document.uri,
        name: document.name,
        type: document.type,
      } as any);

      // Upload to the file upload endpoint
      const uploadUrl = this.buildApiEndpoint('upload-discount-document');
      console.log('📤 Uploading document to:', uploadUrl);
      console.log('📄 Document details:', { name: document.name, type: document.type, uri: document.uri.substring(0, 50) + '...' });

      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload response error:', errorText);
        throw new Error(`Upload failed with status ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status === 'success') {
        return {
          success: true,
          documentPath: data.data.file_path,
        };
      } else {
        throw new Error(data.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Get user ID from storage
   */
  private async getUserId(): Promise<string> {
    try {
      // Try multiple storage keys to find user ID
      console.log('🔍 Searching for user ID in AsyncStorage...');
      
      // Method 1: Check user_session for dbUserData
      const userSession = await AsyncStorage.getItem('user_session');
      if (userSession) {
        const session = JSON.parse(userSession);
        console.log('📋 User session data keys:', Object.keys(session));
        
        if (session.dbUserData && session.dbUserData.id) {
          const userId = session.dbUserData.id.toString();
          console.log('✅ Found user ID from session.dbUserData:', userId);
          return userId;
        }
        
        // Check if the session itself contains the database user data
        if (session.id && typeof session.id === 'number') {
          const userId = session.id.toString();
          console.log('✅ Found user ID from session.id:', userId);
          return userId;
        }
      }

      // Method 2: Check auth0_user_sync_data (might contain database user info)
      const syncData = await AsyncStorage.getItem('auth0_user_sync_data');
      if (syncData) {
        const sync = JSON.parse(syncData);
        console.log('📋 Auth0 sync data:', sync);
        if (sync.user && sync.user.id) {
          const userId = sync.user.id.toString();
          console.log('✅ Found user ID from sync data:', userId);
          return userId;
        }
        if (sync.data && sync.data.user && sync.data.user.id) {
          const userId = sync.data.user.id.toString();
          console.log('✅ Found user ID from sync data.data.user:', userId);
          return userId;
        }
      }

      // Method 2.5: Check auth0_sync_response (the latest auth response)
      const authResponse = await AsyncStorage.getItem('auth0_sync_response');
      if (authResponse) {
        const response = JSON.parse(authResponse);
        console.log('📋 Auth0 sync response:', response);
        if (response.data && response.data.user && response.data.user.id) {
          const userId = response.data.user.id.toString();
          console.log('✅ Found user ID from auth response:', userId);
          return userId;
        }
      }

      // Method 3: Check if there's a direct user_data storage
      const userData = await AsyncStorage.getItem('user_data');
      if (userData) {
        const user = JSON.parse(userData);
        console.log('📋 Direct user data:', user);
        if (user.id) {
          const userId = user.id.toString();
          console.log('✅ Found user ID from user data:', userId);
          return userId;
        }
      }

      // Method 4: Fallback to auth0 user profile (but this likely won't have database ID)
      const userProfile = await AsyncStorage.getItem('auth0_user_profile');
      if (userProfile) {
        const profile = JSON.parse(userProfile);
        console.log('📋 Auth0 profile data keys:', Object.keys(profile));
        const userId = profile.user_id || profile.id || '';
        if (userId) {
          console.log('✅ Found user ID from Auth0 profile:', userId);
          return userId;
        }
      }
      
      // Method 5: Check for any key that might contain the database user data
      const allKeys = await AsyncStorage.getAllKeys();
      console.log('📋 All AsyncStorage keys:', allKeys);
      
      // Check each key for user data
      for (const key of allKeys) {
        if (key.includes('user') || key.includes('auth') || key.includes('session')) {
          try {
            const data = await AsyncStorage.getItem(key);
            if (data) {
              const parsedData = JSON.parse(data);
              console.log(`📋 Checking ${key}:`, parsedData);
              
              // Look for user ID in various possible structures
              if (parsedData.id && typeof parsedData.id === 'number') {
                console.log(`✅ Found user ID from ${key}:`, parsedData.id);
                return parsedData.id.toString();
              }
              if (parsedData.user && parsedData.user.id) {
                console.log(`✅ Found user ID from ${key}.user:`, parsedData.user.id);
                return parsedData.user.id.toString();
              }
              if (parsedData.data && parsedData.data.user && parsedData.data.user.id) {
                console.log(`✅ Found user ID from ${key}.data.user:`, parsedData.data.user.id);
                return parsedData.data.user.id.toString();
              }
              if (parsedData.dbUserData && parsedData.dbUserData.id) {
                console.log(`✅ Found user ID from ${key}.dbUserData:`, parsedData.dbUserData.id);
                return parsedData.dbUserData.id.toString();
              }
            }
          } catch (e) {
            // Skip non-JSON data
            continue;
          }
        }
      }
      
      // Method 6: Get user ID by Auth0 ID lookup from database
      const auth0Id = await this.getAuth0Id();
      if (auth0Id) {
        console.log('🔍 Attempting to get user ID via Auth0 ID lookup:', auth0Id);
        const userId = await this.getUserIdByAuth0Id(auth0Id);
        if (userId) {
          console.log('✅ Found user ID via Auth0 lookup:', userId);
          return userId;
        }
      }
      
      console.error('❌ No user ID found in any storage location or via API lookup');
      return '';
    } catch (error) {
      console.error('❌ Error getting user ID:', error);
      return '';
    }
  }

  /**
   * Get user ID by Auth0 ID via API lookup
   */
  private async getUserIdByAuth0Id(auth0Id: string): Promise<string> {
    try {
      console.log('📡 Making API request to get user ID for Auth0 ID:', auth0Id);
      
      // Use the dedicated user-by-auth0-id endpoint
      const response = await fetch(`${this.baseUrl}/user-by-auth0-id`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          auth0_id: auth0Id,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📋 User lookup response:', data);
        
        if (data.status === 'success' && data.user?.id) {
          const userId = data.user.id.toString();
          console.log('✅ Successfully retrieved user ID via Auth0 lookup:', userId);
          
          // Store this for future use
          await this.storeUserDataInSession(data.user);
          
          return userId;
        }
      } else {
        const errorText = await response.text();
        console.error('❌ API response not ok:', response.status, response.statusText, errorText);
      }
      
      console.log('❌ Auth0 lookup failed');
      return '';
    } catch (error) {
      console.error('❌ Error looking up user ID by Auth0 ID:', error);
      return '';
    }
  }

  /**
   * Store user data in session for future use
   */
  private async storeUserDataInSession(userData: any): Promise<void> {
    try {
      const userSession = await AsyncStorage.getItem('user_session');
      if (userSession) {
        const session = JSON.parse(userSession);
        session.dbUserData = userData;
        await AsyncStorage.setItem('user_session', JSON.stringify(session));
        console.log('💾 Updated user session with database user data');
      }
    } catch (error) {
      console.error('❌ Error storing user data in session:', error);
    }
  }

  /**
   * Get Auth0 ID from storage
   */
  private async getAuth0Id(): Promise<string> {
    try {
      const userProfile = await AsyncStorage.getItem('auth0_user_profile');
      if (userProfile) {
        const profile = JSON.parse(userProfile);
        return profile.sub || '';
      }
      return '';
    } catch (error) {
      console.error('Error getting Auth0 ID:', error);
      return '';
    }
  }
}

export const discountService = new DiscountService();
