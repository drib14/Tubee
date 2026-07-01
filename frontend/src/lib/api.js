import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach bearer tokens dynamically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Export endpoints
export const authAPI = {
  googleLogin: (idToken) => api.post('/auth/google', { idToken }),
  refresh: (token) => api.post('/auth/refresh', { token })
};

export const videoAPI = {
  getFeed: () => api.get('/videos/feed'),
  getShorts: () => api.get('/videos/shorts'),
  search: (q) => api.get(`/videos/search?q=${encodeURIComponent(q)}`),
  getById: (id) => api.get(`/videos/${id}`),
  toggleLike: (id) => api.post(`/videos/${id}/like`),
  toggleDislike: (id) => api.post(`/videos/${id}/dislike`),
  toggleWatchLater: (id) => api.post(`/videos/${id}/watchlater`)
};

export const commentAPI = {
  getByVideo: (videoId) => api.get(`/comments/${videoId}`),
  create: (videoId, text) => api.post('/comments', { videoId, text })
};

export const channelAPI = {
  getTrending: () => api.get('/channels/trending'),
  get: (idOrHandle) => api.get(`/channels/${idOrHandle}`),
  subscribe: (channelId) => api.post(`/channels/${channelId}/subscribe`)
};

export default api;
