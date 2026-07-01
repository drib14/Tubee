import React, { createContext, useState, useEffect, useContext } from 'react';
import io from 'socket.io-client';
import { authAPI, channelAPI } from '../lib/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [socket, setSocket] = useState(null);

  // 1. Session Initialization
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('accessToken');

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setAccessToken(storedToken);
    }
    setLoading(false);
  }, []);

  // 2. Socket notifications registry
  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const newSocket = io('http://localhost:5000', {
      transports: ['websocket'],
      upgrade: false
    });

    newSocket.on('connect', () => {
      console.log('Registered socket stream for profile notifications');
      newSocket.emit('register', user.id || user._id);
    });

    newSocket.on('new-video', (data) => {
      setNotifications(prev => [
        {
          id: Date.now(),
          title: 'New Video Uploaded!',
          message: `"${data.videoTitle}" has been posted by ${data.channelName}`,
          videoId: data.videoId,
          timestamp: new Date()
        },
        ...prev
      ]);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  // Sync YouTube Subscriptions automatically from backend
  const triggerAutoChannelSync = async () => {
    try {
      const trendingRes = await channelAPI.getTrending();
      const syncedSubs = trendingRes.data.map(item => ({
        _id: item._id,
        name: item.name,
        avatar: item.avatar
      }));
      localStorage.setItem('subscribedChannels', JSON.stringify(syncedSubs));
      window.dispatchEvent(new Event('subscribe-change'));
      console.log('Dynamic local subscriptions populated.');
    } catch (e) {
      console.warn('Fallback sync failed:', e.message);
    }
  };

  const login = async (idToken) => {
    try {
      const response = await authAPI.googleLogin(idToken);
      const { user: loggedUser, accessToken: token, refreshToken } = response.data;
      
      setUser(loggedUser);
      setAccessToken(token);
      
      localStorage.setItem('user', JSON.stringify(loggedUser));
      localStorage.setItem('accessToken', token);
      localStorage.setItem('refreshToken', refreshToken);
      
      // Auto-sync channels immediately upon logging in
      await triggerAutoChannelSync();

      return response.data;
    } catch (error) {
      console.error('Authentication request failed:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('subscribedChannels');
    window.dispatchEvent(new Event('subscribe-change'));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  return (
    <AuthContext.Provider value={{
      user,
      accessToken,
      loading,
      login,
      logout,
      isAuthenticated: !!user,
      notifications,
      clearNotifications
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
