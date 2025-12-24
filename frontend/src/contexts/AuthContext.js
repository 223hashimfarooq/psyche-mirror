import { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sign up function
  const signup = async (email, password, userData) => {
    try {
      const response = await apiService.register({
        email,
        password,
        name: userData.name,
        phone: userData.phone || '',
        role: userData.role,
        specialization: userData.specialization || '',
        experience: userData.experience || null
      });

      // Set the token and user data
      if (response.token) {
        apiService.setToken(response.token);
        setCurrentUser(response.user);
        setUserRole(response.user.role);
      }

      return { user: response.user };
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  // Sign in function
  const signin = async (email, password, mfaToken = null, backupCode = null) => {
    try {
      const response = await apiService.login(email, password, mfaToken, backupCode);
      
      // If MFA is required, return that info
      if (response.requiresMFA) {
        return { requiresMFA: true };
      }
      
      // Set the user data
      setCurrentUser(response.user);
      setUserRole(response.user.role);
      
      return { user: response.user };
    } catch (error) {
      console.error('Signin error:', error);
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await apiService.logout();
      setCurrentUser(null);
      setUserRole(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  // Get current user profile
  const getCurrentUserProfile = async () => {
    try {
      const response = await apiService.getProfile();
      setCurrentUser(response.user);
      setUserRole(response.user.role);
      return response.user;
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  };

  // Update user profile
  const updateUserProfile = async (userData) => {
    try {
      const response = await apiService.updateUser(currentUser.id, userData);
      setCurrentUser(response.user);
      return response.user;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  };

  // Update user data in context (for immediate UI updates)
  const updateUser = (userData) => {
    setCurrentUser(prev => ({ ...prev, ...userData }));
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!apiService.token && !!currentUser;
  };

  // Check if user has specific role
  const hasRole = (role) => {
    return userRole === role;
  };

  // Initialize authentication state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if we have a token
        const token = localStorage.getItem('psychemirror_token');
        if (token) {
          // Try to get the current user profile
          await getCurrentUserProfile();
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Clear invalid token
        apiService.clearToken();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const value = {
    currentUser,
    userRole,
    loading,
    signup,
    signin,
    logout,
    getCurrentUserProfile,
    updateUserProfile,
    updateUser,
    isAuthenticated,
    hasRole
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};