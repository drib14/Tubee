import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Globe, Github, Twitter, Instagram, Tv } from 'lucide-react';
import { channelAPI } from '../lib/api';

const ChannelPage = () => {
  const { idOrHandle } = useParams();
  const navigate = useNavigate();

  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Videos');
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    const fetchChannel = async () => {
      setLoading(true);
      try {
        const res = await channelAPI.get(idOrHandle);
        setChannel(res.data);

        // Load subscribe status
        const subs = JSON.parse(localStorage.getItem('subscribedChannels') || '[]');
        setIsSubscribed(subs.some(item => item._id === `yt-channel-${res.data.handle}`));
      } catch (err) {
        console.error('Channel detail load failed:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchChannel();
  }, [idOrHandle]);

  const handleSubscribeToggle = () => {
    const subs = JSON.parse(localStorage.getItem('subscribedChannels') || '[]');
    const chId = `yt-channel-${channel.handle}`;

    let updated;
    if (isSubscribed) {
      updated = subs.filter(item => item._id !== chId);
      setIsSubscribed(false);
    } else {
      updated = [...subs, {
        _id: chId,
        name: channel.name,
        avatar: channel.avatar
      }];
      setIsSubscribed(true);
    }
    localStorage.setItem('subscribedChannels', JSON.stringify(updated));
    window.dispatchEvent(new Event('subscribe-change'));
  };

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
        <div className="skeleton" style={{ width: '100%', height: '180px', borderRadius: '12px' }} />
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div className="skeleton" style={{ width: '80px', height: '80px', borderRadius: '50%' }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div className="skeleton" style={{ height: '20px', width: '30%', borderRadius: '4px' }} />
            <div className="skeleton" style={{ height: '10px', width: '20%', borderRadius: '4px' }} />
          </div>
        </div>
      </div>
    );
  }

  if (!channel) {
    return <div style={{ color: 'var(--text-muted)' }}>Channel details unavailable.</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Fallback Custom Gradient Brown Banner */}
      <div style={{
        width: '100%',
        height: '180px',
        background: 'linear-gradient(135deg, #3E2723 0%, #1A0F0D 100%)',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <span style={{ 
          fontFamily: "'Outfit', sans-serif", 
          fontSize: '2rem', 
          fontWeight: '800', 
          color: 'rgba(230, 197, 148, 0.15)',
          letterSpacing: '2px',
          textTransform: 'uppercase'
        }}>
          {channel.name}
        </span>
      </div>

      {/* Profile Header Details */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px',
        paddingBottom: '16px',
        borderBottom: '1px solid var(--border-color)'
      }}>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <img 
            src={channel.avatar} 
            alt={channel.name} 
            style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--border-color)' }} 
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'white', fontFamily: 'Outfit' }}>{channel.name}</h1>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              @{channel.handle} • {channel.subscribersCount} subscribers • {channel.videos.length} uploads
            </span>
          </div>
        </div>

        <button 
          onClick={handleSubscribeToggle}
          className={`btn ${isSubscribed ? 'btn-secondary' : 'btn-primary'}`}
          style={{ padding: '8px 24px', borderRadius: '20px' }}
        >
          {isSubscribed ? 'Subscribed' : 'Subscribe'}
        </button>
      </div>

      {/* Tab Navigation Menu */}
      <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid var(--border-color)' }}>
        {['Videos', 'Shorts', 'Playlists', 'Channels', 'Info'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: 'none',
              border: 'none',
              padding: '12px 6px',
              color: activeTab === tab ? 'var(--coffee-200)' : 'var(--text-muted)',
              borderBottom: activeTab === tab ? '3px solid var(--coffee-200)' : '3px solid transparent',
              cursor: 'pointer',
              fontWeight: activeTab === tab ? 'bold' : '500',
              fontFamily: 'Outfit',
              fontSize: '0.9rem',
              transition: 'var(--transition)'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content Panels */}
      <div style={{ marginTop: '10px' }}>
        
        {/* TAB 1: VIDEOS */}
        {activeTab === 'Videos' && (
          <div className="video-grid">
            {channel.videos.filter(v => !v.duration || v.duration > 65).map(v => (
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
                      {Number(v.views).toLocaleString()} views • {v.createdAt}
                    </span>
                  </div>
                </div>
              </article>
            ))}
            {channel.videos.filter(v => !v.duration || v.duration > 65).length === 0 && (
              <p style={{ gridColumn: 'span 3', color: 'var(--text-muted)', textAlign: 'center', padding: '30px 0' }}>
                No video uploads found.
              </p>
            )}
          </div>
        )}

        {/* TAB 1B: SHORTS */}
        {activeTab === 'Shorts' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '16px' }}>
            {channel.videos.filter(v => v.duration && v.duration <= 65).map(v => (
              <article 
                key={v._id} 
                className="video-card" 
                style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
                onClick={() => navigate(`/shorts`)}
              >
                <div style={{ position: 'relative', aspectRatio: '9/16', backgroundColor: 'black', borderRadius: '8px', overflow: 'hidden' }}>
                  <img src={v.thumbnailUrl} alt={v.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <span className="video-card-duration">{formatDuration(v.duration)}</span>
                </div>
                <div style={{ padding: '8px 4px' }}>
                  <h3 className="video-card-title" style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>{v.title}</h3>
                  <span className="video-card-metadata" style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                    {Number(v.views).toLocaleString()} views
                  </span>
                </div>
              </article>
            ))}
            {channel.videos.filter(v => v.duration && v.duration <= 65).length === 0 && (
              <p style={{ gridColumn: 'span 5', color: 'var(--text-muted)', textAlign: 'center', padding: '30px 0' }}>
                No shorts uploads found.
              </p>
            )}
          </div>
        )}

        {/* TAB 2: PLAYLISTS */}
        {activeTab === 'Playlists' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
            <div style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              cursor: 'pointer'
            }} onClick={() => setActiveTab('Videos')}>
              <div style={{ width: '100%', aspectRatio: '16/9', backgroundColor: 'var(--bg-primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-color)' }}>
                <Tv size={36} style={{ color: 'var(--coffee-200)' }} />
              </div>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'white', marginTop: '6px' }}>Uploads</h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{channel.videos.length} videos • Updated today</span>
            </div>
          </div>
        )}

        {/* TAB 3: CHANNELS */}
        {activeTab === 'Channels' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px', textAlign: 'center' }}>
            <div style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '20px 16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px'
            }}>
              <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&q=80" alt="Cafe Beats" style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover' }} />
              <h4 style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'white' }}>Cafe Beats</h4>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>1.2M subscribers</span>
            </div>
          </div>
        )}

        {/* TAB 4: INFO */}
        {activeTab === 'Info' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr',
            gap: '30px',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '24px'
          }} className="info-responsive">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', fontFamily: 'Outfit' }}>Description</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                {channel.description}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderLeft: '1px solid var(--border-color)', paddingLeft: '24px' }} className="stats-border-responsive">
              <div>
                <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold', letterSpacing: '0.5px' }}>Stats</h4>
                <p style={{ fontSize: '0.85rem', color: 'white', marginTop: '6px' }}>Joined YouTube</p>
                <p style={{ fontSize: '0.85rem', color: 'white', marginTop: '4px' }}>4,590,320 total views</p>
              </div>

              {channel.socials && (
                <div>
                  <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold', letterSpacing: '0.5px', marginBottom: '8px' }}>Links</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {channel.socials.website && (
                      <a href={channel.socials.website} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--coffee-200)', textDecoration: 'none' }} className="social-link-hover">
                        <Globe size={14} />
                        <span>Website</span>
                      </a>
                    )}
                    {channel.socials.github && (
                      <a href={channel.socials.github} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--coffee-200)', textDecoration: 'none' }} className="social-link-hover">
                        <Github size={14} />
                        <span>GitHub</span>
                      </a>
                    )}
                    {channel.socials.twitter && (
                      <a href={channel.socials.twitter} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--coffee-200)', textDecoration: 'none' }} className="social-link-hover">
                        <Twitter size={14} />
                        <span>Twitter</span>
                      </a>
                    )}
                    {channel.socials.instagram && (
                      <a href={channel.socials.instagram} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--coffee-200)', textDecoration: 'none' }} className="social-link-hover">
                        <Instagram size={14} />
                        <span>Instagram</span>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

    </div>
  );
};

export default ChannelPage;
