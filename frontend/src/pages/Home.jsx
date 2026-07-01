import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { WifiOff, Search, Compass, Eye, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { videoAPI } from '../lib/api';

const Home = () => {
  const navigate = useNavigate();
  const { isOfflineMode } = useAuth();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOfflineMode) {
      setLoading(false);
      return;
    }

    const fetchFeed = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await videoAPI.getFeed();
        setVideos(response.data);
      } catch (err) {
        console.error('Failed to load feed:', err);
        setError('Failed to load videos from server. Make sure the backend is running.');
      } finally {
        setLoading(false);
      }
    };

    fetchFeed();
  }, [isOfflineMode]);

  // Format seconds to mm:ss
  const formatDuration = (secs) => {
    if (!secs) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Format views
  const formatViews = (views) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M views`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K views`;
    return `${views} views`;
  };

  if (isOfflineMode) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '70vh',
        gap: '20px',
        textAlign: 'center',
        padding: '24px'
      }}>
        <div style={{
          background: 'rgba(230, 81, 0, 0.15)',
          padding: '24px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <WifiOff size={60} style={{ color: 'var(--accent)' }} />
        </div>
        <div>
          <h2 style={{ fontFamily: 'Outfit', fontSize: '1.8rem', marginBottom: '8px' }}>Simulated Offline Mode Active</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '450px', margin: '0 auto' }}>
            You are currently disconnected from the main servers. Explore your cached files or play downloads in IndexedDB storage.
          </p>
        </div>
        <Link to="/downloads" className="btn btn-primary">
          Go to Downloads
        </Link>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: '40px' }}>
      {/* Coffee roast branding banner */}
      <div style={{
        background: 'linear-gradient(135deg, var(--coffee-900) 0%, var(--coffee-800) 100%)',
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
        padding: '32px 24px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ flex: 1, minWidth: '280px' }}>
          <h1 style={{ fontFamily: 'Outfit', fontSize: '2rem', marginBottom: '8px', color: 'var(--text-primary)' }}>
            Welcome to Tubee
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '600px' }}>
            A premium video experience blending Google OAuth profiles, customized players, location tags, Paymongo checkouts, and local IndexedDB offline sync.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link to="/downloads" className="btn btn-secondary">
            View Offline Store
          </Link>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <Compass size={22} style={{ color: 'var(--coffee-200)' }} />
        <h2 style={{ fontSize: '1.4rem' }}>Trending & Uploaded</h2>
      </div>

      {error && (
        <div style={{
          backgroundColor: 'rgba(230, 81, 0, 0.1)',
          border: '1px solid var(--accent)',
          borderRadius: '8px',
          padding: '16px',
          color: 'var(--text-primary)',
          marginBottom: '24px'
        }}>
          {error}
        </div>
      )}

      {loading ? (
        <div className="video-grid">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="video-card" style={{ cursor: 'default' }}>
              <div className="video-card-thumbnail-container skeleton" style={{ paddingTop: '56.25%' }} />
              <div className="video-card-details">
                <div className="skeleton" style={{ width: '36px', height: '36px', borderRadius: '50%' }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div className="skeleton" style={{ height: '16px', width: '90%' }} />
                  <div className="skeleton" style={{ height: '12px', width: '60%' }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="video-grid">
          {videos.map(video => (
            <div 
              key={video._id} 
              className="video-card" 
              onClick={() => navigate(`/watch/${video._id}`)}
            >
              <div className="video-card-thumbnail-container">
                <img 
                  src={video.thumbnailUrl || 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&q=80'} 
                  alt={video.title} 
                  className="video-card-thumbnail"
                  loading="lazy"
                />
                <span className="video-card-duration">
                  {formatDuration(video.duration)}
                </span>
              </div>
              <div className="video-card-details">
                <img 
                  src={
                    video.isYouTubeVideo 
                      ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80' 
                      : (video.channel?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80')
                  } 
                  alt={video.isYouTubeVideo ? video.youtubeChannelTitle : video.channel?.name}
                  className="video-card-avatar"
                />
                <div className="video-card-info">
                  <h3 className="video-card-title">{video.title}</h3>
                  <div className="video-card-channel">
                    {video.isYouTubeVideo ? video.youtubeChannelTitle : (video.channel?.name || 'Personal Upload')}
                  </div>
                  <div className="video-card-metadata">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Eye size={12} /> {formatViews(video.views)}
                    </span>
                    <span style={{ margin: '0 6px' }}>•</span>
                    <span>{video.createdAt ? (typeof video.createdAt === 'string' ? video.createdAt.split('T')[0] : 'Recently') : 'Recently'}</span>
                  </div>
                  {video.location && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--coffee-300)', marginTop: '4px', fontWeight: 'bold' }}>
                      📍 {video.location.name}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
