/**
 * Handler that will be called during the execution of a PostUserRegistration flow.
 * This action will sync newly created Auth0 users to the MySQL database.
 *
 * @param {Event} event - Details about the context and user that has registered.
 * @param {PostUserRegistrationAPI} api - Interface whose methods can be used to change the behavior of the registration.
 */
exports.onExecutePostUserRegistration = async (event, api) => {
  const { user } = event;
  
  try {
    console.log('Post User Registration - Syncing user to database:', user.user_id);
    
    // Prepare user data for database
    const userData = {
      auth0_id: user.user_id,
      email: user.email,
      name: user.name || user.nickname || user.email,
      email_verified: user.email_verified || false,
      picture: user.picture,
      provider: user.identities?.[0]?.provider || 'auth0',
      connection: user.identities?.[0]?.connection,
      created_at: user.created_at,
      // Add custom app metadata
      user_type: user.app_metadata?.user_type || 'passenger',
      roles: user.app_metadata?.roles || ['passenger'],
      // Add user metadata if available
      phone_number: user.user_metadata?.phone_number,
      address: user.user_metadata?.address,
      birthday: user.user_metadata?.birthday,
      gender: user.user_metadata?.gender
    };
    
    // Call your backend API to sync user
    const response = await fetch(`${event.secrets.BACKEND_API_URL}/api/auth0/sync-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${event.secrets.BACKEND_API_TOKEN}`,
        'X-Auth0-Action': 'post-user-registration'
      },
      body: JSON.stringify(userData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to sync user to database:', response.status, errorText);
      
      // Don't fail the registration, just log the error
      // You might want to implement a retry mechanism here
      return;
    }
    
    const result = await response.json();
    console.log('User successfully synced to database:', result);
    
  } catch (error) {
    console.error('Error in post-user-registration action:', error);
    
    // Don't fail the registration process
    // You might want to implement a dead letter queue for failed syncs
  }
};
