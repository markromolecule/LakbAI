const DEFAULT_BASE = `${window.location.protocol}//localhost/LakbAI/LakbAI-API`;
const API_BASE = import.meta.env.VITE_API_BASE_URL || DEFAULT_BASE;

export async function fetchCheckpoints() {
  const candidates = [
    `${API_BASE}/checkpoints`,
    `${window.location.origin}/LakbAI/LakbAI-API/checkpoints`,
    `${window.location.origin}/LakbAI/LakbAI-API/routes/api.php/checkpoints`,
  ];

  let lastError = null;
  for (const url of candidates) {
    try {
      const res = await fetch(url, { method: 'GET' });
      if (!res.ok) {
        lastError = new Error(`HTTP ${res.status} @ ${url}`);
        continue;
      }
      const data = await res.json();
      const arr = Array.isArray(data) ? data : data?.data;
      if (Array.isArray(arr) && arr.length) {
        return arr;
      }
      // If empty array is valid, still return it
      if (Array.isArray(arr)) return arr;
      lastError = new Error(`Invalid JSON shape @ ${url}`);
    } catch (e) {
      lastError = e;
      continue;
    }
  }
  console.error('fetchCheckpoints failed. Last error:', lastError);
  throw new Error('Failed to load checkpoints');
}

// Route management service for admin operations
class RouteService {
  static API_BASE_URL = '/api';

  /**
   * Get all active routes
   */
  static async getAllRoutes() {
    try {
      console.log('🔍 RouteService - getAllRoutes');

      const response = await fetch(`${this.API_BASE_URL}/admin/routes`);
      const data = await response.json();

      console.log('🔍 RouteService - getAllRoutes response:', data);

      if (data.status === 'success') {
        return {
          success: true,
          routes: data.routes || []
        };
      } else {
        throw new Error(data.message || 'Failed to fetch routes');
      }
    } catch (error) {
      console.error('Error fetching routes:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch routes'
      };
    }
  }

  /**
   * Get route by ID
   */
  static async getRouteById(routeId) {
    try {
      const response = await fetch(`${this.API_BASE_URL}/admin/routes/${routeId}`);
      const data = await response.json();

      if (data.status === 'success') {
        return {
          success: true,
          route: data.route
        };
      } else {
        throw new Error(data.message || 'Failed to get route');
      }
    } catch (error) {
      console.error('Error getting route:', error);
      return {
        success: false,
        error: error.message || 'Failed to get route'
      };
    }
  }

  /**
   * Create new route
   */
  static async createRoute(routeData) {
    try {
      const response = await fetch(`${this.API_BASE_URL}/admin/routes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(routeData)
      });

      const data = await response.json();

      if (data.status === 'success') {
        return {
          success: true,
          route: data.route,
          message: data.message
        };
      } else {
        throw new Error(data.message || 'Failed to create route');
      }
    } catch (error) {
      console.error('Error creating route:', error);
      return {
        success: false,
        error: error.message || 'Failed to create route'
      };
    }
  }

  /**
   * Update route
   */
  static async updateRoute(routeId, routeData) {
    try {
      const response = await fetch(`${this.API_BASE_URL}/admin/routes/${routeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(routeData)
      });

      const data = await response.json();

      if (data.status === 'success') {
        return {
          success: true,
          message: data.message
        };
      } else {
        throw new Error(data.message || 'Failed to update route');
      }
    } catch (error) {
      console.error('Error updating route:', error);
      return {
        success: false,
        error: error.message || 'Failed to update route'
      };
    }
  }

  /**
   * Delete route
   */
  static async deleteRoute(routeId) {
    try {
      const response = await fetch(`${this.API_BASE_URL}/admin/routes/${routeId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.status === 'success') {
        return {
          success: true,
          message: data.message
        };
      } else {
        throw new Error(data.message || 'Failed to delete route');
      }
    } catch (error) {
      console.error('Error deleting route:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete route'
      };
    }
  }

  /**
   * Format route data for display
   */
  static formatRouteForDisplay(route) {
    return {
      ...route,
      displayName: route.route_name,
      shortDescription: `${route.origin} → ${route.destination}`
    };
  }
}

export default RouteService;
