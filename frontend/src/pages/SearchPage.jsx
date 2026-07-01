import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { videoAPI } from '../lib/api';

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';
  
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      if (!query.trim()) return;
      setLoading(true);
      try {
        const res = await videoAPI.search(query);
        setResults(res.data);
      } catch (err) {
        console.error('Search request failed:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query]);

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

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div className="skeleton" style={{ width: '240px', aspectRatio: '16/9', borderRadius: '12px' }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div className="skeleton" style={{ height: '18px', width: '60%', borderRadius: '4px' }} />
              <div className="skeleton" style={{ height: '12px', width: '30%', borderRadius: '4px' }} />
              <div className="skeleton" style={{ height: '10px', width: '40%', borderRadius: '4px' }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '1.1rem', fontFamily: 'Outfit', fontWeight: 'bold', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
        Results for "{query}"
      </h2>

      {results.map((item, idx) => {
        if (item.type === 'channel') {
          return (
            <div 
              key={item._id || idx}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '24px',
                padding: '16px 20px',
                backgroundColor: 'var(--bg-card)',
                borderRadius: '12px',
                border: '1px solid var(--border-color)'
              }}
            >
              <Link to={`/channel/${item.handle}`}>
                <img 
                  src={item.avatar} 
                  alt={item.name} 
                  style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border-color)', transition: 'var(--transition)' }}
                  className="channel-card-avatar-hover"
                />
              </Link>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <Link to={`/channel/${item.handle}`} style={{ textDecoration: 'none', color: 'white' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 'bold' }}>{item.name}</h3>
                </Link>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>@{item.handle} • {item.subscribersCount}</span>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>{item.description}</p>
              </div>
              <Link to={`/channel/${item.handle}`} className="btn btn-secondary" style={{ borderRadius: '20px', fontSize: '0.8rem' }}>
                Visit Channel
              </Link>
            </div>
          );
        }

        // Render standard video cards
        return (
          <div 
            key={item._id || idx}
            style={{
              display: 'flex',
              gap: '16px',
              cursor: 'pointer',
              alignItems: 'flex-start',
              paddingBottom: '16px',
              borderBottom: '1px solid rgba(255,255,255,0.03)'
            }}
            onClick={() => navigate(`/watch/${item._id}`)}
          >
            <div style={{ position: 'relative', width: '240px', flexShrink: 0, aspectRatio: '16/9', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
              <img src={item.thumbnailUrl} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <span className="video-card-duration">{formatDuration(item.duration)}</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 'bold', color: 'white', lineHeight: '1.3' }}>{item.title}</h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {Number(item.views).toLocaleString()} views • {item.createdAt}
              </span>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '6px 0' }}>
                <img 
                  src={item.youtubeChannelAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&q=80'} 
                  alt={item.youtubeChannelTitle} 
                  style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover' }} 
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: '600' }}>{item.youtubeChannelTitle}</span>
              </div>

              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {item.description}
              </p>
            </div>
          </div>
        );
      })}

      {results.length === 0 && (
        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
          No search matches found.
        </div>
      )}
    </div>
  );
};

export default SearchPage;
