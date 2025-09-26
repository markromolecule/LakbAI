import { API_CONFIG } from '../../config/apiConfig';

export interface NetworkRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
}

export interface NetworkResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  success: boolean;
}

export class NetworkError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'NetworkError';
  }
}

/**
 * Centralized network utility with timeout and retry logic
 */
export class NetworkUtils {
  private static async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Make a network request with timeout and retry logic
   */
  static async request<T = any>(
    url: string,
    options: NetworkRequestOptions = {}
  ): Promise<NetworkResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      timeout = API_CONFIG.TIMEOUT,
      retries = API_CONFIG.RETRY_ATTEMPTS
    } = options;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        console.log(`🌐 Network request attempt ${attempt + 1}/${retries + 1}: ${method} ${url}`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const requestOptions: RequestInit = {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...headers,
          },
          signal: controller.signal,
        };

        if (body && method !== 'GET') {
          requestOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
        }

        const response = await fetch(url, requestOptions);
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new NetworkError(
            `HTTP ${response.status}: ${response.statusText}`,
            response.status,
            response
          );
        }

        const data = await response.json();
        
        console.log(`✅ Network request successful: ${method} ${url}`);
        
        return {
          data,
          status: response.status,
          statusText: response.statusText,
          success: true,
        };

      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on certain errors
        if (error instanceof NetworkError && error.status && error.status >= 400 && error.status < 500) {
          console.error(`❌ Client error (no retry): ${error.message}`);
          throw error;
        }

        console.warn(`⚠️ Network request failed (attempt ${attempt + 1}/${retries + 1}): ${(error as Error).message}`);

        // If this is the last attempt, throw the error
        if (attempt === retries) {
          throw error;
        }

        // Wait before retrying (exponential backoff)
        const delayMs = Math.min(1000 * Math.pow(2, attempt), 5000);
        console.log(`⏳ Waiting ${delayMs}ms before retry...`);
        await this.delay(delayMs);
      }
    }

    throw lastError || new Error('Network request failed');
  }

  /**
   * Make a GET request
   */
  static async get<T = any>(
    url: string,
    options: Omit<NetworkRequestOptions, 'method'> = {}
  ): Promise<NetworkResponse<T>> {
    return this.request<T>(url, { ...options, method: 'GET' });
  }

  /**
   * Make a POST request
   */
  static async post<T = any>(
    url: string,
    body?: any,
    options: Omit<NetworkRequestOptions, 'method' | 'body'> = {}
  ): Promise<NetworkResponse<T>> {
    return this.request<T>(url, { ...options, method: 'POST', body });
  }

  /**
   * Make a PUT request
   */
  static async put<T = any>(
    url: string,
    body?: any,
    options: Omit<NetworkRequestOptions, 'method' | 'body'> = {}
  ): Promise<NetworkResponse<T>> {
    return this.request<T>(url, { ...options, method: 'PUT', body });
  }

  /**
   * Make a DELETE request
   */
  static async delete<T = any>(
    url: string,
    options: Omit<NetworkRequestOptions, 'method'> = {}
  ): Promise<NetworkResponse<T>> {
    return this.request<T>(url, { ...options, method: 'DELETE' });
  }

  /**
   * Check if the network is available
   */
  static async isNetworkAvailable(): Promise<boolean> {
    try {
      const response = await fetch('https://www.google.com', {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache',
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get a full API URL by combining base URL with endpoint
   */
  static getApiUrl(endpoint: string): string {
    const baseUrl = require('../../config/apiConfig').getBaseUrl();
    return `${baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  }
}

export default NetworkUtils;
