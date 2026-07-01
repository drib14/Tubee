import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Tv, Eye, Coffee, Edit, Trash2, Camera, Compass, Calendar, Globe, Twitter, Instagram, Github } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { channelAPI, videoAPI } from '../lib/api';
import CustomModal from '../components/CustomModal';

const ChannelPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isOfflineMode, isAuthenticated, updateChannelInfo } = useAuth();
  
  const [channel, setChannel] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [activeTab, setActiveTab] = useState('videos');
  const [associatedChannels, setAssociatedChannels] = useState([]);

  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editBanner, setEditBanner] = useState('');
  const [editTwitter, setEditTwitter] = useState('');
  const [editInstagram, setEditInstagram] = useState('');
  const [editGithub, setEditGithub] = useState('');
  const [editWebsite, setEditWebsite] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // Custom Modal States
  const [modal, setModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const showConfirm = (title, message, onConfirm) => {
    setModal({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  useEffect(() => {
    const fetchChannelData = async () => {
      setLoading(true);
      try {
        if (isOfflineMode) {
          alert('Channel page is not available offline.');
          navigate('/downloads');
          return;
        }

        // Fetch associated channels from trending creators list
        try {
          const trendRes = await channelAPI.getTrending();
          setAssociatedChannels(trendRes.data.filter(c => c._id !== id).slice(0, 8));
        } catch (e) {
          console.warn('Failed to load associated channels:', e.message);
        }

        const isMongoId = id.match(/^[0-9a-fA-F]{24}$/);

        if (!isMongoId) {
          // YouTube channel details mock
          const nameQuery = id.replace(/-/g, ' ');
          const ytChannelObj = {
            _id: id,
            name: nameQuery.charAt(0).toUpperCase() + nameQuery.slice(1),
            handle: id.toLowerCase(),
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&q=80',
            banner: 'gradient',
            description: 'Official YouTube Content Creator profile syndicated on Tubee.',
            subscribersCount: '2.4M',
            isYouTubeChannel: true,
            createdAt: new Date(2021, 5, 12).toISOString(),
            socials: {
              twitter: `https://twitter.com/${id}`,
              instagram: `https://instagram.com/${id}`,
              github: `https://github.com/${id}`,
              website: `https://${id}.com`
            }
          };
          setChannel(ytChannelObj);

          // Fetch YouTube channel video list using search scraper
          const feedRes = await videoAPI.search(nameQuery);
          setVideos(feedRes.data.filter(v => v.isYouTubeVideo).slice(0, 12));
          setLoading(false);
          return;
        }

        // Local channel details
        const channelRes = await channelAPI.get(id);
        const chData = channelRes.data;
        setChannel(chData);

        setEditName(chData.name);
        setEditDesc(chData.description || '');
        setEditAvatar(chData.avatar || '');
        setEditBanner(chData.banner || 'gradient');
        setEditTwitter(chData.socials?.twitter || '');
        setEditInstagram(chData.socials?.instagram || '');
        setEditGithub(chData.socials?.github || '');
        setEditWebsite(chData.socials?.website || '');

        // Check subscription status
        const storedSubs = JSON.parse(localStorage.getItem('subscribedChannels') || '[]');
        setIsSubscribed(storedSubs.some(s => s._id === chData._id));

        // Fetch local uploads
        const feedRes = await videoAPI.getFeed();
        const channelVids = feedRes.data.filter(
          vid => !vid.isYouTubeVideo && vid.channel?._id === chData._id
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

  const handleSubscribeToggle = async () => {
    if (!isAuthenticated) {
      alert('Please sign in to subscribe');
      return;
    }
    try {
      const res = await channelAPI.subscribe(channel._id);
      
      const storedSubs = JSON.parse(localStorage.getItem('subscribedChannels') || '[]');
      let updatedSubs = [];
      
      if (isSubscribed) {
        updatedSubs = storedSubs.filter(s => s._id !== channel._id);
        setIsSubscribed(false);
      } else {
        updatedSubs = [...storedSubs, { _id: channel._id, name: channel.name, avatar: channel.avatar }];
        setIsSubscribed(true);
      }
      
      localStorage.setItem('subscribedChannels', JSON.stringify(updatedSubs));
      window.dispatchEvent(new Event('subscribe-change')); 

      setChannel({
        ...channel,
        subscribersCount: res.data.subscribersCount
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateDetails = async (e) => {
    e.preventDefault();
    try {
      setEditLoading(true);
      
      const payload = {
        name: editName,
        description: editDesc,
        avatar: editAvatar,
        banner: editBanner,
        socials: {
          twitter: editTwitter,
          instagram: editInstagram,
          github: editGithub,
          website: editWebsite
        }
      };

      const response = await channelAPI.update(payload);
      setChannel(response.data);
      
      updateChannelInfo(response.data);
      setIsEditing(false);
      
      const storedSubs = JSON.parse(localStorage.getItem('subscribedChannels') || '[]');
      const updatedSubs = storedSubs.map(s => s._id === response.data._id ? { ...s, name: response.data.name, avatar: response.data.avatar } : s);
      localStorage.setItem('subscribedChannels', JSON.stringify(updatedSubs));
      window.dispatchEvent(new Event('subscribe-change'));
      
      alert('Channel updated successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to update channel details.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteAvatar = () => {
    showConfirm(
      'Delete Profile Photo?',
      'Are you sure you want to delete your profile photo? This will revert it back to the default playbutton user symbol.',
      async () => {
        try {
          const res = await channelAPI.update({ avatar: 'delete' });
          setChannel(res.data);
          setEditAvatar(res.data.avatar);
          updateChannelInfo(res.data);
          
          const storedSubs = JSON.parse(localStorage.getItem('subscribedChannels') || '[]');
          const updatedSubs = storedSubs.map(s => s._id === res.data._id ? { ...s, avatar: res.data.avatar } : s);
          localStorage.setItem('subscribedChannels', JSON.stringify(updatedSubs));
          window.dispatchEvent(new Event('subscribe-change'));
        } catch (err) {
          console.error(err);
        }
      }
    );
  };

  const handleAvatarFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setEditAvatar(reader.result);
    reader.readAsDataURL(file);
  };

  const handleBannerFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setEditBanner(reader.result);
    reader.readAsDataURL(file);
  };

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

  if (loading || !channel) {
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

  // View Accumulator views
  const totalViews = videos.reduce((sum, v) => sum + (v.views || 0), 0);

  // Group videos into Playlist maps by Category
  const categoriesMap = {};
  videos.forEach(v => {
    const cat = v.category || 'General';
    if (!categoriesMap[cat]) {
      categoriesMap[cat] = [];
    }
    categoriesMap[cat].push(v);
  });

  const isOwner = user && user.channel && (user.channel._id === channel._id || user.channel === channel._id);
  const defaultPlayButtonAvatar = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="%234E342E"/><circle cx="50" cy="50" r="24" fill="%23FFFFFF"/><polygon points="43,40 62,50 43,60" fill="%234E342E"/></svg>`;
  const hasCustomBanner = channel.banner && channel.banner !== 'gradient';

  return (
    <div style={{ paddingBottom: '60px' }}>
      {/* Fallback Banner Gradient (Custom styled gradient brown background instead of Unsplash) */}
      <div style={{
        width: '100%',
        height: '180px',
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid var(--border-color)',
        marginBottom: '24px',
        position: 'relative',
        background: hasCustomBanner ? 'none' : 'linear-gradient(135deg, var(--coffee-900) 0%, var(--coffee-800) 100%)'
      }}>
        {hasCustomBanner && (
          <img 
            src={channel.banner} 
            alt="Banner" 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}
        
        {isEditing && (
          <label 
            htmlFor="banner-file" 
            style={{
              position: 'absolute',
              bottom: '12px',
              right: '12px',
              backgroundColor: 'rgba(0,0,0,0.6)',
              borderRadius: '20px',
              padding: '6px 12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.75rem',
              color: 'white',
              border: '1px solid var(--border-color)'
            }}
          >
            <Camera size={12} />
            Change Banner
            <input type="file" id="banner-file" accept="image/*" onChange={handleBannerFile} style={{ display: 'none' }} />
          </label>
        )}
      </div>

      {/* Header Details */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        flexWrap: 'wrap', 
        gap: '24px',
        paddingBottom: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative' }}>
            <img 
              src={channel.avatar || defaultPlayButtonAvatar} 
              alt={channel.name} 
              style={{ 
                width: '80px', 
                height: '80px', 
                borderRadius: '50%', 
                objectFit: 'cover',
                border: '3px solid var(--coffee-700)',
                backgroundColor: 'var(--bg-input)'
              }}
            />
            {isEditing && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', position: 'absolute', top: 0, right: '-40px' }}>
                <label 
                  htmlFor="avatar-file" 
                  style={{
                    backgroundColor: 'var(--coffee-700)',
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'white',
                    border: '1px solid var(--border-color)'
                  }}
                  title="Upload New Photo"
                >
                  <Camera size={14} />
                  <input type="file" id="avatar-file" accept="image/*" onChange={handleAvatarFile} style={{ display: 'none' }} />
                </label>
                
                {channel.avatar && channel.avatar !== defaultPlayButtonAvatar && (
                  <button 
                    onClick={handleDeleteAvatar}
                    style={{
                      backgroundColor: 'var(--accent)',
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      color: 'white',
                      border: 'none'
                    }}
                    title="Remove Photo"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            )}
          </div>
          
          <div>
            <h1 style={{ fontFamily: 'Outfit', fontSize: '1.8rem', color: 'white' }}>{channel.name}</h1>
            <p style={{ fontSize: '0.9rem', color: 'var(--coffee-200)', margin: '2px 0' }}>@{channel.handle}</p>
            <div style={{ display: 'flex', gap: '12px', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
              <span>{channel.subscribersCount || 0} subscribers</span>
              <span>•</span>
              <span>{videos.length} uploads</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div>
          {isOwner ? (
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Edit size={14} />
              <span>{isEditing ? 'Cancel Edit' : 'Edit Channel'}</span>
            </button>
          ) : (
            !channel.isYouTubeChannel && (
              <button 
                onClick={handleSubscribeToggle} 
                className={`btn ${isSubscribed ? 'btn-secondary' : 'btn-primary'}`}
              >
                {isSubscribed ? 'Subscribed' : 'Subscribe'}
              </button>
            )
          )}
        </div>
      </div>

      {/* Editing Form Panel */}
      {isEditing && (
        <form onSubmit={handleUpdateDetails} style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '32px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          maxWidth: '600px'
        }}>
          <h3 style={{ fontFamily: 'Outfit', fontSize: '1.1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
            Update Channel Profile Settings
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Channel Name</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px', color: 'white', outline: 'none' }}
              required
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Description (Bio)</label>
            <textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              rows={3}
              style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px', color: 'white', outline: 'none', resize: 'none', fontFamily: 'inherit' }}
            />
          </div>

          {/* Socials Update inputs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>Social Media Links</span>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', flexWrap: 'wrap' }}>
              <input 
                type="text" 
                placeholder="Twitter Link" 
                value={editTwitter} 
                onChange={(e) => setEditTwitter(e.target.value)}
                style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px 12px', color: 'white', outline: 'none', fontSize: '0.8rem' }}
              />
              <input 
                type="text" 
                placeholder="Instagram Link" 
                value={editInstagram} 
                onChange={(e) => setEditInstagram(e.target.value)}
                style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px 12px', color: 'white', outline: 'none', fontSize: '0.8rem' }}
              />
              <input 
                type="text" 
                placeholder="GitHub Link" 
                value={editGithub} 
                onChange={(e) => setEditGithub(e.target.value)}
                style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px 12px', color: 'white', outline: 'none', fontSize: '0.8rem' }}
              />
              <input 
                type="text" 
                placeholder="Website URL" 
                value={editWebsite} 
                onChange={(e) => setEditWebsite(e.target.value)}
                style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '8px 12px', color: 'white', outline: 'none', fontSize: '0.8rem' }}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={editLoading} 
            className="btn btn-primary"
            style={{ alignSelf: 'flex-start', padding: '10px 24px', borderRadius: '8px' }}
          >
            {editLoading ? 'Saving...' : 'Save Settings'}
          </button>
        </form>
      )}

      {/* Tabs Menu Selection */}
      <div style={{ 
        display: 'flex', 
        borderBottom: '1px solid var(--border-color)', 
        marginBottom: '24px', 
        gap: '24px',
        overflowX: 'auto',
        scrollbarWidth: 'none'
      }}>
        {['videos', 'playlists', 'channels', 'info'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: 'none',
              border: 'none',
              padding: '12px 4px',
              cursor: 'pointer',
              color: activeTab === tab ? 'white' : 'var(--text-muted)',
              borderBottom: activeTab === tab ? '3px solid var(--coffee-200)' : '3px solid transparent',
              fontFamily: 'Outfit',
              fontWeight: activeTab === tab ? 'bold' : 'normal',
              textTransform: 'capitalize',
              fontSize: '0.95rem',
              transition: 'var(--transition)'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tabs Views Rendering */}
      <div>
        {/* VIDEOS TAB */}
        {activeTab === 'videos' && (
          <div>
            {videos.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: '12px' }}>No uploads available.</p>
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
                          <span>{video.createdAt ? (typeof video.createdAt === 'string' ? video.createdAt.split('T')[0] : 'Recently') : 'Recently'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PLAYLISTS TAB */}
        {activeTab === 'playlists' && (
          <div>
            {Object.keys(categoriesMap).length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: '12px' }}>No playlists available.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {Object.keys(categoriesMap).map(catName => {
                  const catVids = categoriesMap[catName];
                  return (
                    <div key={catName} style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '18px', backgroundColor: 'var(--bg-card)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                        <Compass size={18} style={{ color: 'var(--coffee-200)' }} />
                        <h3 style={{ fontFamily: 'Outfit', fontSize: '1.1rem', fontWeight: 'bold', color: 'white' }}>
                          {catName} Playlist ({catVids.length} videos)
                        </h3>
                      </div>
                      
                      <div style={{ display: 'flex', overflowX: 'auto', gap: '16px', paddingBottom: '8px', scrollbarWidth: 'thin' }}>
                        {catVids.map(video => (
                          <div 
                            key={video._id} 
                            onClick={() => navigate(`/watch/${video._id}`)}
                            style={{ minWidth: '200px', maxWidth: '200px', cursor: 'pointer' }}
                          >
                            <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: '6px', overflow: 'hidden', backgroundColor: 'black' }}>
                              <img src={video.thumbnailUrl} alt={video.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              <span className="video-card-duration" style={{ fontSize: '0.65rem', padding: '1px 4px' }}>
                                {formatDuration(video.duration)}
                              </span>
                            </div>
                            <h4 style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'white', marginTop: '6px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.3' }}>
                              {video.title}
                            </h4>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* CHANNELS TAB */}
        {activeTab === 'channels' && (
          <div>
            {associatedChannels.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: '12px' }}>No associated channels.</p>
            ) : (
              <div className="video-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
                {associatedChannels.map(ch => (
                  <div
                    key={ch._id}
                    onClick={() => navigate(`/channel/${ch._id}`)}
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '12px',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      transition: 'var(--transition)'
                    }}
                    className="queue-card-hover"
                  >
                    <img 
                      src={ch.avatar || defaultPlayButtonAvatar} 
                      alt={ch.name}
                      style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--coffee-700)' }}
                    />
                    <h4 style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '120px' }}>
                      {ch.name}
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{ch.subscribersCount} subs</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* INFO TAB */}
        {activeTab === 'info' && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '2fr 1fr', 
            gap: '32px',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '24px',
            flexWrap: 'wrap'
          }}>
            {/* Description and Bio details */}
            <div>
              <h3 style={{ fontFamily: 'Outfit', fontSize: '1.1rem', color: 'white', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>Description</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.5', whiteSpace: 'pre-line' }}>
                {channel.description || 'This channel has not customized their description bio yet.'}
              </p>
              
              {/* Social links row */}
              <div style={{ marginTop: '24px' }}>
                <h3 style={{ fontFamily: 'Outfit', fontSize: '1.1rem', color: 'white', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>Links</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {channel.socials?.website && (
                    <a href={channel.socials.website} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--coffee-200)', fontSize: '0.85rem' }} className="social-link-hover">
                      <Globe size={14} />
                      <span>Website ({channel.socials.website})</span>
                    </a>
                  )}
                  {channel.socials?.twitter && (
                    <a href={channel.socials.twitter} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--coffee-200)', fontSize: '0.85rem' }} className="social-link-hover">
                      <Twitter size={14} />
                      <span>Twitter ({channel.socials.twitter.split('/').pop()})</span>
                    </a>
                  )}
                  {channel.socials?.instagram && (
                    <a href={channel.socials.instagram} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--coffee-200)', fontSize: '0.85rem' }} className="social-link-hover">
                      <Instagram size={14} />
                      <span>Instagram ({channel.socials.instagram.split('/').pop()})</span>
                    </a>
                  )}
                  {channel.socials?.github && (
                    <a href={channel.socials.github} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--coffee-200)', fontSize: '0.85rem' }} className="social-link-hover">
                      <Github size={14} />
                      <span>GitHub ({channel.socials.github.split('/').pop()})</span>
                    </a>
                  )}
                  {(!channel.socials?.website && !channel.socials?.twitter && !channel.socials?.instagram && !channel.socials?.github) && (
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No social links registered.</span>
                  )}
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '24px' }}>
              <h3 style={{ fontFamily: 'Outfit', fontSize: '1.1rem', color: 'white', marginBottom: '16px' }}>Stats</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                  <Calendar size={16} />
                  <span>Joined: {channel.createdAt ? channel.createdAt.split('T')[0] : 'Recently'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
                  <Eye size={16} />
                  <span>{totalViews.toLocaleString()} total views</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Custom Windowed Confirmation Dialog */}
      <CustomModal
        isOpen={modal.isOpen}
        title={modal.title}
        message={modal.message}
        onConfirm={modal.onConfirm}
        onCancel={() => setModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default ChannelPage;
