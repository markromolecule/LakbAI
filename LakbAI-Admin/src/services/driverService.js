// Driver management service for admin operations
class DriverService {
    static API_BASE_URL = '/api';
  
    /**
     * Helper method for sending API requests
     */
    static async sendRequest(url, method = 'GET', body = null) {
      try {
        const response = await fetch(`${this.API_BASE_URL}${url}`, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}` // 🔑 admin token if required
          },
          body: body ? JSON.stringify(body) : null
        });
  
        const data = await response.json();
  
        if (data.status === 'success') {
          return { success: true, ...data };
        } else {
          throw new Error(data.message || 'Request failed');
        }
      } catch (error) {
        console.error(`DriverService error [${method} ${url}]:`, error);
        return { success: false, error: error.message };
      }
    }
  
    /**
     * Get all drivers
     */
    static async getDrivers() {
      return await this.sendRequest('/drivers', 'GET');
    }
  
    /**
     * Get a single driver by ID
     */
    static async getDriver(driverId) {
      return await this.sendRequest(`/drivers/${driverId}`, 'GET');
    }
  
    /**
     * Create a new driver (admin only)
     */
    static async createDriver(driverData) {
      return await this.sendRequest('/drivers/create', 'POST', driverData);
    }
  
    /**
     * Update driver details
     */
    static async updateDriver(driverId, driverData) {
      return await this.sendRequest(`/drivers/update/${driverId}`, 'PUT', driverData);
    }
  
    /**
     * Delete a driver
     */
    static async deleteDriver(driverId) {
      return await this.sendRequest(`/drivers/delete/${driverId}`, 'DELETE');
    }
  
    /**
     * Format driver data for display
     */
    static formatDriverForDisplay(driver) {
      return {
        ...driver,
        fullName: `${driver.first_name} ${driver.last_name}`,
        address: `${driver.house_number} ${driver.street_name}, ${driver.barangay}, ${driver.city_municipality}, ${driver.province} ${driver.postal_code}`,
        birthday: new Date(driver.birthday).toLocaleDateString(),
        createdAt: driver.created_at ? new Date(driver.created_at).toLocaleDateString() : 'N/A',
        licenseStatus: driver.license_verified ? 'Verified' : 'Pending',
        accountStatus: driver.account_verified ? 'Active' : 'Unverified'
      };
    }
  }
  
  export default DriverService;
  