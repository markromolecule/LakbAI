import { API_CONFIG } from '../../config/apiConfig';

export interface TripBookingRequest {
  passenger_id: number;
  driver_id: number;
  route_id: number;
  pickup_location: string;
  destination: string;
  fare: number;
}

export interface TripBookingResponse {
  status: string;
  message: string;
  data?: {
    trip_id: string;
    fare: number;
  };
}

class TripBookingService {
  private baseUrl: string;
  private fallbackUrls: string[] = [
    'http://192.168.254.115/LakbAI/LakbAI-API/routes/api.php',
    'http://192.168.8.104/LakbAI/LakbAI-API/routes/api.php',
    'http://localhost/LakbAI/LakbAI-API/routes/api.php'
  ];

  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
  }

  /**
   * Try to make a request with fallback URLs
   */
  private async makeRequestWithFallback(url: string, options: RequestInit): Promise<Response> {
    const urls = [url, ...this.fallbackUrls];
    
    for (let i = 0; i < urls.length; i++) {
      try {
        console.log(`🌐 Trying URL ${i + 1}/${urls.length}: ${urls[i]}`);
        const response = await fetch(urls[i], options);
        if (response.ok) {
          console.log(`✅ Success with URL: ${urls[i]}`);
          return response;
        }
      } catch (error: any) {
        console.log(`❌ Failed with URL ${urls[i]}:`, error.message);
        if (i === urls.length - 1) {
          throw error; // Re-throw the last error
        }
      }
    }
    
    throw new Error('All URLs failed');
  }

  /**
   * Book a trip through the API
   */
  async bookTrip(tripData: TripBookingRequest): Promise<TripBookingResponse> {
    try {
      console.log('🚀 Booking trip via API:', tripData);
      console.log('🌐 Using base URL:', this.baseUrl);
      console.log('🌐 Full URL:', `${this.baseUrl}/api/mobile/passenger/book-trip`);

      const response = await this.makeRequestWithFallback(`${this.baseUrl}/api/mobile/passenger/book-trip`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tripData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: TripBookingResponse = await response.json();
      console.log('✅ Trip booking API response:', result);

      return result;
    } catch (error) {
      console.error('❌ Error booking trip via API:', error);
      throw error;
    }
  }

  /**
   * Get active trips for a passenger
   */
  async getActiveTrips(passengerId: number): Promise<any> {
    try {
      console.log('🔍 Getting active trips for passenger:', passengerId);

      const response = await this.makeRequestWithFallback(`${this.baseUrl}/api/mobile/passenger/active-trips?passenger_id=${passengerId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Active trips API response:', result);

      return result;
    } catch (error) {
      console.error('❌ Error getting active trips:', error);
      throw error;
    }
  }

  /**
   * Clear all active trips for a passenger (debug function)
   */
  async clearActiveTrips(passengerId: number): Promise<any> {
    try {
      console.log('🧹 Clearing active trips for passenger:', passengerId);
      console.log('🌐 Using base URL:', this.baseUrl);
      console.log('🌐 Full URL:', `${this.baseUrl}/api/mobile/passenger/clear-trips`);

      const response = await this.makeRequestWithFallback(`${this.baseUrl}/api/mobile/passenger/clear-trips`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ passenger_id: passengerId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Clear trips API response:', result);

      return result;
    } catch (error) {
      console.error('❌ Error clearing active trips:', error);
      throw error;
    }
  }
}

export const tripBookingService = new TripBookingService();
