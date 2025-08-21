import { useState, useEffect, useCallback } from 'react';
import UserService from '../../../services/userService';

export const usePendingUsers = (onDataUpdate) => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [allDiscountUsers, setAllDiscountUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [viewMode, setViewMode] = useState('pending');

  const loadPendingUsers = useCallback(async () => {
    try {
      setLoading(true);
      const result = await UserService.getPendingApprovals();
      if (result.success) {
        setPendingUsers(result.users || []);
      }
    } catch (error) {
      console.error('Error loading pending users:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadAllDiscountUsers = useCallback(async () => {
    try {
      const result = await UserService.getAllDiscountApplications();
      if (result.success) {
        setAllDiscountUsers(result.users || []);
      }
    } catch (error) {
      console.error('Error loading all discount users:', error);
    }
  }, []);

  useEffect(() => {
    loadPendingUsers();
    loadAllDiscountUsers();
  }, [loadPendingUsers, loadAllDiscountUsers]);

  return {
    pendingUsers,
    allDiscountUsers,
    loading,
    processing,
    viewMode,
    setViewMode,
    loadPendingUsers,
    loadAllDiscountUsers
  };
};
