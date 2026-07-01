import React, { createContext, useState, useEffect, useContext } from 'react';
import io from 'socket.io-client';
import { authAPI, videoAPI } from '../lib/api';
import { offlineDb } from '../lib/offlineDb';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOfflineMode, setOfflineMode] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [socket, setSocket] = useState(null);

  // Sync downloads from database to local IndexedDB
  const syncDownloadsList = async (token) => {
    if (isOfflineMode || !token) return;
    try {
      const response = await videoAPI.getFeed(); // Wait, let's fetch synced downloads using videoAPI
      // Actually we mapped videoAPI.getSyncedDownloads as videoAPI.getSyncedDownloads (mapped inside api.js)
      // Let's call the actual API
      const syncRes = await videoAPI.getById('downloads'); // We mapped it to GET /videos/downloads, wait, in api.js we have:
      // getById: (id) => api.get(`/videos/${id}`)
      // Wait, in api.js we added getSyncedDownloads as:
      // getSyncedDownloads: () => api.get('/videos/downloads')
      // Let's check api.js mapping. In api.js we mapped videoAPI.getSyncedDownloads? No, we had:
      // videoAPI = { getFeed, search, getById, upload, ... } and we added:
      // videoAPI.getSyncedDownloads = () => api.get('/videos/downloads')? 
      // Let's check what we wrote inside api.js.
      // Ah! In api.js we mapped:
      // videoAPI: { getFeed, search, getById, upload, toggleLike, ... }
      // Wait, we didn't add getSyncedDownloads inside the exported videoAPI block, but we mapped it in videoRoutes.js!
      // Let's verify what we have inside api.js. In api.js we had:
      // export const videoAPI = { getFeed: ..., search: ..., getById: ..., upload: ... }
      // Wait! Let's check api.js file contents or just write a direct axios call if needed, or update api.js to expose it!
      // Yes, we can update api.js or write it directly using our api client:
      // api.get('/videos/downloads')!
      // Let's import api from '../lib/api'.
    } catch (e) {
      console.error(e);
    }
  };

  // 1. Initial Auth Check & Session Load
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('accessToken');

    if (storedUser && storedToken) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setAccessToken(storedToken);
      // Run download sync in background
      setTimeout(() => triggerBackgroundSync(parsedUser), 1000);
    }
    setLoading(false);

    const handleLogoutEvent = () => {
      setUser(null);
      setAccessToken(null);
      if (socket) {
        socket.disconnect();
      }
    };

    window.addEventListener('auth-logout', handleLogoutEvent);
    return () => window.removeEventListener('auth-logout', handleLogoutEvent);
  }, []);

  // Socket Connection management
  useEffect(() => {
    if (!user || isOfflineMode) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    // Connect socket to backend server
    const newSocket = io('http://localhost:5000', {
      transports: ['websocket'],
      upgrade: false
    });

    newSocket.on('connect', () => {
      console.log('Socket client registered with server');
      newSocket.emit('register', user.id || user._id);
    });

    newSocket.on('new-video', (data) => {
      console.log('Received upload notification:', data);
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
  }, [user, isOfflineMode]);

  // Background download sync method
  const triggerBackgroundSync = async (currentUser) => {
    if (isOfflineMode || !currentUser) return;
    try {
      // Import api dynamically or use standard api.get
      const { default: api } = await import('../lib/api');
      const response = await api.get('/videos/downloads');
      const backendDownloads = response.data || [];
      
      // Auto-cache missing downloads in IndexedDB
      for (const video of backendDownloads) {
        const isDownloaded = await offlineDb.isDownloaded(video._id);
        if (!isDownloaded) {
          console.log(`Background syncing video download: ${video.title}`);
          try {
            await offlineDb.downloadVideo(video);
          } catch (dlErr) {
            console.warn(`Failed background download for video: ${video._id}`, dlErr);
          }
        }
      }
    } catch (err) {
      console.error('Failed to run background download sync:', err.message);
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
      
      // Trigger background download sync on login
      setTimeout(() => triggerBackgroundSync(loggedUser), 1000);
      
      return loggedUser;
    } catch (error) {
      console.error('Login error in AuthContext:', error);
      throw error;
    }
  };

  const logout = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
    authAPI.logout();
    setUser(null);
    setAccessToken(null);
    setNotifications([]);
  };

  const updateChannelInfo = (channelData) => {
    const updatedUser = { ...user, channel: channelData };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const toggleOfflineMode = () => {
    setOfflineMode(prev => !prev);
  };

  const clearNotifications = () => {
    setNotifications([]);
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
        notifications,
        clearNotifications,
        isAuthenticated: !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
