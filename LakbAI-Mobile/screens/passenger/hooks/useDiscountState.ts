import { useState, useCallback } from 'react';
import { discountService, DiscountApplication } from '../../../shared/services/discountService';
import { DiscountStatus } from '../../../shared/services/discountService';
import { useAuthContext } from '../../../shared/providers/AuthProvider';

export const useDiscountState = () => {
  const { session } = useAuthContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [discountStatus, setDiscountStatus] = useState<DiscountStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check if current session is guest
  const isGuestSession = session?.userId === 'guest' || session?.username === 'guest';

  const submitApplication = useCallback(async (application: DiscountApplication) => {
    if (isSubmitting) return { success: false, message: 'Already submitting...' };
    
    // Block guest users from submitting discount applications
    if (isGuestSession) {
      return { success: false, message: 'Please log in to apply for discounts' };
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const result = await discountService.submitApplication(application);
      
      if (result.success) {
        // Update local state to reflect pending status
        setDiscountStatus({
          status: 'pending',
          type: application.discountType,
          percentage: getDiscountPercentage(application.discountType),
          document: application.document,
          applicationDate: new Date().toISOString(),
        });
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting]);

  const fetchDiscountStatus = useCallback(async () => {
    // Don't fetch discount status for guest users
    if (isGuestSession) {
      setDiscountStatus(null);
      return null;
    }

    try {
      const status = await discountService.getDiscountStatus();
      setDiscountStatus(status);
      return status;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch discount status';
      setError(errorMessage);
      return null;
    }
  }, [isGuestSession]);

  const getDiscountPercentage = (type: string): number => {
    switch (type) {
      case 'Student': return 20;
      case 'PWD': return 20;
      case 'Senior Citizen': return 30;
      case 'Pregnant': return 0; // Not implemented yet
      default: return 0;
    }
  };

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isSubmitting,
    discountStatus,
    error,
    submitApplication,
    fetchDiscountStatus,
    clearError,
  };
};
