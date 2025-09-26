import { getBaseUrl } from '../../config/apiConfig';

const GOOGLE_MAPS_API_KEY = 'AIzaSyAtiOFTQdVT6lj7emrLLBWKAbxFWx6Vo_g';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface CheckpointCoordinates {
  [key: string]: Coordinates;
}

class GoogleMapsService {
  private static instance: GoogleMapsService;
  
  static getInstance(): GoogleMapsService {
    if (!GoogleMapsService.instance) {
      GoogleMapsService.instance = new GoogleMapsService();
    }
    return GoogleMapsService.instance;
  }

  // Get coordinates for checkpoints (first try API, then fallback)
  async getCheckpointCoordinates(checkpointName: string): Promise<Coordinates> {
    try {
      // First try to get from your API
      const response = await fetch(`${getBaseUrl()}/checkpoints/coordinates/${encodeURIComponent(checkpointName)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.coordinates) {
          return data.coordinates;
        }
      }
    } catch (error) {
      console.log('API coordinates not found, using fallback');
    }

    // Real coordinates for checkpoints
    const fallbackCoordinates: CheckpointCoordinates = {
      'SM Epza': { latitude: 14.409629181477962, longitude: 120.8584739239211 },
      'Robinson Tejero': { latitude: 14.396361587038916, longitude: 120.86440599975052 },
      'Malabon': { latitude: 14.382509562201045, longitude: 120.87634530641748 },
      'Riverside': { latitude: 14.371008762977079, longitude: 120.88894636603828 },
      'Lancaster New City': { latitude: 14.368944220372283, longitude: 120.89043948162315 },
      'Pasong Camachile I': { latitude: 14.362784771928764, longitude: 120.89522178154438 },
      'Open Canal': { latitude: 14.35597283700001, longitude: 120.89917993041003 },
      'Santiago': { latitude: 14.338339967573228, longitude: 120.90836777424107 },
      'Bella Vista': { latitude: 14.334492325278166, longitude: 120.90943687747456 },
      'San Francisco': { latitude: 14.318158880567536, longitude: 120.9153688438684 },
      'Country Meadow': { latitude: 14.30612462380255, longitude: 120.92167276378188 },
      'Pabahay': { latitude: 14.301797544185217, longitude: 120.92297040415359 },
      'Monterey': { latitude: 14.29226340041011, longitude: 120.92381733064333 },
      'Langkaan': { latitude: 14.29370584510167, longitude: 120.93736803267231 },
      'Tierra Vista': { latitude: 14.296129726839375, longitude: 120.94490055477397 },
      'Robinson Dasmariñas': { latitude: 14.301262844509864, longitude: 120.95323789530529 },
      'SM Dasmariñas': { latitude: 14.300629147336467, longitude: 120.9562685950263 },
    };

    return fallbackCoordinates[checkpointName] || { latitude: 14.409629181477962, longitude: 120.8584739239211 };
  }

  // Get route between two points using Google Directions API
  async getRoute(origin: Coordinates, destination: Coordinates): Promise<Coordinates[]> {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&key=${GOOGLE_MAPS_API_KEY}`
      );
      
      const data = await response.json();
      
      if (data.status === 'OK' && data.routes.length > 0) {
        return this.decodePolyline(data.routes[0].overview_polyline.points);
      }
      
      throw new Error('No route found');
    } catch (error) {
      console.error('Error getting route:', error);
      // Return a simple straight line if API fails
      return [origin, destination];
    }
  }

  // Decode polyline from Google Directions API
  private decodePolyline(encoded: string): Coordinates[] {
    const poly = [];
    let index = 0;
    const len = encoded.length;
    let lat = 0;
    let lng = 0;

    while (index < len) {
      let b;
      let shift = 0;
      let result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      poly.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5,
      });
    }

    return poly;
  }

  // Calculate distance between two points
  calculateDistance(point1: Coordinates, point2: Coordinates): number {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = this.deg2rad(point2.latitude - point1.latitude);
    const dLon = this.deg2rad(point2.longitude - point1.longitude);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(point1.latitude)) *
        Math.cos(this.deg2rad(point2.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers
    return distance;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  // Get estimated travel time
  async getEstimatedTravelTime(origin: Coordinates, destination: Coordinates): Promise<number> {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&key=${GOOGLE_MAPS_API_KEY}`
      );
      
      const data = await response.json();
      
      if (data.status === 'OK' && data.routes.length > 0) {
        return data.routes[0].legs[0].duration.value / 60; // Convert to minutes
      }
      
      // Fallback: estimate based on distance
      const distance = this.calculateDistance(origin, destination);
      return Math.round(distance * 2); // Rough estimate: 2 minutes per km
    } catch (error) {
      console.error('Error getting travel time:', error);
      const distance = this.calculateDistance(origin, destination);
      return Math.round(distance * 2);
    }
  }

  // Calculate map bounds for multiple coordinates
  calculateBounds(coordinates: Coordinates[]) {
    const latitudes = coordinates.map(coord => coord.latitude);
    const longitudes = coordinates.map(coord => coord.longitude);
    
    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);
    
    const latDelta = (maxLat - minLat) * 1.2; // Add 20% padding
    const lngDelta = (maxLng - minLng) * 1.2;
    
    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max(latDelta, 0.01),
      longitudeDelta: Math.max(lngDelta, 0.01),
    };
  }
}

export const googleMapsService = GoogleMapsService.getInstance();
