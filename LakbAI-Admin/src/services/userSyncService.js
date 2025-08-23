/**
 * Service to sync Auth0 users with backend database for Admin App
 */
class UserSyncService {
  constructor() {
    // Use localhost for admin app since it runs on the same machine as the backend
    this.baseUrl = 'http://localhost/LakbAI/LakbAI-API';
  }

  /**
   * Sync current Auth0 user to backend database
   */
  async syncCurrentUser(user, accessToken) {
    try {
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
  async syncUser(user, accessToken) {
    try {
      // Get user roles from Auth0 user object
      const roles = user['https://lakbai.com/roles'] || [];
      
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
        phone_number: user.user_metadata?.phone_number,
        address: user.user_metadata?.address,
        birthday: user.user_metadata?.birthday,
        gender: user.user_metadata?.gender,
        created_at: user.created_at,
        updated_at: user.updated_at
      };

      const response = await fetch(`${this.baseUrl}/routes/auth0_sync_routes.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-User-Sync': 'frontend-triggered'
        },
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Sync request failed');
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
   * Sync user after driver signup
   */
  async syncAfterDriverSignup(user, accessToken, profileData = null) {
    try {
      if (!user || !accessToken) {
        throw new Error('User not authenticated');
      }

      // Merge driver signup data with Auth0 user data
      const mergedUserData = {
        auth0_id: user.sub || user.user_id,
        email: user.email,
        name: user.name || user.nickname || user.email,
        email_verified: user.email_verified || false,
        picture: user.picture,
        provider: user.identities?.[0]?.provider || 'auth0',
        connection: user.identities?.[0]?.connection,
        user_type: 'driver',
        roles: ['driver'],
        // Add profile data if provided
        phone_number: profileData?.phoneNumber || user.user_metadata?.phone_number,
        address: profileData?.address || user.user_metadata?.address,
        birthday: profileData?.birthday || user.user_metadata?.birthday,
        gender: profileData?.gender || user.user_metadata?.gender,
        first_name: profileData?.firstName,
        last_name: profileData?.lastName,
        created_at: user.created_at,
        updated_at: user.updated_at
      };

      return await this.syncUser(mergedUserData, accessToken);
    } catch (error) {
      console.error('Failed to sync after driver signup:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Driver signup sync failed'
      };
    }
  }
}

// Export singleton instance
export const userSyncService = new UserSyncService();
