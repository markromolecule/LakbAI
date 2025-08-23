/**
 * LakbAI Role Assignment Rule
 * 
 * This Auth0 rule assigns roles and permissions based on the application 
 * the user is authenticating through, and sets up proper access control
 * for the LakbAI system.
 * 
 * To add this rule:
 * 1. Go to Auth0 Dashboard > Auth Pipeline > Rules
 * 2. Create Empty Rule
 * 3. Name it "LakbAI Role Assignment"
 * 4. Copy and paste this code
 * 5. Save and enable the rule
 */

function assignLakbAIRoles(user, context, callback) {
  const namespace = 'https://lakbai.com/';
  const clientId = context.clientID;
  const assignedAt = Math.floor(Date.now() / 1000);
  
  // LakbAI Application Client IDs
  const LAKBAI_ADMIN_CLIENT_ID = 'ysVIQhHKqNIFT1to9F0K40NuLh7xFvEN';
  const LAKBAI_MOBILE_CLIENT_ID = 'oRukVKxyipmWOeKTcP05u3MshZpk66f5';
  
  // Initialize user metadata if not exists
  user.app_metadata = user.app_metadata || {};
  user.user_metadata = user.user_metadata || {};
  
  // Default role and permissions
  let roles = [];
  let permissions = [];
  let appType = '';
  let isAdmin = false;
  
  // Get signup context from authorization parameters
  const signupContext = context.request.query.role || context.request.query.screen_hint || '';
  const isNewUser = context.stats && context.stats.loginsCount === 0;
  
  // Role assignment based on application and signup context
  if (clientId === LAKBAI_ADMIN_CLIENT_ID) {
    // LakbAI-Admin: Driver/Admin Application
    appType = 'admin';
    
    // Check if this is a new user signup or existing user login
    if (isNewUser || signupContext === 'signup') {
      // New signup on web - assign driver role
      roles = ['driver'];
      permissions = [
        // Driver permissions
        'read:drivers',
        'write:drivers',
        'manage:drivers',
        
        // Basic user permissions
        'read:profile',
        'write:profile',
        'read:routes',
        'read:fare_matrix',
        'calculate:fare',
        'read:locations',
        'track:location'
      ];
      isAdmin = false;
    } else {
      // Existing user login - check for admin privileges
      roles = ['driver'];
      permissions = [
        // Driver permissions
        'read:drivers',
        'write:drivers',
        'manage:drivers',
        
        // Basic user permissions
        'read:profile',
        'write:profile',
        'read:routes',
        'read:fare_matrix',
        'calculate:fare',
        'read:locations',
        'track:location'
      ];
      isAdmin = false;
    }
    
  } else if (clientId === LAKBAI_MOBILE_CLIENT_ID) {
    // LakbAI-Mobile: Passenger Application
    appType = 'mobile';
    
    // Check if this is a new user signup or existing user login
    if (isNewUser || signupContext === 'signup') {
      // New signup on mobile - assign passenger role
      roles = ['passenger'];
      permissions = [
        // Basic passenger permissions
        'read:passengers',
        'write:passengers',
        'read:profile',
        'write:profile',
        
        // Booking permissions
        'create:bookings',
        'read:bookings',
        'cancel:bookings',
        
        // Payment permissions
        'read:payments',
        'create:payments',
        
        // Route and fare permissions
        'read:routes',
        'read:fare_matrix',
        'calculate:fare',
        
        // Location permissions
        'read:locations',
        'track:location'
      ];
      isAdmin = false;
    } else {
      // Existing user login - check their existing roles
      // If user has driver role from web signup, allow them to use mobile
      if (user.app_metadata && user.app_metadata.lakbai && user.app_metadata.lakbai.roles) {
        const existingRoles = user.app_metadata.lakbai.roles;
        if (existingRoles.includes('driver')) {
          // Driver from web can use mobile app
          roles = ['driver'];
          permissions = [
            // Driver permissions for mobile
            'read:drivers',
            'write:drivers',
            'read:profile',
            'write:profile',
            'read:routes',
            'read:fare_matrix',
            'calculate:fare',
            'read:locations',
            'track:location'
          ];
        } else {
          // Passenger user
          roles = ['passenger'];
          permissions = [
            // Basic passenger permissions
            'read:passengers',
            'write:passengers',
            'read:profile',
            'write:profile',
            'create:bookings',
            'read:bookings',
            'cancel:bookings',
            'read:payments',
            'create:payments',
            'read:routes',
            'read:fare_matrix',
            'calculate:fare',
            'read:locations',
            'track:location'
          ];
        }
      } else {
        // Default to passenger for mobile
        roles = ['passenger'];
        permissions = [
          'read:passengers',
          'write:passengers',
          'read:profile',
          'write:profile',
          'create:bookings',
          'read:bookings',
          'cancel:bookings',
          'read:payments',
          'create:payments',
          'read:routes',
          'read:fare_matrix',
          'calculate:fare',
          'read:locations',
          'track:location'
        ];
      }
      isAdmin = false;
    }
    
  } else {
    // Unknown application - assign minimal permissions
    appType = 'unknown';
    roles = ['user'];
    permissions = ['read:profile'];
    isAdmin = false;
  }
  
  // Enhanced admin detection
  // Check if user email matches admin patterns or is explicitly marked as admin
  const adminEmails = [
    'livadomc@gmail.com',
    'admin@lakbai.com',
    'support@lakbai.com'
  ];
  
  const isAdminEmail = adminEmails.includes(user.email);
  
  // If user has admin email, ensure they get admin role regardless of app
  if (isAdminEmail && !roles.includes('admin')) {
    roles.push('admin');
    isAdmin = true;
    
    // Add admin permissions
    permissions = permissions.concat([
      // User management permissions
      'read:users',
      'write:users', 
      'delete:users',
      'manage:users',
      
      // Admin permissions
      'read:admin',
      'write:admin',
      'manage:admin',
      'access:dashboard',
      
      // System permissions
      'read:fare_matrix',
      'write:fare_matrix',
      'read:routes',
      'write:routes',
      'read:vehicles',
      'write:vehicles',
      'read:analytics',
      'manage:system'
    ]);
  }
  
  // Prepare custom claims for tokens
  const customClaims = {
    [namespace + 'roles']: roles,
    [namespace + 'permissions']: permissions,
    [namespace + 'app_type']: appType,
    [namespace + 'is_admin']: isAdmin,
    [namespace + 'assigned_at']: assignedAt
  };
  
  // Update user metadata
  user.app_metadata.lakbai = {
    roles: roles,
    permissions: permissions,
    app_type: appType,
    is_admin: isAdmin,
    assigned_at: assignedAt,
    last_updated: new Date().toISOString()
  };
  
  // Check if metadata needs updating
  const currentMetadata = user.app_metadata.lakbai || {};
  const needsUpdate = JSON.stringify(currentMetadata) !== JSON.stringify(user.app_metadata.lakbai);
  
  if (needsUpdate) {
    // Update user metadata in Auth0 (async operation)
    auth0.users.updateAppMetadata(user.user_id, user.app_metadata)
      .then(function() {
        console.log('User metadata updated successfully');
      })
      .catch(function(err) {
        console.log('Error updating user metadata:', err);
      });
  }
  
  // Apply custom claims to context
  Object.keys(customClaims).forEach(function(key) {
    context.idToken[key] = customClaims[key];
    context.accessToken[key] = customClaims[key];
  });
  
  // Add standard claims
  context.idToken.name = user.name || user.nickname || user.email;
  context.idToken.email = user.email;
  context.idToken.email_verified = user.email_verified;
  context.idToken.picture = user.picture;
  context.idToken.nickname = user.nickname;
  
  // Debugging information (remove in production)
  console.log('LakbAI Role Assignment:', {
    user_id: user.user_id,
    email: user.email,
    client_id: clientId,
    app_type: appType,
    roles: roles,
    permissions_count: permissions.length,
    is_admin: isAdmin,
    is_admin_email: isAdminEmail,
    timestamp: new Date().toISOString()
  });
  
  callback(null, user, context);
}

/**
 * Additional Security Rule: Rate Limiting and Suspicious Activity Detection
 * This can be added as a separate rule if needed
 */
function lakbAISecurityCheck(user, context, callback) {
  const MAX_FAILED_LOGINS = 5;
  const LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutes
  
  // Skip for successful logins
  if (context.stats && context.stats.loginsCount > 0) {
    return callback(null, user, context);
  }
  
  // Check for suspicious activity
  const suspiciousPatterns = [
    /bot/i,
    /crawler/i,
    /scanner/i
  ];
  
  const userAgent = context.request.userAgent || '';
  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(userAgent));
  
  if (isSuspicious) {
    return callback(new UnauthorizedError('Suspicious activity detected'));
  }
  
  callback(null, user, context);
}
