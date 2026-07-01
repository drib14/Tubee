import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tv, Mail, Compass, Eye, Coffee } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { channelAPI, videoAPI } from '../lib/api';

const ChannelPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isOfflineMode, isAuthenticated } = useAuth();
  
  const [channel, setChannel] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    const fetchChannelData = async () => {
      setLoading(true);
      try {
        if (isOfflineMode) {
          alert('Channel page is not available offline.');
          navigate('/downloads');
          return;
        }

        const channelRes = await channelAPI.get(id);
        setChannel(channelRes.data);

        // Check if user is subscribed
        if (user && channelRes.data.subscribers) {
          setIsSubscribed(channelRes.data.subscribers.includes(user.id));
        }

        // Fetch channel videos by searching for channel ID
        const feedRes = await videoAPI.getFeed();
        const channelVids = feedRes.data.filter(
          vid => !vid.isYouTubeVideo && vid.channel?._id === channelRes.data._id
        );
        setVideos(channelVids);

      } catch (err) {
        console.error('Failed to load channel details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchChannelData();
  }, [id, isOfflineMode, user]);

  const handleSubscribe = async () => {
    if (!isAuthenticated) {
      alert('Please sign in to subscribe');
      return;
    }
    try {
      setIsSubscribed(!isSubscribed);
      const res = await channelAPI.subscribe(channel._id);
      setChannel({
        ...channel,
        subscribersCount: res.data.subscribersCount
      });
    } catch (err) {
      console.error(err);
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

  if (!channel) {
    return <div style={{ padding: '24px', textAlign: 'center' }}>Channel not found.</div>;
  }

  const isOwner = user && user.id === channel.owner?._id;

  return (
    <div style={{ paddingBottom: '60px' }}>
      {/* Banner */}
      <div style={{
        width: '100%',
        height: '180px',
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid var(--border-color)',
        marginBottom: '24px',
        position: 'relative'
      }}>
        <img 
          src={channel.banner || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&q=80'} 
          alt="Banner" 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>

      {/* Profile Details Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        flexWrap: 'wrap', 
        gap: '24px',
        borderBottom: '1px solid var(--border-color)',
        paddingBottom: '24px',
        marginBottom: '32px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <img 
            src={channel.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&q=80'} 
            alt={channel.name} 
            style={{ 
              width: '80px', 
              height: '80px', 
              borderRadius: '50%', 
              objectFit: 'cover',
              border: '3px solid var(--coffee-700)'
            }}
          />
          <div>
            <h1 style={{ fontFamily: 'Outfit', fontSize: '1.8rem', color: 'white' }}>{channel.name}</h1>
            <p style={{ fontSize: '0.9rem', color: 'var(--coffee-200)', margin: '2px 0' }}>@{channel.handle}</p>
            <div style={{ display: 'flex', gap: '12px', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
              <span>{channel.subscribersCount || 0} subscribers</span>
              <span>•</span>
              <span>{videos.length} uploads</span>
            </div>
            {channel.description && (
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '8px', maxWidth: '500px' }}>
                {channel.description}
              </p>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div>
          {isOwner ? (
            <span style={{ fontSize: '0.85rem', color: 'var(--coffee-300)', border: '1px dashed var(--coffee-700)', padding: '6px 12px', borderRadius: '4px', fontWeight: 'bold' }}>
              Studio Owner View
            </span>
          ) : (
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={handleSubscribe} 
                className={`btn ${isSubscribed ? 'btn-secondary' : 'btn-primary'}`}
              >
                {isSubscribed ? 'Subscribed' : 'Subscribe'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Videos Section */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <Tv size={20} style={{ color: 'var(--coffee-200)' }} />
          <h2 style={{ fontSize: '1.3rem' }}>Uploaded Videos</h2>
        </div>

        {videos.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No videos uploaded to this channel yet.</p>
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
                    src={video.thumbnailUrl} 
                    alt={video.title} 
                    className="video-card-thumbnail"
                  />
                  <span className="video-card-duration">
                    {formatDuration(video.duration)}
                  </span>
                </div>
                <div className="video-card-details">
                  <div className="video-card-info">
                    <h3 className="video-card-title">{video.title}</h3>
                    <div className="video-card-metadata">
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <Eye size={12} /> {video.views} views
                      </span>
                      <span style={{ margin: '0 6px' }}>•</span>
                      <span>{video.createdAt ? video.createdAt.split('T')[0] : 'Recently'}</span>
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
    </div>
  );
};

export default ChannelPage;
