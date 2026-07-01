import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Compass, Eye, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { videoAPI, channelAPI } from '../lib/api';

const Home = () => {
  const navigate = useNavigate();
  const { isOfflineMode } = useAuth();
  
  const [videos, setVideos] = useState([]);
  const [filteredVideos, setFilteredVideos] = useState([]);
  const [channels, setChannels] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [feedLoading, setFeedLoading] = useState(false);
  const [error, setError] = useState('');

  const categories = ['All', 'Trending', 'Music', 'Gaming', 'Sports', 'Coffee', 'Coding'];

  // Initial load
  useEffect(() => {
    if (isOfflineMode) {
      setLoading(false);
      return;
    }

    const fetchHomeFeedData = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Fetch videos feed
        const response = await videoAPI.getFeed();
        const feedData = response.data || [];
        setVideos(feedData);
        setFilteredVideos(feedData);

        // Fetch trending creators
        const trendingRes = await channelAPI.getTrending();
        setChannels(trendingRes.data || []);

      } catch (err) {
        console.error('Failed to load feed:', err);
        setError('Failed to load videos. Ensure MERN backend server is active.');
      } finally {
        setLoading(false);
      }
    };

    fetchHomeFeedData();
  }, [isOfflineMode]);

  // Handle category changes and ensure a minimum of 8 videos per category
  useEffect(() => {
    if (loading || isOfflineMode) return;

    const filterFeed = async () => {
      setFeedLoading(true);
      try {
        if (activeCategory === 'All') {
          setFilteredVideos(videos);
        } else if (activeCategory === 'Trending') {
          // Sort blended feed by views count
          const sorted = [...videos].sort((a, b) => (b.views || 0) - (a.views || 0));
          setFilteredVideos(sorted);
        } else {
          // Filter local files matching category or tag strings
          let localMatches = videos.filter(
            v => (v.category && v.category.toLowerCase() === activeCategory.toLowerCase()) ||
                 v.title.toLowerCase().includes(activeCategory.toLowerCase()) ||
                 (v.description && v.description.toLowerCase().includes(activeCategory.toLowerCase()))
          );

          // If local matches are less than 8, dynamically query search results to pad the list
          if (localMatches.length < 8) {
            try {
              const searchRes = await videoAPI.search(activeCategory);
              const ytMatches = searchRes.data.filter(v => v.type === 'video');
              
              const merged = [...localMatches];
              const seenIds = new Set(localMatches.map(v => v._id));
              
              for (const yv of ytMatches) {
                if (!seenIds.has(yv._id)) {
                  seenIds.add(yv._id);
                  merged.push(yv);
                }
              }
              setFilteredVideos(merged.slice(0, 16));
            } catch (searchErr) {
              console.warn('Dynamic category padding query failed:', searchErr.message);
              setFilteredVideos(localMatches);
            }
          } else {
            setFilteredVideos(localMatches);
          }
        }
      } catch (err) {
        console.error('Failed to filter feed category:', err);
      } finally {
        setFeedLoading(false);
      }
    };

    filterFeed();
  }, [activeCategory, videos, loading]);

  const formatDuration = (secs) => {
    if (isNaN(secs) || secs === null) return '0:00';
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const seconds = Math.floor(secs % 60);
    
    if (hrs > 0) {
      return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${seconds < 10 ? '0' : ''}${seconds}`;
    }
    return `${mins}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const formatViews = (views) => {
    if (!views) return '1.2K views';
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
          <Compass size={60} style={{ color: 'var(--accent)' }} />
        </div>
        <div>
          <h2 style={{ fontFamily: 'Outfit', fontSize: '1.8rem', marginBottom: '8px' }}>Offline Library Hub</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '450px', margin: '0 auto' }}>
            Operating offline. Connect to internet or view local browser IndexedDB cache.
          </p>
        </div>
        <Link to="/downloads" className="btn btn-primary">
          Go to Downloads
        </Link>
      </div>
    );
  }

  const defaultPlayButtonAvatar = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="%234E342E"/><circle cx="50" cy="50" r="24" fill="%23FFFFFF"/><polygon points="43,40 62,50 43,60" fill="%234E342E"/></svg>`;

  return (
    <div style={{ paddingBottom: '40px' }}>
      
      {/* Category Pills Filters */}
      <div style={{
        display: 'flex',
        gap: '10px',
        overflowX: 'auto',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        marginBottom: '24px',
        paddingBottom: '4px'
      }} className="category-pills-row">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{
              padding: '8px 16px',
              borderRadius: '20px',
              border: '1px solid var(--border-color)',
              backgroundColor: activeCategory === cat ? 'var(--coffee-200)' : 'var(--bg-card)',
              color: activeCategory === cat ? '#1E1412' : 'white',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.85rem',
              whiteSpace: 'nowrap',
              fontFamily: 'Outfit',
              transition: 'var(--transition)'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {error && (
        <div style={{ backgroundColor: 'rgba(230, 81, 0, 0.1)', border: '1px solid var(--accent)', borderRadius: '8px', padding: '16px', color: 'var(--text-primary)', marginBottom: '24px' }}>
          {error}
        </div>
      )}

      {/* Top Channels Circle Row bubbles */}
      {!loading && channels.length > 0 && activeCategory === 'All' && (
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
            <Sparkles size={16} style={{ color: 'var(--coffee-200)' }} />
            <h3 style={{ fontSize: '1rem', fontFamily: 'Outfit', color: 'white', fontWeight: 'bold' }}>Featured Creators</h3>
          </div>
          <div 
            style={{
              display: 'flex',
              overflowX: 'auto',
              gap: '24px',
              paddingBottom: '12px',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
          >
            {channels.map(ch => (
              <div 
                key={ch._id}
                onClick={() => navigate(`/channel/${ch._id}`)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  minWidth: '90px',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                <img 
                  src={ch.avatar || defaultPlayButtonAvatar} 
                  alt={ch.name} 
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid var(--coffee-700)',
                    transition: 'var(--transition)'
                  }}
                  className="channel-card-avatar-hover"
                />
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '80px' }}>
                  {ch.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dynamic Video Grid (Shows All contents depending on navbars selected) */}
      {loading || feedLoading ? (
        <div className="video-grid">
          {[...Array(8)].map((_, i) => (
            <div key={i} style={{ borderRadius: '12px' }}>
              <div className="skeleton" style={{ aspectRatio: '16/9', borderRadius: '8px', marginBottom: '8px' }} />
              <div className="skeleton" style={{ height: '16px', width: '85%', marginBottom: '6px' }} />
              <div className="skeleton" style={{ height: '12px', width: '50%' }} />
            </div>
          ))}
        </div>
      ) : (
        <div>
          <div className="video-grid">
            {filteredVideos.map(video => (
              <div 
                key={video._id} 
                className="video-card" 
                onClick={() => navigate(`/watch/${video._id}`)}
              >
                <div className="video-card-thumbnail-container">
                  <img src={video.thumbnailUrl} alt={video.title} className="video-card-thumbnail" />
                  <span className="video-card-duration">{formatDuration(video.duration)}</span>
                </div>
                <div className="video-card-details">
                  <img 
                    src={video.isYouTubeVideo ? (video.youtubeChannelAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&q=80') : (video.channel?.avatar || defaultPlayButtonAvatar)}
                    alt="Avatar"
                    style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                  />
                  <div className="video-card-info">
                    <h3 className="video-card-title">{video.title}</h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>
                      {video.isYouTubeVideo ? video.youtubeChannelTitle : (video.channel?.name || 'Personal')}
                    </span>
                    <div className="video-card-metadata">
                      <span>{formatViews(video.views)}</span>
                      <span style={{ margin: '0 4px' }}>•</span>
                      <span>{video.createdAt ? (typeof video.createdAt === 'string' ? video.createdAt.split('T')[0] : 'Recently') : 'Recently'}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredVideos.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
              No videos matching this category found.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Home;
