import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Library, Clock, History, Download, FolderHeart, Play, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { videoAPI } from '../lib/api';
import { offlineDb } from '../lib/offlineDb';

const LibraryPage = () => {
  const navigate = useNavigate();
  const { user, isOfflineMode, isAuthenticated } = useAuth();
  
  const [history, setHistory] = useState([]);
  const [watchLater, setWatchLater] = useState([]);
  const [liked, setLiked] = useState([]);
  const [downloads, setDownloads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }

    const fetchLibraryData = async () => {
      setLoading(true);
      try {
        // Load local downloads
        const dlList = await offlineDb.getDownloadedVideos();
        setDownloads(dlList);

        if (!isOfflineMode) {
          // Fetch feed to filter user liked & watch later videos (since they store string IDs in user schema)
          const feedRes = await videoAPI.getFeed();
          const allVids = feedRes.data || [];

          // Read liked / watch later arrays from user profile
          const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
          
          if (storedUser) {
            const watchLaterIds = storedUser.watchLater || [];
            const likedIds = storedUser.likedVideos || [];
            
            // Map IDs to full video objects
            setWatchLater(allVids.filter(v => watchLaterIds.includes(v._id)));
            setLiked(allVids.filter(v => likedIds.includes(v._id)));
            
            // Map history objects
            const histIds = (storedUser.history || []).map(h => h.videoId);
            setHistory(allVids.filter(v => histIds.includes(v._id)));
          }
        }
      } catch (err) {
        console.error('Failed to load library items:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLibraryData();
  }, [isAuthenticated, isOfflineMode]);

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

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid var(--border-color)',
          borderTopColor: 'var(--coffee-200)',
          borderRadius: '50%',
          animation: 'loading 1s linear infinite'
        }} />
      </div>
    );
  }

  const defaultAvatar = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="%234E342E"/><circle cx="50" cy="50" r="24" fill="%23FFFFFF"/><polygon points="43,40 62,50 43,60" fill="%234E342E"/></svg>`;

  const renderVideoSection = (title, icon, videoList, emptyText) => (
    <div style={{ marginBottom: '32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
        {icon}
        <h3 style={{ fontFamily: 'Outfit', fontSize: '1.2rem', color: 'white' }}>{title} ({videoList.length})</h3>
      </div>
      
      <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'thin' }}>
        {videoList.map(video => (
          <div 
            key={video._id} 
            onClick={() => navigate(`/watch/${video._id}`)}
            style={{ minWidth: '220px', maxWidth: '220px', cursor: 'pointer' }}
          >
            <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: '8px', overflow: 'hidden', backgroundColor: 'black' }}>
              <img src={video.thumbnailUrl} alt={video.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <span className="video-card-duration" style={{ fontSize: '0.7rem' }}>
                {formatDuration(video.duration)}
              </span>
            </div>
            <h4 style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'white', marginTop: '6px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.3' }}>
              {video.title}
            </h4>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {video.isYouTubeVideo ? video.youtubeChannelTitle : (video.channel?.name || 'Creator')}
            </span>
          </div>
        ))}

        {videoList.length === 0 && (
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '8px' }}>{emptyText}</span>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ paddingBottom: '60px' }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '12px', 
        borderBottom: '1px solid var(--border-color)', 
        paddingBottom: '16px',
        marginBottom: '24px'
      }}>
        <Library size={24} style={{ color: 'var(--coffee-200)' }} />
        <h1 style={{ fontFamily: 'Outfit', fontSize: '1.6rem', color: 'white' }}>Personal Library Hub</h1>
      </div>

      {renderVideoSection('Recent History', <History size={18} />, history, 'No recently watched videos.')}
      {renderVideoSection('Watch Later', <Clock size={18} />, watchLater, 'Your Watch Later list is empty.')}
      {renderVideoSection('Liked Videos', <FolderHeart size={18} />, liked, 'You have not liked any videos.')}
      {renderVideoSection('Local Downloads', <Download size={18} />, downloads, 'No videos downloaded to this device.')}
    </div>
  );
};

export default LibraryPage;
