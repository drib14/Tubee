import React, { createContext, useState, useEffect, useContext } from 'react';
import { authAPI } from '../lib/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOfflineMode, setOfflineMode] = useState(false);

  useEffect(() => {
    // Check local storage for session
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('accessToken');

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setAccessToken(storedToken);
    }
    setLoading(false);

    // Watch for expired sessions
    const handleLogoutEvent = () => {
      setUser(null);
      setAccessToken(null);
    };

    window.addEventListener('auth-logout', handleLogoutEvent);
    return () => window.removeEventListener('auth-logout', handleLogoutEvent);
  }, []);

  const login = async (idToken) => {
    try {
      const response = await authAPI.googleLogin(idToken);
      const { user: loggedUser, accessToken: token, refreshToken } = response.data;
      
      setUser(loggedUser);
      setAccessToken(token);
      
      localStorage.setItem('user', JSON.stringify(loggedUser));
      localStorage.setItem('accessToken', token);
      localStorage.setItem('refreshToken', refreshToken);
      
      return loggedUser;
    } catch (error) {
      console.error('Login error in AuthContext:', error);
      throw error;
    }
  };

  const logout = () => {
    authAPI.logout();
    setUser(null);
    setAccessToken(null);
  };

  const updateChannelInfo = (channelData) => {
    const updatedUser = { ...user, channel: channelData };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const toggleOfflineMode = () => {
    setOfflineMode(prev => !prev);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        loading,
        login,
        logout,
        updateChannelInfo,
        isOfflineMode,
        toggleOfflineMode,
        isAuthenticated: !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
