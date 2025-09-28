import { getBaseUrl } from '../../config/apiConfig';

export interface SearchResult {
  id: string | number;
  [key: string]: any;
}

export interface RouteSearchResult {
  id: number;
  route_name: string;
  origin: string;
  destination: string;
  fare_base: string;
  status: string;
  checkpoint_count: number;
}

export interface FareSearchResult {
  id: number;
  fare_amount: string;
  from_checkpoint: string;
  to_checkpoint: string;
  route_name: string;
  origin: string;
  destination: string;
}

export interface CheckpointSearchResult {
  id: number;
  checkpoint_name: string;
  sequence_order: number;
  is_origin: boolean;
  is_destination: boolean;
  route_name: string;
  origin: string;
  destination: string;
}

export interface SearchResponse {
  status: string;
  data: SearchResult[];
  total: number;
  query: string;
}

export interface CombinedSearchResponse {
  status: string;
  data: {
    routes: RouteSearchResult[];
    fares: FareSearchResult[];
    checkpoints: CheckpointSearchResult[];
  };
  totals: {
    routes: number;
    fares: number;
    checkpoints: number;
  };
  query: string;
}

class SearchService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = getBaseUrl().replace('/routes/api.php', '');
  }

  /**
   * Search routes dynamically from database
   */
  async searchRoutes(query: string, limit: number = 20): Promise<SearchResponse> {
    try {
      const url = `${this.baseUrl}/search/routes?q=${encodeURIComponent(query)}&limit=${limit}`;
      console.log('🔍 Searching routes:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('🔍 Routes search result:', result);
      return result;

    } catch (error) {
      console.error('❌ Search routes error:', error);
      return {
        status: 'error',
        data: [],
        total: 0,
        query
      };
    }
  }

  /**
   * Search fare matrix dynamically from database
   */
  async searchFares(query: string, limit: number = 50): Promise<SearchResponse> {
    try {
      const url = `${this.baseUrl}/search/fares?q=${encodeURIComponent(query)}&limit=${limit}`;
      console.log('🔍 Searching fares:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('🔍 Fares search result:', result);
      return result;

    } catch (error) {
      console.error('❌ Search fares error:', error);
      return {
        status: 'error',
        data: [],
        total: 0,
        query
      };
    }
  }

  /**
   * Search checkpoints dynamically from database
   */
  async searchCheckpoints(query: string, limit: number = 30): Promise<SearchResponse> {
    try {
      const url = `${this.baseUrl}/search/checkpoints?q=${encodeURIComponent(query)}&limit=${limit}`;
      console.log('🔍 Searching checkpoints:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('🔍 Checkpoints search result:', result);
      return result;

    } catch (error) {
      console.error('❌ Search checkpoints error:', error);
      return {
        status: 'error',
        data: [],
        total: 0,
        query
      };
    }
  }

  /**
   * Combined search across all types
   */
  async searchAll(query: string, limit: number = 20): Promise<CombinedSearchResponse> {
    try {
      const url = `${this.baseUrl}/search/all?q=${encodeURIComponent(query)}&limit=${limit}`;
      console.log('🔍 Searching all:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('🔍 Combined search result:', result);
      return result;

    } catch (error) {
      console.error('❌ Search all error:', error);
      return {
        status: 'error',
        data: {
          routes: [],
          fares: [],
          checkpoints: []
        },
        totals: {
          routes: 0,
          fares: 0,
          checkpoints: 0
        },
        query
      };
    }
  }

  /**
   * Debounced search with delay
   */
  debounceSearch<T>(
    searchFunction: () => Promise<T>,
    delay: number = 300
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      setTimeout(async () => {
        try {
          const result = await searchFunction();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, delay);
    });
  }
}

export const searchService = new SearchService();
