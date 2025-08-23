import { auth0Service } from './auth0Service';
import { buildApiUrl } from '../../config/developerConfig';

/**
 * Service to sync Auth0 users with backend database
 */
class UserSyncService {
  private static instance: UserSyncService;
  private readonly baseUrl: string;
  private isSyncing: boolean = false;

  private constructor() {
    // Use the developer config to get the correct API URL
    const apiUrl = buildApiUrl();
    // Extract the base URL and point to the root server
    // apiUrl is: http://192.168.254.110:8000/LakbAI-API/routes/api.php
    // We need: http://192.168.254.110:8000
    this.baseUrl = apiUrl.replace('/LakbAI-API/routes/api.php', '');
  }

  static getInstance(): UserSyncService {
    if (!UserSyncService.instance) {
      UserSyncService.instance = new UserSyncService();
    }
    return UserSyncService.instance;
  }

  /**
   * Sync current Auth0 user to backend database
   */
  async syncCurrentUser(): Promise<{ success: boolean; message?: string }> {
    try {
      const user = await auth0Service.getCurrentUser();
      const accessToken = await auth0Service.getAccessToken();

      if (!user || !accessToken) {
        throw new Error('User not authenticated');
      }

      return await this.syncUser(user, accessToken);
    } catch (error) {
      console.error('Failed to sync current user:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Sync failed'
      };
    }
  }

  /**
   * Sync specific user to backend database
   */
  async syncUser(user: any, accessToken: string): Promise<{ success: boolean; message?: string }> {
    try {
      // Get user roles
      const { roles } = await auth0Service.getUserRoles();

      // Prepare user data
      const userData = {
        auth0_id: user.sub || user.user_id,
        email: user.email,
        name: user.name || user.nickname || user.email,
        nickname: user.nickname,
        email_verified: user.email_verified || false,
        picture: user.picture,
        provider: user.identities?.[0]?.provider || 'auth0',
        connection: user.identities?.[0]?.connection,
        user_type: roles.includes('driver') ? 'driver' : 'passenger',
        roles: roles,
        // Add user metadata if available
        first_name: user.user_metadata?.first_name,
        last_name: user.user_metadata?.last_name,
        phone_number: user.user_metadata?.phone_number,
        address: user.user_metadata?.address,
        birthday: user.user_metadata?.birthday,
        gender: user.user_metadata?.gender,
        created_at: user.created_at,
        updated_at: user.updated_at
      };

      const syncUrl = `${this.baseUrl}/routes/auth0_sync_routes.php`;
      console.log('Syncing user to:', syncUrl);
      console.log('User data:', userData);
      
      const response = await fetch(syncUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-User-Sync': 'frontend-triggered'
        },
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        let errorMessage = 'Sync request failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          // If JSON parsing fails, try to get the text response
          const textResponse = await response.text();
          console.error('Non-JSON response:', textResponse);
          errorMessage = `HTTP ${response.status}: ${textResponse.substring(0, 100)}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('User sync successful:', result);

      return {
        success: true,
        message: `User ${result.action} successfully`
      };

    } catch (error) {
      console.error('User sync error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Sync failed'
      };
    }
  }

  /**
   * Sync user after profile completion
   */
  async syncAfterProfileCompletion(userData: any): Promise<{ success: boolean; message?: string }> {
    // Prevent duplicate sync calls
    if (this.isSyncing) {
      console.log('Sync already in progress, skipping...');
      return { success: false, message: 'Sync already in progress' };
    }
    
    this.isSyncing = true;
    
    // Retry mechanism
    const maxRetries = 3;
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Profile sync attempt ${attempt}/${maxRetries}`);
        
        const result = await this.performProfileSync(userData);
        return result;
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        console.error(`Profile sync attempt ${attempt} failed:`, lastError.message);
        
        if (attempt < maxRetries) {
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }
    
    this.isSyncing = false;
    return {
      success: false,
      message: lastError?.message || 'Profile sync failed after all retries'
    };
  }
  
  /**
   * Perform the actual profile sync
   */
  private async performProfileSync(userData: any): Promise<{ success: boolean; message?: string }> {
    
    try {
      const user = await auth0Service.getCurrentUser();
      const accessToken = await auth0Service.getAccessToken();

      if (!user || !accessToken) {
        throw new Error('User not authenticated');
      }

      // Merge profile completion data with Auth0 user data
      const mergedUserData = {
        auth0_id: user.sub || user.user_id,
        email: user.email,
        name: user.name || user.nickname || user.email,
        email_verified: user.email_verified || false,
        picture: user.picture,
        provider: user.identities?.[0]?.provider || 'auth0',
        connection: user.identities?.[0]?.connection,
        // Profile completion data - use the provided data directly
        first_name: userData.first_name,
        last_name: userData.last_name,
        phone_number: userData.phone_number,
        address: userData.address,
        birthday: userData.birthday,
        gender: userData.gender,
        user_type: userData.user_type,
        roles: userData.roles || ['passenger'],
        profile_completed: true,
        created_at: user.created_at,
        updated_at: user.updated_at
      };

      const syncUrl = `${this.baseUrl}/routes/auth0_sync_routes.php`;
      console.log('Syncing profile completion to:', syncUrl);
      console.log('Profile data:', mergedUserData);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(syncUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-User-Sync': 'frontend-triggered'
        },
        body: JSON.stringify(mergedUserData),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      // Read response as text first to avoid "Already read" error
      const responseText = await response.text();
      
      if (!response.ok) {
        console.error('Profile sync failed with status:', response.status);
        console.error('Response text:', responseText);
        throw new Error(`HTTP ${response.status}: ${responseText.substring(0, 100)}`);
      }

      // Parse the response text as JSON
      let result;
      try {
        result = JSON.parse(responseText);
        console.log('Profile sync successful:', result);
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', responseText);
        throw new Error('Invalid JSON response from server');
      }

      return {
        success: true,
        message: `Profile ${result.action} successfully`
      };

    } catch (error) {
      console.error('Failed to perform profile sync:', error);
      
      let errorMessage = 'Profile sync failed';
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Profile sync timed out';
        } else {
          errorMessage = error.message;
        }
      }
      
      throw new Error(errorMessage);
    }
  }
}

// Export singleton instance
export const userSyncService = UserSyncService.getInstance();
