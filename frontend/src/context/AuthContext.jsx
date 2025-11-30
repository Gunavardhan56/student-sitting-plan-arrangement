import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

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
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8001';
  const API_BASE = `${BACKEND_URL}/api`;

  // Configure axios defaults
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Check if user is authenticated on mount
  useEffect(() => {
    const initializeAuth = async () => {
      if (token) {
        try {
          const response = await axios.get(`${API_BASE}/auth/profile`);
          if (response.data.success) {
            setUser(response.data.data.employee);
            setIsAuthenticated(true);
          } else {
            // Invalid token
            logout();
          }
        } catch (error) {
          console.error('Auth initialization failed:', error);
          logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, [token, API_BASE]);

  const login = async (empId, password) => {
    try {
      const response = await axios.post(`${API_BASE}/auth/login`, {
        empId,
        password
      });

      if (response.data.success) {
        const { employee, token: newToken } = response.data.data;
        setUser(employee);
        setToken(newToken);
        setIsAuthenticated(true);
        localStorage.setItem('token', newToken);
        return { success: true };
      } else {
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed'
      };
    }
  };

  const register = async (empId, name, email, password) => {
    try {
      const response = await axios.post(`${API_BASE}/auth/register`, {
        empId,
        name,
        email,
        password
      });

      if (response.data.success) {
        const { employee, token: newToken } = response.data.data;
        setUser(employee);
        setToken(newToken);
        setIsAuthenticated(true);
        localStorage.setItem('token', newToken);
        return { success: true };
      } else {
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed'
      };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  };

  const value = {
    user,
    token,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    API_BASE
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};