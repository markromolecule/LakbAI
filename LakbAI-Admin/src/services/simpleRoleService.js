// Simple Role Assignment Service
// This provides a fallback when Auth0 roles aren't working properly

class SimpleRoleService {
  constructor() {
    // Admin emails - add your email here
    this.adminEmails = [
      'livadomc@gmail.com',
      'admin@lakbai.com',
      'support@lakbai.com'
    ];
    
    // Driver emails (optional)
    this.driverEmails = [
      'driver@lakbai.com'
    ];
  }

  /**
   * Check if user has admin access based on email
   */
  isAdmin(email) {
    return this.adminEmails.includes(email?.toLowerCase());
  }

  /**
   * Check if user has driver access based on email
   */
  isDriver(email) {
    return this.driverEmails.includes(email?.toLowerCase()) || this.isAdmin(email);
  }

  /**
   * Get user roles based on email
   */
  getUserRoles(email) {
    const roles = [];
    
    if (this.isAdmin(email)) {
      roles.push('admin', 'driver');
    } else if (this.isDriver(email)) {
      roles.push('driver');
    } else {
      roles.push('user');
    }
    
    return roles;
  }

  /**
   * Get user permissions based on email
   */
  getUserPermissions(email) {
    const permissions = [];
    
    if (this.isAdmin(email)) {
      permissions.push(
        'read:users', 'write:users', 'delete:users', 'manage:users',
        'read:drivers', 'write:drivers', 'manage:drivers',
        'read:passengers', 'write:passengers', 'manage:passengers',
        'read:admin', 'write:admin', 'manage:admin',
        'access:dashboard', 'manage:system',
        'read:fare_matrix', 'write:fare_matrix',
        'read:routes', 'write:routes',
        'read:vehicles', 'write:vehicles',
        'read:analytics'
      );
    } else if (this.isDriver(email)) {
      permissions.push(
        'read:drivers', 'write:drivers',
        'read:passengers',
        'read:fare_matrix', 'read:routes',
        'read:vehicles'
      );
    } else {
      permissions.push('read:profile');
    }
    
    return permissions;
  }

  /**
   * Enhance Auth0 user with local roles (fallback)
   */
  enhanceUserWithRoles(auth0User) {
    if (!auth0User || !auth0User.email) {
      return auth0User;
    }

    // Check if Auth0 already provided roles
    const auth0Roles = auth0User['https://lakbai.com/roles'] || [];
    const auth0IsAdmin = auth0User['https://lakbai.com/is_admin'] || false;

    // If Auth0 roles are present and user is admin, use them
    if (auth0Roles.length > 0 && auth0IsAdmin) {
      return auth0User;
    }

    // Otherwise, use our simple role assignment
    const localRoles = this.getUserRoles(auth0User.email);
    const localPermissions = this.getUserPermissions(auth0User.email);
    const localIsAdmin = this.isAdmin(auth0User.email);

    return {
      ...auth0User,
      // Add our custom claims
      'https://lakbai.com/roles': localRoles,
      'https://lakbai.com/permissions': localPermissions,
      'https://lakbai.com/is_admin': localIsAdmin,
      'https://lakbai.com/source': 'local_fallback'
    };
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(email, permission) {
    const permissions = this.getUserPermissions(email);
    return permissions.includes(permission);
  }

  /**
   * Check if user has admin dashboard access
   */
  hasAdminAccess(email) {
    return this.isAdmin(email);
  }
}

// Create singleton instance
export const simpleRoleService = new SimpleRoleService();
export default simpleRoleService;
