// src/services/jeepneyService.js

class JeepneyService {
  static API_BASE_URL = "/api/admin/jeepneys"; // Adjust if needed

  /**
   * Get all jeepneys
   */
  static async getJeepneys() {
    try {
      const response = await fetch(this.API_BASE_URL);
      const data = await response.json();

      if (data.status === "success") {
        return { success: true, data: data.jeepneys || [] };
      } else {
        throw new Error(data.message || "Failed to fetch jeepneys");
      }
    } catch (error) {
      console.error("Error fetching jeepneys:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Create jeepney
   */
  static async createJeepney(jeepneyData) {
    try {
      const response = await fetch(this.API_BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(jeepneyData),
      });
      const data = await response.json();

      if (data.status === "success") {
        return { success: true, data: data.jeepney };
      } else {
        throw new Error(data.message || "Failed to create jeepney");
      }
    } catch (error) {
      console.error("Error creating jeepney:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update jeepney
   */
  static async updateJeepney(id, jeepneyData) {
    try {
      const response = await fetch(`${this.API_BASE_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(jeepneyData),
      });
      const data = await response.json();

      if (data.status === "success") {
        return { success: true, data: data.jeepney };
      } else {
        throw new Error(data.message || "Failed to update jeepney");
      }
    } catch (error) {
      console.error("Error updating jeepney:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete jeepney
   */
  static async deleteJeepney(id) {
    try {
      const response = await fetch(`${this.API_BASE_URL}/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (data.status === "success") {
        return { success: true, message: data.message };
      } else {
        throw new Error(data.message || "Failed to delete jeepney");
      }
    } catch (error) {
      console.error("Error deleting jeepney:", error);
      return { success: false, error: error.message };
    }
  }
}

export default JeepneyService;
