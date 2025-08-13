import { useState, useContext, createContext, useEffect } from 'react';
import { authApi } from '../services';
import { storage } from '../utils';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Check for existing token on app start
    const token = storage.getToken();
    if (token) {
      // Validate token and get user info
      validateToken();
    } else {
      setInitialized(true);
    }
  }, []);

  const validateToken = async () => {
    try {
      setLoading(true);
      const userData = await authApi.validateToken();
      setUser(userData);
    } catch (error) {
      storage.removeToken();
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  };

  const login = async (credentials) => {
    try {
      setLoading(true);
      const response = await authApi.login(credentials);
      const { user: userData, token } = response;
      
      storage.setToken(token);
      setUser(userData);
      return userData;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      const response = await authApi.register(userData);
      const { user: newUser, token } = response;
      
      storage.setToken(token);
      setUser(newUser);
      return newUser;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    storage.removeToken();
    setUser(null);
  };

  const value = {
    user,
    loading,
    initialized,
    login,
    register,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
