// Driver management service for admin operations
class DriverService {
  static API_BASE_URL = '/api';

  /**
   * Search drivers by name or license number
   */
  static async searchDrivers(query, limit = 10) {
    try {
      const params = new URLSearchParams();
      params.append('q', query);
      params.append('limit', limit);

      console.log('🔍 DriverService - searchDrivers query:', query);

      const response = await fetch(`${this.API_BASE_URL}/admin/drivers/search?${params.toString()}`);
      const data = await response.json();

      console.log('🔍 DriverService - search response:', data);

      if (data.status === 'success') {
        return {
          success: true,
          drivers: data.drivers || [],
          count: data.count || 0
        };
      } else {
        throw new Error(data.message || 'Failed to search drivers');
      }
    } catch (error) {
      console.error('Error searching drivers:', error);
      return {
        success: false,
        error: error.message || 'Failed to search drivers'
      };
    }
  }

  /**
   * Get available drivers (not assigned to any jeepney)
   */
  static async getAvailableDrivers() {
    try {
      const response = await fetch(`${this.API_BASE_URL}/admin/drivers/available`);
      const data = await response.json();

      if (data.status === 'success') {
        return {
          success: true,
          drivers: data.drivers || [],
          count: data.count || 0
        };
      } else {
        throw new Error(data.message || 'Failed to get available drivers');
      }
    } catch (error) {
      console.error('Error getting available drivers:', error);
      return {
        success: false,
        error: error.message || 'Failed to get available drivers'
      };
    }
  }

  /**
   * Get driver by ID
   */
  static async getDriverById(driverId) {
    try {
      const response = await fetch(`${this.API_BASE_URL}/admin/drivers/${driverId}`);
      const data = await response.json();

      if (data.status === 'success') {
        return {
          success: true,
          driver: data.driver
        };
      } else {
        throw new Error(data.message || 'Failed to get driver');
      }
    } catch (error) {
      console.error('Error getting driver:', error);
      return {
        success: false,
        error: error.message || 'Failed to get driver'
      };
    }
  }

  /**
   * Get all drivers with pagination
   */
  static async getAllDrivers(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);

      console.log('🔍 DriverService - getAllDrivers filters:', filters);

      const response = await fetch(`${this.API_BASE_URL}/admin/drivers?${params.toString()}`);
      const data = await response.json();

      console.log('🔍 DriverService - getAllDrivers response:', data);

      if (data.status === 'success') {
        return {
          success: true,
          drivers: data.drivers || [],
          pagination: data.pagination || {}
        };
      } else {
        throw new Error(data.message || 'Failed to fetch drivers');
      }
    } catch (error) {
      console.error('Error fetching drivers:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch drivers'
      };
    }
  }

  /**
   * Format driver data for display
   */
  static formatDriverForDisplay(driver) {
    return {
      ...driver,
      displayName: `${driver.name} (${driver.license_number})`,
      statusBadge: driver.license_status === 'active' ? 'success' : 'warning'
    };
  }
}

export default DriverService;
