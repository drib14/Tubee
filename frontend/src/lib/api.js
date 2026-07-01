import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to append JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle transparent JWT Token Refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Check if error is 401 (Unauthorized) and we haven't already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refToken = localStorage.getItem('refreshToken');
      
      if (refToken) {
        try {
          const res = await axios.post('http://localhost:5000/api/auth/refresh', { token: refToken });
          const { accessToken, refreshToken: newRefreshToken } = res.data;
          
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);
          
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch (refreshErr) {
          console.error('Session expired, logging out...', refreshErr);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.dispatchEvent(new Event('auth-logout'));
        }
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth Endpoints
export const authAPI = {
  googleLogin: (idToken) => api.post('/auth/google', { idToken }),
  getProfile: () => api.get('/auth/me'),
  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.dispatchEvent(new Event('auth-logout'));
  }
};

// Video Endpoints
export const videoAPI = {
  getFeed: () => api.get('/videos'),
  search: (query) => api.get(`/videos/search?q=${encodeURIComponent(query)}`),
  getById: (id) => api.get(`/videos/${id}`),
  upload: (videoData) => api.post('/videos', videoData),
  toggleLike: (id) => api.post(`/videos/${id}/like`),
  toggleDislike: (id) => api.post(`/videos/${id}/dislike`),
  toggleWatchLater: (id) => api.post(`/videos/${id}/watch-later`),
  logHistory: (videoId, progress) => api.post('/videos/history', { videoId, progress }),
  getSyncedDownloads: () => api.get('/videos/downloads'),
  syncDownload: (videoId) => api.post('/videos/downloads', { videoId }),
  unsyncDownload: (id) => api.delete(`/videos/downloads/${id}`),
};

// Channel Endpoints
export const channelAPI = {
  create: (channelData) => api.post('/channels', channelData),
  get: (idOrHandle) => api.get(`/channels/${idOrHandle}`),
  update: (channelData) => api.put('/channels', channelData),
  subscribe: (channelId) => api.post(`/channels/${channelId}/subscribe`),
  getTrending: () => api.get('/channels/trending'),
};

// Comment Endpoints
export const commentAPI = {
  getByVideo: (videoId) => api.get(`/comments/${videoId}`),
  create: (commentData) => api.post('/comments', commentData),
};

// Payment (Paymongo) Endpoints
export const paymentAPI = {
  createSession: (paymentData) => api.post('/payment/checkout', paymentData),
  verify: (sessionId) => api.get(`/payment/verify/${sessionId}`),
};

// Location (LocationIQ) Endpoints
export const locationAPI = {
  reverseGeocode: (lat, lon) => api.get(`/location/reverse?lat=${lat}&lon=${lon}`),
};

export default api;
