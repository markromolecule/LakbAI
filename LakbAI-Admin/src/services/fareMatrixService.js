import { API_CONFIG } from '../config/apiConfig';

const DEFAULT_BASE = API_CONFIG.BASE_URL.replace('/routes/api.php', '');
const API_BASE = import.meta.env.VITE_API_BASE_URL || DEFAULT_BASE;

// Fare Matrix management service for admin operations
class FareMatrixService {
  static API_BASE_URL = API_CONFIG.BASE_URL;

  /**
   * Get all fare matrices
   */
  static async getAllFareMatrices() {
    try {
      console.log('🔍 FareMatrixService - getAllFareMatrices');

      const response = await fetch(`${this.API_BASE_URL}/fare-matrix`);
      const data = await response.json();

      console.log('🔍 FareMatrixService - getAllFareMatrices response:', data);

      if (data.status === 'success') {
        return {
          success: true,
          fareMatrices: data.fare_matrices || [],
          totalRoutes: data.total_routes || 0
        };
      } else {
        throw new Error(data.message || 'Failed to fetch fare matrices');
      }
    } catch (error) {
      console.error('Error fetching fare matrices:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch fare matrices'
      };
    }
  }

  /**
   * Get fare matrix for a specific route
   */
  static async getFareMatrixForRoute(routeId) {
    try {
      const response = await fetch(`${this.API_BASE_URL}/fare-matrix/route/${routeId}`);
      const data = await response.json();

      if (data.status === 'success') {
        return {
          success: true,
          route: data.route,
          checkpoints: data.checkpoints || [],
          fareMatrix: data.fare_matrix || [],
          matrixSize: data.matrix_size || 0
        };
      } else {
        throw new Error(data.message || 'Failed to get fare matrix for route');
      }
    } catch (error) {
      console.error('Error getting fare matrix for route:', error);
      return {
        success: false,
        error: error.message || 'Failed to get fare matrix for route'
      };
    }
  }

  /**
   * Get fare between two checkpoints
   */
  static async getFareBetweenCheckpoints(fromCheckpointId, toCheckpointId, routeId = null) {
    try {
      const url = routeId 
        ? `${this.API_BASE_URL}/fare-matrix/fare/${fromCheckpointId}/${toCheckpointId}?route_id=${routeId}`
        : `${this.API_BASE_URL}/fare-matrix/fare/${fromCheckpointId}/${toCheckpointId}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'success') {
        return {
          success: true,
          fareInfo: data.fare_info
        };
      } else {
        throw new Error(data.message || 'Failed to get fare between checkpoints');
      }
    } catch (error) {
      console.error('Error getting fare between checkpoints:', error);
      return {
        success: false,
        error: error.message || 'Failed to get fare between checkpoints'
      };
    }
  }

  /**
   * Generate fare matrix for a route
   */
  static async generateFareMatrixForRoute(routeId, baseFare = 13.00) {
    try {
      const response = await fetch(`${this.API_BASE_URL}/fare-matrix/generate/${routeId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ base_fare: baseFare })
      });

      const data = await response.json();

      if (data.status === 'success') {
        return {
          success: true,
          message: data.message,
          createdEntries: data.created_entries || 0,
          totalPossibleEntries: data.total_possible_entries || 0,
          errors: data.errors || []
        };
      } else {
        throw new Error(data.message || 'Failed to generate fare matrix');
      }
    } catch (error) {
      console.error('Error generating fare matrix:', error);
      return {
        success: false,
        error: error.message || 'Failed to generate fare matrix'
      };
    }
  }

  /**
   * Create or update fare matrix entry
   */
  static async createOrUpdateFareEntry(fareData) {
    try {
      const response = await fetch(`${this.API_BASE_URL}/fare-matrix/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fareData)
      });

      const data = await response.json();

      if (data.status === 'success') {
        return {
          success: true,
          message: data.message,
          fareMatrixId: data.fare_matrix_id
        };
      } else {
        throw new Error(data.message || 'Failed to create/update fare entry');
      }
    } catch (error) {
      console.error('Error creating/updating fare entry:', error);
      return {
        success: false,
        error: error.message || 'Failed to create/update fare entry'
      };
    }
  }

  /**
   * Update fare matrix entry
   */
  static async updateFareEntry(fareMatrixId, fareData) {
    try {
      const response = await fetch(`${this.API_BASE_URL}/fare-matrix/${fareMatrixId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fareData)
      });

      const data = await response.json();

      if (data.status === 'success') {
        return {
          success: true,
          message: data.message
        };
      } else {
        throw new Error(data.message || 'Failed to update fare entry');
      }
    } catch (error) {
      console.error('Error updating fare entry:', error);
      return {
        success: false,
        error: error.message || 'Failed to update fare entry'
      };
    }
  }

  /**
   * Delete fare matrix entry
   */
  static async deleteFareEntry(fareMatrixId) {
    try {
      const response = await fetch(`${this.API_BASE_URL}/fare-matrix/${fareMatrixId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.status === 'success') {
        return {
          success: true,
          message: data.message
        };
      } else {
        throw new Error(data.message || 'Failed to delete fare entry');
      }
    } catch (error) {
      console.error('Error deleting fare entry:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete fare entry'
      };
    }
  }

  /**
   * Get fare matrix statistics
   */
  static async getFareMatrixStats() {
    try {
      const response = await fetch(`${this.API_BASE_URL}/fare-matrix/stats`);
      const data = await response.json();

      if (data.status === 'success') {
        return {
          success: true,
          stats: data.stats
        };
      } else {
        throw new Error(data.message || 'Failed to get fare matrix statistics');
      }
    } catch (error) {
      console.error('Error getting fare matrix statistics:', error);
      return {
        success: false,
        error: error.message || 'Failed to get fare matrix statistics'
      };
    }
  }

  /**
   * Get fare matrix history
   */
  static async getFareMatrixHistory(fareMatrixId = null, limit = 50) {
    try {
      const url = fareMatrixId 
        ? `${this.API_BASE_URL}/fare-matrix/history/${fareMatrixId}?limit=${limit}`
        : `${this.API_BASE_URL}/fare-matrix/history?limit=${limit}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'success') {
        return {
          success: true,
          history: data.history || [],
          count: data.count || 0
        };
      } else {
        throw new Error(data.message || 'Failed to get fare matrix history');
      }
    } catch (error) {
      console.error('Error getting fare matrix history:', error);
      return {
        success: false,
        error: error.message || 'Failed to get fare matrix history'
      };
    }
  }

  /**
   * Format fare amount for display
   */
  static formatFareAmount(amount) {
    return `₱${parseFloat(amount).toFixed(2)}`;
  }

  /**
   * Format fare matrix entry for display
   */
  static formatFareEntryForDisplay(entry) {
    return {
      ...entry,
      formattedFare: this.formatFareAmount(entry.fare_amount),
      isBaseFareText: entry.is_base_fare ? 'Yes' : 'No',
      statusBadge: entry.status === 'active' ? 'success' : 'secondary'
    };
  }

  /**
   * Create fare matrix table data for display
   */
  static createFareMatrixTable(fareMatrix, checkpoints) {
    const checkpointMap = {};
    checkpoints.forEach(cp => {
      checkpointMap[cp.id] = cp.checkpoint_name;
    });

    const tableData = [];
    checkpoints.forEach(fromCp => {
      const row = {
        fromCheckpoint: fromCp.checkpoint_name,
        fromCheckpointId: fromCp.id,
        fares: {}
      };
      
      checkpoints.forEach(toCp => {
        const fareEntry = fareMatrix.find(fm => 
          fm.from_checkpoint_id === fromCp.id && 
          fm.to_checkpoint_id === toCp.id
        );
        
        row.fares[toCp.id] = {
          fare: fareEntry ? fareEntry.fare_amount : null,
          fareMatrixId: fareEntry ? fareEntry.id : null,
          isBaseFare: fareEntry ? fareEntry.is_base_fare : false,
          status: fareEntry ? fareEntry.status : 'missing'
        };
      });
      
      tableData.push(row);
    });

    return tableData;
  }
}

export default FareMatrixService;
