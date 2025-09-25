import { API_CONFIG } from '../config/apiConfig';

const API_BASE_URL = API_CONFIG.BASE_URL;

class CheckpointService {
    /**
     * Get all checkpoints
     */
    static async getAllCheckpoints() {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/checkpoints`);
            const data = await response.json();
            
            if (data.status === 'success') {
                return { success: true, checkpoints: data.checkpoints };
            } else {
                throw new Error(data.message || 'Failed to fetch checkpoints');
            }
        } catch (error) {
            console.error('Error fetching checkpoints:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get checkpoints by route ID
     */
    static async getCheckpointsByRoute(routeId) {
        try {
            const response = await fetch(`${API_BASE_URL}/routes/${routeId}/checkpoints`);
            const data = await response.json();
            
            if (data.status === 'success') {
                return { success: true, checkpoints: data.checkpoints };
            } else {
                throw new Error(data.message || 'Failed to fetch checkpoints for route');
            }
        } catch (error) {
            console.error('Error fetching checkpoints by route:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get checkpoint by ID
     */
    static async getCheckpointById(checkpointId) {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/checkpoints/${checkpointId}`);
            const data = await response.json();
            
            if (data.status === 'success') {
                return { success: true, checkpoint: data.checkpoint };
            } else {
                throw new Error(data.message || 'Failed to fetch checkpoint');
            }
        } catch (error) {
            console.error('Error fetching checkpoint:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Create new checkpoint
     */
    static async createCheckpoint(checkpointData) {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/checkpoints`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(checkpointData)
            });
            
            const data = await response.json();
            
            if (data.status === 'success') {
                return { success: true, message: data.message, checkpointId: data.checkpoint_id };
            } else {
                throw new Error(data.message || 'Failed to create checkpoint');
            }
        } catch (error) {
            console.error('Error creating checkpoint:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Update checkpoint
     */
    static async updateCheckpoint(checkpointId, checkpointData) {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/checkpoints/${checkpointId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(checkpointData)
            });
            
            const data = await response.json();
            
            if (data.status === 'success') {
                return { success: true, message: data.message };
            } else {
                throw new Error(data.message || 'Failed to update checkpoint');
            }
        } catch (error) {
            console.error('Error updating checkpoint:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Delete checkpoint
     */
    static async deleteCheckpoint(checkpointId) {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/checkpoints/${checkpointId}`, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if (data.status === 'success') {
                return { success: true, message: data.message };
            } else {
                throw new Error(data.message || 'Failed to delete checkpoint');
            }
        } catch (error) {
            console.error('Error deleting checkpoint:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get fare between two checkpoints
     */
    static async getFareBetweenCheckpoints(fromCheckpointId, toCheckpointId) {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/checkpoints/fare?from=${fromCheckpointId}&to=${toCheckpointId}`);
            const data = await response.json();
            
            if (data.status === 'success') {
                return { success: true, fareInfo: data.fare_info };
            } else {
                throw new Error(data.message || 'Failed to calculate fare');
            }
        } catch (error) {
            console.error('Error calculating fare:', error);
            return { success: false, error: error.message };
        }
    }
}

export default CheckpointService;
