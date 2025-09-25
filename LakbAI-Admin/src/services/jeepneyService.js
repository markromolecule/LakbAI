// Jeepney management service for admin operations
import { API_CONFIG } from '../config/apiConfig';

class JeepneyService {
  static API_BASE_URL = API_CONFIG.BASE_URL;

  /**
   * Get all jeepneys with pagination
   */
  static async getJeepneys(filters = {}) {
    try {
      const params = new URLSearchParams();

      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);

      console.log('🔍 JeepneyService - getJeepneys filters:', filters);
      console.log('🔍 JeepneyService - API URL params:', params.toString());

      const response = await fetch(`${this.API_BASE_URL}/admin/jeepneys?${params.toString()}`);
      const data = await response.json();

      console.log('🔍 JeepneyService - API response:', data);

      if (data.status === 'success') {
        return {
          success: true,
          jeepneys: data.jeepneys || [],
          pagination: data.pagination || {}
        };
      } else {
        throw new Error(data.message || 'Failed to fetch jeepneys');
      }
    } catch (error) {
      console.error('Error fetching jeepneys:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch jeepneys'
      };
    }
  }

  /**
   * Create new jeepney (admin action)
   */
  static async createJeepney(jeepneyData) {
    try {
      const response = await fetch(`${this.API_BASE_URL}/admin/jeepneys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jeepneyData)
      });

      const data = await response.json();

      if (data.status === 'success') {
        return {
          success: true,
          message: data.message,
          jeepneyId: data.jeepney_id
        };
      } else {
        throw new Error(data.message || 'Failed to create jeepney');
      }
    } catch (error) {
      console.error('Error creating jeepney:', error);
      return {
        success: false,
        error: error.message || 'Failed to create jeepney'
      };
    }
  }

  /**
   * Update jeepney (admin action)
   */
  static async updateJeepney(jeepneyId, updateData) {
    try {
      const response = await fetch(`${this.API_BASE_URL}/admin/jeepneys/${jeepneyId}`, {
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
        throw new Error(data.message || 'Failed to update jeepney');
      }
    } catch (error) {
      console.error('Error updating jeepney:', error);
      return {
        success: false,
        error: error.message || 'Failed to update jeepney'
      };
    }
  }

  /**
   * Delete jeepney
   */
  static async deleteJeepney(jeepneyId) {
    try {
      const response = await fetch(`${this.API_BASE_URL}/admin/jeepneys/${jeepneyId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.status === 'success') {
        return {
          success: true,
          message: data.message
        };
      } else {
        throw new Error(data.message || 'Failed to delete jeepney');
      }
    } catch (error) {
      console.error('Error deleting jeepney:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete jeepney'
      };
    }
  }

  /**
   * Format jeepney data for display
   */
  static formatJeepneyForDisplay(jeepney) {
    return {
      ...jeepney,
      routeDisplay: `${jeepney.route_start} ➝ ${jeepney.route_end}`,
      createdAt: new Date(jeepney.created_at).toLocaleDateString()
    };
  }
}

export default JeepneyService;
