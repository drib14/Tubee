import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { videoAPI } from '../lib/api';

const CATEGORIES = ['All', 'Trending', 'Music', 'Gaming', 'Sports', 'Coffee', 'Coding'];

const Home = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCategoryFeed = async (category) => {
    setLoading(true);
    try {
      if (category === 'All') {
        const res = await videoAPI.getFeed();
        setVideos(res.data);
      } else {
        const query = category === 'Trending' ? 'trending music coding' : category;
        const res = await videoAPI.search(query);
        // Ensure at least 8 elements are displayed
        setVideos(res.data.filter(v => v.type !== 'channel').slice(0, 16));
      }
    } catch (err) {
      console.error('Feed loading failed:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategoryFeed(selectedCategory);
  }, [selectedCategory]);

  const formatDuration = (secs) => {
    if (!secs) return '0:00';
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const remainingSecs = secs % 60;

    const formattedSecs = remainingSecs < 10 ? `0${remainingSecs}` : remainingSecs;
    if (hrs > 0) {
      const formattedMins = mins < 10 ? `0${mins}` : mins;
      return `${hrs}:${formattedMins}:${formattedSecs}`;
    }
    return `${mins}:${formattedSecs}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Horizontal Category Filters */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        overflowX: 'auto',
        paddingBottom: '8px',
        borderBottom: '1px solid var(--border-color)'
      }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`btn ${selectedCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
            style={{
              padding: '6px 14px',
              fontSize: '0.8rem',
              borderRadius: '8px',
              whiteSpace: 'nowrap'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Main Grid Feed */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {[...Array(12)].map((_, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="skeleton" style={{ width: '100%', aspectRatio: '16/9', borderRadius: '12px' }} />
              <div style={{ display: 'flex', gap: '10px' }}>
                <div className="skeleton" style={{ width: '36px', height: '36px', borderRadius: '50%' }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div className="skeleton" style={{ height: '14px', width: '80%', borderRadius: '4px' }} />
                  <div className="skeleton" style={{ height: '10px', width: '50%', borderRadius: '4px' }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="video-grid">
          {videos.map(v => (
            <article 
              key={v._id} 
              className="video-card" 
              onClick={() => navigate(`/watch/${v._id}`)}
            >
              <div className="video-card-thumbnail-container">
                <img 
                  className="video-card-thumbnail" 
                  src={v.thumbnailUrl} 
                  alt={v.title} 
                />
                <span className="video-card-duration">
                  {formatDuration(v.duration)}
                </span>
              </div>
              <div className="video-card-details">
                <img 
                  src={v.youtubeChannelAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&q=80'} 
                  alt={v.youtubeChannelTitle} 
                  style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover' }} 
                />
                <div className="video-card-info">
                  <h3 className="video-card-title">{v.title}</h3>
                  <span className="video-card-metadata" style={{ marginTop: '4px', fontWeight: '500' }}>
                    {v.youtubeChannelTitle}
                  </span>
                  <span className="video-card-metadata">
                    {Number(v.views).toLocaleString()} views • {v.createdAt}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
