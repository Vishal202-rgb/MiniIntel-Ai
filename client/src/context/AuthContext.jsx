import React, { createContext, useState, useEffect } from 'react';
import authApi from '../api/authApi';
import apiClient from '../api/client';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      try {
        const parsed = JSON.parse(userInfo);
        setUser(parsed);
        if (parsed.token) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${parsed.token}`;
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${parsed.token}`;
        }
      } catch (e) {
        console.error('Failed to parse cached user info:', e);
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password, requireAdmin = false) => {
    const res = await authApi.login(username, password);
    const userData = res?.data || res;

    if (requireAdmin && userData.role !== 'admin') {
      throw new Error('Access Denied. You are not an administrator.');
    }

    setUser(userData);
    localStorage.setItem('userInfo', JSON.stringify(userData));
    if (userData.token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
    }
    return userData;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (e) {
      // Ignore network errors on logout
    }
    setUser(null);
    localStorage.removeItem('userInfo');
    delete axios.defaults.headers.common['Authorization'];
    delete apiClient.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
