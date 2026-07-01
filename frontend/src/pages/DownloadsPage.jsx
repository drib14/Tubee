import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Trash2, Video, WifiOff } from 'lucide-react';
import { offlineDb } from '../lib/offlineDb';

const DownloadsPage = () => {
  const navigate = useNavigate();
  const [downloads, setDownloads] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDownloads = async () => {
    try {
      const list = await offlineDb.getDownloadedVideos();
      setDownloads(list);
    } catch (err) {
      console.error('Failed to load downloads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDownloads();
  }, []);

  const handleDelete = async (e, videoId) => {
    e.stopPropagation(); // Prevent card navigation trigger
    if (window.confirm('Delete this offline download?')) {
      await offlineDb.deleteDownloadedVideo(videoId);
      await fetchDownloads();
    }
  };

  // Format seconds to mm:ss
  const formatDuration = (secs) => {
    if (!secs) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
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

  return (
    <div style={{ paddingBottom: '40px' }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '16px',
        marginBottom: '24px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Download size={24} style={{ color: 'var(--coffee-200)' }} />
          <h1 style={{ fontFamily: 'Outfit', fontSize: '1.6rem' }}>Offline Downloads Library</h1>
        </div>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          IndexedDB Storage
        </span>
      </div>

      {downloads.length === 0 ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '50vh',
          gap: '16px',
          backgroundColor: 'var(--bg-card)',
          borderRadius: '12px',
          border: '1px dashed var(--border-color)',
          padding: '40px',
          textAlign: 'center'
        }}>
          <Video size={48} style={{ color: 'var(--text-muted)' }} />
          <div>
            <h3 style={{ fontFamily: 'Outfit', fontSize: '1.2rem', marginBottom: '6px' }}>Your Downloads Library is Empty</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '400px' }}>
              Download custom videos or YouTube clips to watch them anywhere, even when you toggle Offline Mode.
            </p>
          </div>
          <button onClick={() => navigate('/')} className="btn btn-primary" style={{ marginTop: '8px' }}>
            Browse Videos
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {downloads.map(video => (
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
                position: 'relative',
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
                <span className="badge-offline" style={{ position: 'absolute', top: '8px', left: '8px' }}>
                  Offline
                </span>
              </div>

              {/* Details */}
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minWidth: '280px',
                padding: '4px 0'
              }}>
                <div>
                  <h3 style={{ fontFamily: 'Outfit', fontSize: '1.2rem', marginBottom: '8px', color: 'white' }}>
                    {video.title}
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Channel: **{video.isYouTubeVideo ? video.youtubeChannelTitle : (video.channel?.name || 'Personal')}**
                  </p>
                  <p style={{ 
                    fontSize: '0.85rem', 
                    color: 'var(--text-muted)', 
                    display: '-webkit-box', 
                    WebkitLineClamp: 2, 
                    WebkitBoxOrient: 'vertical', 
                    overflow: 'hidden',
                    lineHeight: '1.4'
                  }}>
                    {video.description || 'No description available for offline view.'}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '12px' }}>
                  <span>Downloaded: {video.downloadedAt ? video.downloadedAt.split('T')[0] : 'Just now'}</span>
                  <span>•</span>
                  <span>Disk space: {video.fileSize || 'Unknown'}</span>
                </div>
              </div>

              {/* Delete trigger */}
              <button
                onClick={(e) => handleDelete(e, video._id)}
                className="btn btn-secondary"
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  padding: '8px',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  borderColor: 'rgba(230, 81, 0, 0.2)'
                }}
                title="Remove Download"
              >
                <Trash2 size={16} style={{ color: 'var(--accent)' }} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DownloadsPage;
