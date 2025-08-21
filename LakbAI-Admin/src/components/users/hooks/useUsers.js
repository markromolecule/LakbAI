import { useState, useEffect, useCallback } from 'react';
import UserService from '../../../services/userService';

export const useUsers = (userType = null, onDataUpdate) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    search: '',
    discountStatus: '',
    userType: userType || ''
  });

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Debug logging
      console.log('🔍 useUsers - Loading users with userType:', userType);
      console.log('🔍 useUsers - Current filters:', filters);

      // Always use the userType prop for filtering, not the filters state
      const result = await UserService.getUsers({
        userType: userType || undefined,
        discountStatus: filters.discountStatus || undefined,
        page: currentPage,
        limit: 10
      });

      console.log('🔍 useUsers - API result:', result);

      if (result.success) {
        setUsers(result.users || []);
        setPagination(result.pagination || {});
        console.log('🔍 useUsers - Users loaded:', result.users?.length || 0);
      } else {
        setError(result.error || 'Failed to load users');
      }
    } catch (error) {
      console.error('Error loading users:', error);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters.discountStatus, userType, onDataUpdate]);

  const handleFilterChange = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  // Reset to page 1 when userType changes
  useEffect(() => {
    console.log('🔍 useUsers - userType changed to:', userType);
    setCurrentPage(1);
  }, [userType]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  return {
    users,
    loading,
    error,
    currentPage,
    pagination,
    filters,
    loadUsers,
    handleFilterChange,
    handlePageChange
  };
};
