// Alternative User management service for direct API connection (if proxy doesn't work)
class UserService {
  // Try both localhost and 127.0.0.1 for different setups
  static API_BASE_URL = 'http://127.0.0.1/LakbAI/LakbAI-API';
  
  // Alternative URLs to try if main one fails
  static ALTERNATIVE_URLS = [
    'http://localhost/LakbAI/LakbAI-API',
    'http://127.0.0.1/LakbAI/LakbAI-API',
    'http://localhost:80/LakbAI/LakbAI-API',
    'http://127.0.0.1:80/LakbAI/LakbAI-API'
  ];

  /**
   * Try multiple API URLs until one works
   */
  static async fetchWithFallback(endpoint, options = {}) {
    const urls = [this.API_BASE_URL, ...this.ALTERNATIVE_URLS];
    
    for (const baseUrl of urls) {
      try {
        console.log(`Trying API URL: ${baseUrl}${endpoint}`);
        
        const response = await fetch(`${baseUrl}${endpoint}`, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...options.headers
          }
        });
        
        if (response.ok) {
          console.log(`Success with: ${baseUrl}`);
          return response;
        } else {
          console.log(`Failed with ${baseUrl}: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        console.log(`Network error with ${baseUrl}:`, error.message);
      }
    }
    
    throw new Error('All API URLs failed. Please check if XAMPP Apache is running.');
  }

  /**
   * Get all users with filtering and pagination
   */
  static async getUsers(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filters.userType) params.append('user_type', filters.userType);
      if (filters.discountStatus) params.append('discount_status', filters.discountStatus);
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);

      const response = await this.fetchWithFallback(`/admin/users?${params.toString()}`);
      const data = await response.json();

      if (data.status === 'success') {
        return {
          success: true,
          users: data.users || [],
          pagination: data.pagination || {}
        };
      } else {
        throw new Error(data.message || 'Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch users'
      };
    }
  }

  /**
   * Get pending discount approvals
   */
  static async getPendingApprovals() {
    try {
      const response = await this.fetchWithFallback('/admin/pending-approvals');
      const data = await response.json();

      if (data.status === 'success') {
        return {
          success: true,
          users: data.users || [],
          count: data.count || 0
        };
      } else {
        throw new Error(data.message || 'Failed to fetch pending approvals');
      }
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch pending approvals'
      };
    }
  }
}

export default UserService;

