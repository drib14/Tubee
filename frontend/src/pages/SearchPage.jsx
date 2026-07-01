import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Eye, Clock, Search, ListFilter } from 'lucide-react';
import { videoAPI } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const SearchPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const { isOfflineMode } = useAuth();

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOfflineMode) {
      setError('Search is disabled in offline mode. Browse your downloads instead.');
      setLoading(false);
      return;
    }

    const performSearch = async () => {
      if (!query.trim()) return;
      
      setLoading(true);
      setError('');
      try {
        const response = await videoAPI.search(query);
        setResults(response.data);
      } catch (err) {
        console.error(err);
        setError('Search query failed. Check backend logs.');
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [query, isOfflineMode]);

  // Format seconds to mm:ss
  const formatDuration = (secs) => {
    if (!secs) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const formatViews = (views) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M views`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K views`;
    return `${views} views`;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '40px' }}>
        {[...Array(5)].map((_, i) => (
          <div key={i} style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            <div className="skeleton" style={{ width: '240px', aspectRatio: '16/9', borderRadius: '8px' }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '280px' }}>
              <div className="skeleton" style={{ height: '20px', width: '80%' }} />
              <div className="skeleton" style={{ height: '14px', width: '40%' }} />
              <div className="skeleton" style={{ height: '12px', width: '90%' }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: '40px' }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '12px', 
        borderBottom: '1px solid var(--border-color)', 
        paddingBottom: '16px',
        marginBottom: '24px'
      }}>
        <Search size={22} style={{ color: 'var(--coffee-200)' }} />
        <h1 style={{ fontFamily: 'Outfit', fontSize: '1.4rem' }}>
          Search results for: <span style={{ color: 'var(--coffee-200)' }}>"{query}"</span>
        </h1>
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {results.map(video => (
          <div
            key={video._id}
            onClick={() => navigate(`/watch/${video._id}`)}
            style={{
              display: 'flex',
              gap: '20px',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '16px',
              cursor: 'pointer',
              transition: 'var(--transition)',
              flexWrap: 'wrap'
            }}
            className="queue-card-hover"
          >
            {/* Thumbnail */}
            <div style={{
              position: 'relative',
              width: '100%',
              maxWidth: '240px',
              aspectRatio: '16/9',
              backgroundColor: '#000',
              borderRadius: '8px',
              overflow: 'hidden',
              flexShrink: 0
            }}>
              <img src={video.thumbnailUrl} alt={video.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <span className="video-card-duration">
                {formatDuration(video.duration)}
              </span>
            </div>

            {/* Info */}
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              minWidth: '280px',
              padding: '4px 0'
            }}>
              <h3 style={{ fontFamily: 'Outfit', fontSize: '1.15rem', fontWeight: 'bold', color: 'white', marginBottom: '6px' }}>
                {video.title}
              </h3>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                <span style={{ fontWeight: 'bold' }}>
                  {video.isYouTubeVideo ? video.youtubeChannelTitle : (video.channel?.name || 'Creator')}
                </span>
                <span>•</span>
                <span>{formatViews(video.views)}</span>
                <span>•</span>
                <span>{video.createdAt ? (typeof video.createdAt === 'string' ? video.createdAt.split('T')[0] : 'Recently') : 'Recently'}</span>
              </div>

              <p style={{ 
                fontSize: '0.85rem', 
                color: 'var(--text-muted)', 
                display: '-webkit-box', 
                WebkitLineClamp: 2, 
                WebkitBoxOrient: 'vertical', 
                overflow: 'hidden',
                lineHeight: '1.4'
              }}>
                {video.description || 'Watch this high-quality stream directly inside the Tubee custom media player.'}
              </p>

              {video.location && (
                <span style={{ fontSize: '0.75rem', color: 'var(--coffee-300)', marginTop: '8px', fontWeight: 'bold' }}>
                  📍 {video.location.name}
                </span>
              )}
            </div>
          </div>
        ))}

        {!loading && results.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            No videos match your search query. Try another term like "lofi coding" or "coffee tutorial".
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
