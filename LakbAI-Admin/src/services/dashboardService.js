import { API_CONFIG } from '../config/apiConfig';

class DashboardService {
  /**
   * Get all dashboard statistics
   */
  static async getDashboardStats() {
    try {
      console.log('📊 Fetching dashboard statistics...');
      
      // Fetch all data in parallel for better performance
      const [
        usersResponse,
        jeepneysResponse,
        driversResponse,
        routesResponse,
        earningsResponse
      ] = await Promise.all([
        this.fetchUsers(),
        this.fetchJeepneys(),
        this.fetchDrivers(),
        this.fetchRoutes(),
        this.fetchTotalEarnings()
      ]);

      const stats = {
        totalUsers: usersResponse.totalUsers || 0,
        totalPassengers: usersResponse.totalPassengers || 0,
        totalDrivers: usersResponse.totalDrivers || 0,
        totalJeepneys: jeepneysResponse.totalJeepneys || 0,
        activeDrivers: driversResponse.activeDrivers || 0,
        totalRoutes: routesResponse.totalRoutes || 0,
        dailyRevenue: earningsResponse.dailyRevenue || 0,
        todayTrips: earningsResponse.todayTrips || 0,
        averageFare: earningsResponse.averageFare || 0,
        totalDiscounts: earningsResponse.totalDiscounts || 0,
        driverBreakdown: earningsResponse.driverBreakdown || [],
        hourlyBreakdown: earningsResponse.hourlyBreakdown || []
      };

      console.log('📊 Dashboard stats:', stats);
      console.log('📊 Earnings response:', earningsResponse);
      return { success: true, stats };
    } catch (error) {
      console.error('❌ Error fetching dashboard stats:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Fetch users statistics
   */
  static async fetchUsers() {
    try {
      const baseUrl = API_CONFIG.BASE_URL.replace('/routes/api.php', '');
      const response = await fetch(`${baseUrl}/api/admin/users`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success' && data.users) {
          const users = data.users;
          return {
            totalUsers: users.length,
            totalPassengers: users.filter(u => u.user_type === 'passenger').length,
            totalDrivers: users.filter(u => u.user_type === 'driver').length
          };
        }
      }
      return { totalUsers: 0, totalPassengers: 0, totalDrivers: 0 };
    } catch (error) {
      console.error('Error fetching users:', error);
      return { totalUsers: 0, totalPassengers: 0, totalDrivers: 0 };
    }
  }

  /**
   * Fetch jeepneys statistics
   */
  static async fetchJeepneys() {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/jeepneys`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success' && data.jeepneys) {
          return {
            totalJeepneys: data.jeepneys.length,
            activeJeepneys: data.jeepneys.filter(j => j.status === 'active').length
          };
        }
      }
      return { totalJeepneys: 0, activeJeepneys: 0 };
    } catch (error) {
      console.error('Error fetching jeepneys:', error);
      return { totalJeepneys: 0, activeJeepneys: 0 };
    }
  }

  /**
   * Fetch drivers statistics
   */
  static async fetchDrivers() {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/admin/drivers`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success' && data.drivers) {
          const drivers = data.drivers;
          return {
            totalDrivers: drivers.length,
            activeDrivers: drivers.filter(d => d.shift_status === 'on_shift').length,
            verifiedDrivers: drivers.filter(d => d.is_verified === 1).length
          };
        }
      }
      return { totalDrivers: 0, activeDrivers: 0, verifiedDrivers: 0 };
    } catch (error) {
      console.error('Error fetching drivers:', error);
      return { totalDrivers: 0, activeDrivers: 0, verifiedDrivers: 0 };
    }
  }

  /**
   * Fetch routes statistics
   */
  static async fetchRoutes() {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/routes`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success' && data.routes) {
          return {
            totalRoutes: data.routes.length,
            routes: data.routes
          };
        }
      }
      return { totalRoutes: 0, routes: [] };
    } catch (error) {
      console.error('Error fetching routes:', error);
      return { totalRoutes: 0, routes: [] };
    }
  }

  /**
   * Fetch total earnings (aggregated from all drivers - all-time)
   */
  static async fetchTotalEarnings() {
    try {
      console.log('💰 Fetching total aggregated earnings...');
      console.log('💰 API URL:', `${API_CONFIG.BASE_URL}/earnings/total-aggregated`);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/earnings/total-aggregated`);
      
      console.log('💰 Response status:', response.status);
      console.log('💰 Response ok:', response.ok);
      
      if (response.ok) {
        const data = await response.json();
        console.log('💰 Raw API response:', data);
        
        if (data.status === 'success' && data.summary) {
          const { summary } = data;
          
          console.log('💰 Daily earnings data:', summary);
          
          return {
            dailyRevenue: summary.total_revenue || 0,
            todayTrips: summary.total_trips || 0,
            activeDrivers: summary.total_active_drivers || 0,
            averageFare: summary.average_fare || 0,
            totalDiscounts: summary.total_discounts_given || 0,
            driverBreakdown: data.driver_breakdown || [],
            hourlyBreakdown: data.hourly_breakdown || []
          };
        }
      }
      
      console.warn('⚠️ Failed to fetch daily earnings, using fallback');
      return { 
        dailyRevenue: 0, 
        todayTrips: 0, 
        activeDrivers: 0,
        averageFare: 0,
        totalDiscounts: 0,
        driverBreakdown: [],
        hourlyBreakdown: []
      };
    } catch (error) {
      console.error('❌ Error fetching daily earnings:', error);
      return { 
        dailyRevenue: 0, 
        todayTrips: 0, 
        activeDrivers: 0,
        averageFare: 0,
        totalDiscounts: 0,
        driverBreakdown: [],
        hourlyBreakdown: []
      };
    }
  }

  /**
   * Fetch recent activities
   */
  static async fetchRecentActivities() {
    try {
      console.log('📋 Fetching recent activities...');
      
      // Get recent user registrations
      const baseUrl = API_CONFIG.BASE_URL.replace('/routes/api.php', '');
      const usersResponse = await fetch(`${baseUrl}/api/admin/users?limit=10`);
      
      const activities = [];
      
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        if (usersData.status === 'success' && usersData.users) {
          const recentUsers = usersData.users.slice(0, 5);
          
          recentUsers.forEach(user => {
            activities.push({
              id: `user_${user.id}`,
              type: 'user_created',
              message: `New ${user.user_type} ${user.first_name} ${user.last_name} registered`,
              timestamp: new Date(user.created_at),
              icon: user.user_type === 'driver' ? 'bi-person-badge' : 'bi-person-plus',
              color: user.user_type === 'driver' ? 'info' : 'success'
            });
          });
        }
      }

      // Get recent driver activities
      const driversResponse = await fetch(`${API_CONFIG.BASE_URL}/admin/drivers`);
      if (driversResponse.ok) {
        const driversData = await driversResponse.json();
        console.log('🚗 Drivers API response:', driversData);
        
        if (driversData.status === 'success' && driversData.drivers) {
          const activeDrivers = driversData.drivers.filter(d => d.shift_status === 'on_shift');
          console.log('🚗 Active drivers:', activeDrivers);
          
          activeDrivers.slice(0, 3).forEach(driver => {
            console.log('🚗 Processing driver:', driver);
            activities.push({
              id: `driver_${driver.id}`,
              type: 'driver_login',
              message: `Driver ${driver.name} is on shift`,
              timestamp: new Date(driver.last_active || driver.updated_at),
              icon: 'bi-person-check',
              color: 'info'
            });
          });
        }
      }

      // Sort by timestamp (most recent first)
      activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      console.log('📋 Recent activities:', activities);
      return { success: true, activities: activities.slice(0, 10) };
    } catch (error) {
      console.error('❌ Error fetching recent activities:', error);
      return { success: false, error: error.message, activities: [] };
    }
  }

  /**
   * Get system health status
   */
  static async getSystemHealth() {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}`);
      
      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          status: 'healthy',
          timestamp: data.timestamp,
          message: data.message
        };
      }
      return { success: false, status: 'unhealthy' };
    } catch (error) {
      console.error('Error checking system health:', error);
      return { success: false, status: 'unhealthy', error: error.message };
    }
  }

  /**
   * Format currency for display
   */
  static formatCurrency(amount) {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  /**
   * Format number with commas
   */
  static formatNumber(num) {
    return new Intl.NumberFormat('en-US').format(num);
  }
}

export default DashboardService;
