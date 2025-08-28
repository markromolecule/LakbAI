import { buildApiUrl } from '../../config/developerConfig';

export interface DiscountApplication {
  discountType: string;
  document: {
    uri: string;
    name: string;
    type: string;
  };
}

export interface DiscountStatus {
  status: 'none' | 'pending' | 'approved' | 'rejected';
  type: string;
  percentage: number;
  document?: {
    uri: string;
    name: string;
    type: string;
  };
  applicationDate?: string;
  verifiedBy?: string;
  verifiedAt?: string;
}

class DiscountService {
  private baseUrl: string;

  constructor() {
    // Use the working developerConfig
    this.baseUrl = buildApiUrl();
    console.log('DiscountService initialized with baseUrl:', this.baseUrl);
  }

  /**
   * Submit a discount application
   */
  async submitApplication(application: DiscountApplication): Promise<{ success: boolean; message: string }> {
    try {
      // First upload the document
      const documentUpload = await this.uploadDocument(application.document);
      
      if (!documentUpload.success) {
        throw new Error('Failed to upload document');
      }

      // Then submit the application
      const response = await fetch(`${this.baseUrl}/api/discount/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify({
          discount_type: application.discountType,
          document_path: documentUpload.documentPath,
          document_name: application.document.name,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit application');
      }

      const data = await response.json();
      return {
        success: true,
        message: data.message || 'Application submitted successfully',
      };
    } catch (error) {
      console.error('Error submitting discount application:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Get current discount status for a user
   */
  async getDiscountStatus(): Promise<DiscountStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/api/discount/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch discount status');
      }

      const data = await response.json();
      return data.data || {
        status: 'none',
        type: '',
        percentage: 0,
      };
    } catch (error) {
      console.error('Error fetching discount status:', error);
      return {
        status: 'none',
        type: '',
        percentage: 0,
      };
    }
  }

  /**
   * Upload document to server
   */
  private async uploadDocument(document: { uri: string; name: string; type: string }): Promise<{ success: boolean; documentPath?: string; message?: string }> {
    try {
      const formData = new FormData();
      formData.append('document', {
        uri: document.uri,
        name: document.name,
        type: document.type,
      } as any);

      const response = await fetch(`${this.baseUrl}/api/discount/upload-document`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await this.getAuthToken()}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload document');
      }

      const data = await response.json();
      return {
        success: true,
        documentPath: data.document_path,
      };
    } catch (error) {
      console.error('Error uploading document:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Get authentication token from storage
   */
  private async getAuthToken(): Promise<string> {
    // This should be implemented based on your auth system
    // For now, returning empty string - implement based on your auth context
    return '';
  }
}

export const discountService = new DiscountService();
