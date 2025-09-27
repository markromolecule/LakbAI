// BiyaBot Service - Handles API calls for the smart chatbot
const API_BASE_URL = 'http://localhost/LakbAI/LakbAI-API/routes/api.php';

class BiyaBotService {
  // Get all routes
  async getRoutes() {
    try {
      const response = await fetch(`${API_BASE_URL}/routes`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching routes:', error);
      return { status: 'error', message: 'Failed to fetch routes' };
    }
  }

  // Get checkpoints for a specific route
  async getCheckpointsByRoute(routeId) {
    try {
      const response = await fetch(`${API_BASE_URL}/routes/${routeId}/checkpoints`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching checkpoints:', error);
      return { status: 'error', message: 'Failed to fetch checkpoints' };
    }
  }

  // Get all checkpoints
  async getAllCheckpoints() {
    try {
      const routesResponse = await this.getRoutes();
      if (routesResponse.status !== 'success') {
        return routesResponse;
      }

      const allCheckpoints = [];
      for (const route of routesResponse.routes) {
        const checkpointsResponse = await this.getCheckpointsByRoute(route.id);
        if (checkpointsResponse.status === 'success') {
          allCheckpoints.push(...checkpointsResponse.checkpoints);
        }
      }
      
      return { status: 'success', checkpoints: allCheckpoints };
    } catch (error) {
      console.error('Error fetching all checkpoints:', error);
      return { status: 'error', message: 'Failed to fetch checkpoints' };
    }
  }

  // Get fare between two checkpoints
  async getFareBetweenCheckpoints(fromCheckpointId, toCheckpointId, routeId = null) {
    try {
      let url = `${API_BASE_URL}/fare-matrix/fare/${fromCheckpointId}/${toCheckpointId}`;
      if (routeId) {
        url += `?route_id=${routeId}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching fare:', error);
      return { status: 'error', message: 'Failed to fetch fare information' };
    }
  }

  // Get fare matrix for a route
  async getFareMatrixForRoute(routeId) {
    try {
      const response = await fetch(`${API_BASE_URL}/fare-matrix/route/${routeId}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching fare matrix:', error);
      return { status: 'error', message: 'Failed to fetch fare matrix' };
    }
  }

  // Get all jeepneys
  async getJeepneys() {
    try {
      const response = await fetch(`${API_BASE_URL}/jeepneys`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching jeepneys:', error);
      return { status: 'error', message: 'Failed to fetch jeepneys' };
    }
  }

  // Get driver locations for a route (real-time data)
  async getDriverLocationsForRoute(routeId) {
    try {
      const response = await fetch(`${API_BASE_URL}/mobile/locations/route/${routeId}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching driver locations:', error);
      return { status: 'error', message: 'Failed to fetch driver locations' };
    }
  }

  // Search for checkpoints by name
  async searchCheckpoints(query) {
    try {
      const allCheckpointsResponse = await this.getAllCheckpoints();
      if (allCheckpointsResponse.status !== 'success') {
        return allCheckpointsResponse;
      }

      const filteredCheckpoints = allCheckpointsResponse.checkpoints.filter(checkpoint =>
        checkpoint.checkpoint_name.toLowerCase().includes(query.toLowerCase())
      );

      return { status: 'success', checkpoints: filteredCheckpoints };
    } catch (error) {
      console.error('Error searching checkpoints:', error);
      return { status: 'error', message: 'Failed to search checkpoints' };
    }
  }

  // Get checkpoint coordinates
  async getCheckpointCoordinates(checkpointName) {
    try {
      const response = await fetch(`${API_BASE_URL}/checkpoints/coordinates/${encodeURIComponent(checkpointName)}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching checkpoint coordinates:', error);
      return { status: 'error', message: 'Failed to fetch checkpoint coordinates' };
    }
  }

  // Calculate fare between two checkpoint names
  async calculateFareByNames(fromCheckpointName, toCheckpointName) {
    try {
      // First, find the checkpoint IDs
      const allCheckpointsResponse = await this.getAllCheckpoints();
      if (allCheckpointsResponse.status !== 'success') {
        return allCheckpointsResponse;
      }

      console.log('Looking for checkpoints:', fromCheckpointName, 'to', toCheckpointName);
      console.log('Available checkpoints:', allCheckpointsResponse.checkpoints.map(cp => cp.checkpoint_name));

      const fromCheckpoint = allCheckpointsResponse.checkpoints.find(cp => 
        cp.checkpoint_name.toLowerCase() === fromCheckpointName.toLowerCase()
      );
      const toCheckpoint = allCheckpointsResponse.checkpoints.find(cp => 
        cp.checkpoint_name.toLowerCase() === toCheckpointName.toLowerCase()
      );

      console.log('Found from checkpoint:', fromCheckpoint);
      console.log('Found to checkpoint:', toCheckpoint);

      if (!fromCheckpoint || !toCheckpoint) {
        return { 
          status: 'error', 
          message: `Checkpoints not found. Looking for: "${fromCheckpointName}" and "${toCheckpointName}". Available checkpoints: ${allCheckpointsResponse.checkpoints.map(cp => cp.checkpoint_name).join(', ')}` 
        };
      }

      // Calculate fare
      const fareResult = await this.getFareBetweenCheckpoints(
        fromCheckpoint.id, 
        toCheckpoint.id, 
        fromCheckpoint.route_id
      );

      console.log('Fare calculation result:', fareResult);
      return fareResult;
    } catch (error) {
      console.error('Error calculating fare by names:', error);
      return { status: 'error', message: 'Failed to calculate fare' };
    }
  }

  // Get system statistics
  async getSystemStats() {
    try {
      const [routesResponse, jeepneysResponse, fareMatrixResponse] = await Promise.all([
        this.getRoutes(),
        this.getJeepneys(),
        fetch(`${API_BASE_URL}/fare-matrix/stats`).then(res => res.json())
      ]);

      return {
        status: 'success',
        stats: {
          totalRoutes: routesResponse.routes?.length || 0,
          totalJeepneys: jeepneysResponse.jeepneys?.length || 0,
          fareMatrixStats: fareMatrixResponse.stats || {}
        }
      };
    } catch (error) {
      console.error('Error fetching system stats:', error);
      return { status: 'error', message: 'Failed to fetch system statistics' };
    }
  }
}

export default new BiyaBotService();
