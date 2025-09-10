// User management service for admin operations
class UserService {
  static API_BASE_URL = '/api';

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

      console.log('🔍 UserService - getUsers filters:', filters);
      console.log('🔍 UserService - API URL params:', params.toString());

      const response = await fetch(`${this.API_BASE_URL}/admin/users?${params.toString()}`);
      const data = await response.json();

      console.log('🔍 UserService - API response:', data);

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
      const response = await fetch(`${this.API_BASE_URL}/admin/pending-approvals`);
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

  /**
   * Get all discount applications (pending, approved, rejected)
   */
  static async getAllDiscountApplications() {
    try {
      const response = await fetch(`${this.API_BASE_URL}/admin/discount-applications`);
      const data = await response.json();

      if (data.status === 'success') {
        return {
          success: true,
          users: data.data || [],
          count: data.count || 0
        };
      } else {
        throw new Error(data.message || 'Failed to fetch discount applications');
      }
    } catch (error) {
      console.error('Error fetching discount applications:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch discount applications'
      };
    }
  }

  /**
   * Get pending discount applications only
   */
  static async getPendingDiscountApplications() {
    try {
      const response = await fetch(`${this.API_BASE_URL}/admin/discount-applications`);
      const data = await response.json();

      if (data.status === 'success') {
        // Filter only pending applications
        const pendingApplications = (data.data || []).filter(user => user.discount_status === 'pending');
        return {
          success: true,
          users: pendingApplications,
          count: pendingApplications.length
        };
      } else {
        throw new Error(data.message || 'Failed to fetch pending discount applications');
      }
    } catch (error) {
      console.error('Error fetching pending discount applications:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch pending discount applications'
      };
    }
  }

  /**
   * Update user (admin action)
   */
  static async updateUser(userId, updateData) {
    try {
      const response = await fetch(`${this.API_BASE_URL}/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });

      const data = await response.json();

      if (data.status === 'success') {
        return {
          success: true,
          message: data.message
        };
      } else {
        throw new Error(data.message || 'Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      return {
        success: false,
        error: error.message || 'Failed to update user'
      };
    }
  }

  /**
   * Delete user
   */
  static async deleteUser(userId) {
    try {
      const response = await fetch(`${this.API_BASE_URL}/admin/users/${userId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.status === 'success') {
        return {
          success: true,
          message: data.message
        };
      } else {
        throw new Error(data.message || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete user'
      };
    }
  }

  /**
   * Approve or reject discount application
   */
  static async approveDiscount(userId, approved, rejectionReason = null) {
    try {
      const response = await fetch(`${this.API_BASE_URL}/admin/approve-discount`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          approved: approved,
          rejection_reason: rejectionReason
        })
      });

      const data = await response.json();

      if (data.status === 'success') {
        return {
          success: true,
          message: data.message
        };
      } else {
        throw new Error(data.message || 'Failed to process approval');
      }
    } catch (error) {
      console.error('Error processing approval:', error);
      return {
        success: false,
        error: error.message || 'Failed to process approval'
      };
    }
  }

  /**
   * Approve or reject driver license
   */
  static async approveDriverLicense(userId, approved) {
    try {
      const response = await fetch(`${this.API_BASE_URL}/admin/approve-license`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          approved: approved
        })
      });

      const data = await response.json();

      if (data.status === 'success') {
        return {
          success: true,
          message: data.message
        };
      } else {
        throw new Error(data.message || 'Failed to process license approval');
      }
    } catch (error) {
      console.error('Error processing license approval:', error);
      return {
        success: false,
        error: error.message || 'Failed to process license approval'
      };
      }
    }

  /**
   * Get user profile
   */
  static async getUserProfile(userId) {
    try {
      const response = await fetch(`${this.API_BASE_URL}/profile?user_id=${userId}`);
      const data = await response.json();

      if (data.status === 'success') {
        return {
          success: true,
          user: data.user || {}
        };
      } else {
        throw new Error(data.message || 'Failed to fetch user profile');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch user profile'
      };
    }
  }

  /**
   * Create new user (admin action)
   */
  static async createUser(userData) {
    try {
      // Prepare user data with new discount fields
      const submitData = {
        ...userData,
        discount_applied: userData.discount_applied || false,
        discount_file_path: userData.discount_file_path || null,
        discount_status: userData.discount_status || 'pending'
      };

      const response = await fetch(`${this.API_BASE_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData)
      });

      const data = await response.json();

      if (data.status === 'success') {
        return {
          success: true,
          message: data.message,
          userId: data.user_id
        };
      } else {
        throw new Error(data.message || 'Failed to create user');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      return {
        success: false,
        error: error.message || 'Failed to create user'
      };
    }
  }

  /**
   * Upload discount document
   */
  static async uploadDiscountDocument(file) {
    try {
      const formData = new FormData();
      formData.append('discount_document', file);

      const response = await fetch(`${this.API_BASE_URL}/upload-discount-document`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (data.status === 'success') {
        return {
          success: true,
          data: data.data
        };
      } else {
        throw new Error(data.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      return {
        success: false,
        error: error.message || 'Upload failed'
      };
    }
  }

  /**
   * Get discount document URL
   */
  static getDiscountDocumentUrl(filePath) {
    return `${this.API_BASE_URL}/discount-document?path=${encodeURIComponent(filePath)}`;
  }

  /**
   * Delete discount document
   */
  static async deleteDiscountDocument(filePath) {
    try {
      const response = await fetch(`${this.API_BASE_URL}/delete-discount-document`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ file_path: filePath })
      });

      const data = await response.json();

      if (data.status === 'success') {
        return {
          success: true,
          message: data.message
        };
      } else {
        throw new Error(data.message || 'Delete failed');
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      return {
        success: false,
        error: error.message || 'Delete failed'
      };
    }
  }

  /**
   * Format user data for display
   */
  static formatUserForDisplay(user) {
    return {
      ...user,
      fullName: `${user.first_name} ${user.last_name}`,
      address: `${user.house_number} ${user.street_name}, ${user.barangay}, ${user.city_municipality}, ${user.province} ${user.postal_code}`,
      createdAt: new Date(user.created_at).toLocaleDateString(),
      discountStatus: user.discount_type ? 
        (user.discount_verified ? 'Approved' : 'Pending') : 
        'None'
    };
  }

  /**
   * Get discount percentage based on type
   */
  static getDiscountPercentage(discountType) {
    const discounts = {
      'PWD': 0.20,
      'Senior Citizen': 0.20,
      'Student': 0.20
    };
    return discounts[discountType] || 0;
  }
}

export default UserService;
