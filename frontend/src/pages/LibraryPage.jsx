import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Clock, History, ThumbsUp } from 'lucide-react';
import { videoAPI } from '../lib/api';

const LibraryPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [likedList, setLikedList] = useState([]);
  const [watchLaterList, setWatchLaterList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Determine current active filter based on path
  const isHistory = location.pathname.includes('/history');
  const isWatchLater = location.pathname.includes('/watch-later');

  const loadBookmarks = async () => {
    setLoading(true);
    try {
      const likedIds = JSON.parse(localStorage.getItem('likedVideos') || '[]');
      const wlIds = JSON.parse(localStorage.getItem('watchLaterVideos') || '[]');

      // Fetch metadata details for bookmarked items
      const likedFetches = likedIds.map(id => videoAPI.getById(id).then(r => r.data).catch(() => null));
      const wlFetches = wlIds.map(id => videoAPI.getById(id).then(r => r.data).catch(() => null));

      const likedRes = await Promise.all(likedFetches);
      const wlRes = await Promise.all(wlFetches);

      setLikedList(likedRes.filter(Boolean));
      setWatchLaterList(wlRes.filter(Boolean));
    } catch (err) {
      console.error('Loading bookmarks failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookmarks();
  }, [location.pathname]);

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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="skeleton" style={{ width: '100%', aspectRatio: '16/9', borderRadius: '12px' }} />
        ))}
      </div>
    );
  }

  // Render specific layout depending on current selected sub-route path
  const showList = isHistory ? likedList.slice(0, 4) : (isWatchLater ? watchLaterList : null);
  const pageTitle = isHistory ? 'Watch History' : (isWatchLater ? 'Watch Later' : 'Library Dashboard');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
      <div>
        <h1 style={{ fontSize: '1.45rem', fontWeight: 'bold', color: 'white', fontFamily: 'Outfit' }}>{pageTitle}</h1>
        <div style={{ height: '1px', backgroundColor: 'var(--border-color)', marginTop: '8px' }} />
      </div>

      {showList ? (
        <div className="video-grid">
          {showList.map(v => (
            <article 
              key={v._id} 
              className="video-card" 
              onClick={() => navigate(`/watch/${v._id}`)}
            >
              <div className="video-card-thumbnail-container">
                <img className="video-card-thumbnail" src={v.thumbnailUrl} alt={v.title} />
                <span className="video-card-duration">{formatDuration(v.duration)}</span>
              </div>
              <div className="video-card-details">
                <div className="video-card-info" style={{ gap: '2px' }}>
                  <h3 className="video-card-title">{v.title}</h3>
                  <span className="video-card-metadata" style={{ marginTop: '4px' }}>
                    {v.youtubeChannelTitle}
                  </span>
                  <span className="video-card-metadata">
                    {Number(v.views).toLocaleString()} views
                  </span>
                </div>
              </div>
            </article>
          ))}
          {showList.length === 0 && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No videos in this section yet.</p>
          )}
        </div>
      ) : (
        /* Render Full Dashboard overview (Both Watch Later and Liked lists) */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
          {/* Section A: Watch Later */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--coffee-200)' }}>
              <Clock size={20} />
              <h2 style={{ fontSize: '1.1rem', fontWeight: 'bold', fontFamily: 'Outfit' }}>Watch Later ({watchLaterList.length})</h2>
            </div>
            <div className="video-grid">
              {watchLaterList.slice(0, 4).map(v => (
                <article key={v._id} className="video-card" onClick={() => navigate(`/watch/${v._id}`)}>
                  <div className="video-card-thumbnail-container">
                    <img className="video-card-thumbnail" src={v.thumbnailUrl} alt={v.title} />
                    <span className="video-card-duration">{formatDuration(v.duration)}</span>
                  </div>
                  <div className="video-card-details">
                    <div className="video-card-info" style={{ gap: '2px' }}>
                      <h3 className="video-card-title">{v.title}</h3>
                      <span className="video-card-metadata" style={{ marginTop: '4px' }}>{v.youtubeChannelTitle}</span>
                    </div>
                  </div>
                </article>
              ))}
              {watchLaterList.length === 0 && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No videos saved.</p>
              )}
            </div>
          </div>

          {/* Section B: Liked Videos */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--coffee-200)' }}>
              <ThumbsUp size={20} />
              <h2 style={{ fontSize: '1.1rem', fontWeight: 'bold', fontFamily: 'Outfit' }}>Liked Videos ({likedList.length})</h2>
            </div>
            <div className="video-grid">
              {likedList.slice(0, 4).map(v => (
                <article key={v._id} className="video-card" onClick={() => navigate(`/watch/${v._id}`)}>
                  <div className="video-card-thumbnail-container">
                    <img className="video-card-thumbnail" src={v.thumbnailUrl} alt={v.title} />
                    <span className="video-card-duration">{formatDuration(v.duration)}</span>
                  </div>
                  <div className="video-card-details">
                    <div className="video-card-info" style={{ gap: '2px' }}>
                      <h3 className="video-card-title">{v.title}</h3>
                      <span className="video-card-metadata" style={{ marginTop: '4px' }}>{v.youtubeChannelTitle}</span>
                    </div>
                  </div>
                </article>
              ))}
              {likedList.length === 0 && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No liked videos.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LibraryPage;
