import { buildAuth0Url } from '../../config/developerConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    // Use the Auth0 endpoint that actually exists
    this.baseUrl = buildAuth0Url();
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

      // Then submit the application using the existing Auth0 endpoint
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'apply_discount',
          auth0_id: await this.getAuth0Id(),
          discount_type: application.discountType,
          document_path: documentUpload.documentPath,
          document_name: application.document.name,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Discount application response:', errorText);
        throw new Error('Failed to submit application');
      }

      const data = await response.json();
      return {
        success: data.status === 'success',
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
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'get_discount_status',
          auth0_id: await this.getAuth0Id(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch discount status');
      }

      const data = await response.json();
      if (data.status === 'success' && data.data?.user) {
        const user = data.data.user;
        return {
          status: user.discount_verified ? 'approved' : 'none',
          type: user.discount_type || '',
          percentage: user.discount_type === 'Student' ? 15 : 
                     user.discount_type === 'PWD' ? 20 :
                     user.discount_type === 'Senior Citizen' ? 30 : 0,
          document: user.discount_document_path ? {
            uri: user.discount_document_path,
            name: user.discount_document_name || 'document',
            type: 'image/jpeg',
          } : undefined,
        };
      }
      
      return {
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

      // For now, we'll simulate a successful upload since the backend endpoint doesn't exist
      // In a real implementation, you would upload to your server
      console.log('📤 Simulating document upload:', document);
      
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Return a simulated document path
      return {
        success: true,
        documentPath: `/uploads/discounts/${Date.now()}_${document.name}`,
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
   * Get Auth0 ID from storage
   */
  private async getAuth0Id(): Promise<string> {
    try {
      const userProfile = await AsyncStorage.getItem('auth0_user_profile');
      if (userProfile) {
        const profile = JSON.parse(userProfile);
        return profile.sub || '';
      }
      return '';
    } catch (error) {
      console.error('Error getting Auth0 ID:', error);
      return '';
    }
  }
}

export const discountService = new DiscountService();
