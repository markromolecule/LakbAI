import { useState, useCallback } from 'react';
import { discountService, DiscountApplication } from '../../../shared/services/discountService';
import { DiscountStatus } from '../../../shared/services/discountService';

export const useDiscountState = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [discountStatus, setDiscountStatus] = useState<DiscountStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submitApplication = useCallback(async (application: DiscountApplication) => {
    if (isSubmitting) return { success: false, message: 'Already submitting...' };
    
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
    try {
      const status = await discountService.getDiscountStatus();
      setDiscountStatus(status);
      return status;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch discount status';
      setError(errorMessage);
      return null;
    }
  }, []);

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
