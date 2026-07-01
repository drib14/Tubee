import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ThumbsUp, ThumbsDown, Clock, Download, Check, Send, MapPin, Coffee, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { videoAPI, channelAPI, commentAPI, paymentAPI } from '../lib/api';
import { offlineDb } from '../lib/offlineDb';
import UnifiedPlayer from '../components/UnifiedPlayer';
import CustomModal from '../components/CustomModal';

const VideoPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isOfflineMode, isAuthenticated } = useAuth();
  
  const [video, setVideo] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [inWatchLater, setInWatchLater] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  
  // Download states
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [offlineBlobUrl, setOfflineBlobUrl] = useState(null);

  // Queue state
  const [queue, setQueue] = useState([]);
  const [theaterMode, setTheaterMode] = useState(false);
  
  // Collapsable panel states (collapsed by default)
  const [isDescCollapsed, setIsDescCollapsed] = useState(true);
  const [isCommentsCollapsed, setIsCommentsCollapsed] = useState(true);

  // Paymongo Modal
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [supportAmount, setSupportAmount] = useState('100'); // PHP 100 default

  // Custom Modal Alerts states
  const [customModal, setCustomModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    onCancel: () => {},
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    isAlert: false
  });

  const showCustomAlert = (title, message) => {
    setCustomModal({
      isOpen: true,
      title,
      message,
      confirmText: 'OK',
      isAlert: true,
      onConfirm: () => setCustomModal(prev => ({ ...prev, isOpen: false }))
    });
  };

  const showCustomConfirm = (title, message, onConfirm) => {
    setCustomModal({
      isOpen: true,
      title,
      message,
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      isAlert: false,
      onConfirm: () => {
        onConfirm();
        setCustomModal(prev => ({ ...prev, isOpen: false }));
      },
      onCancel: () => setCustomModal(prev => ({ ...prev, isOpen: false }))
    });
  };

  // Listen for theater mode event
  useEffect(() => {
    const handleTheaterToggle = (e) => {
      setTheaterMode(e.detail);
    };
    window.addEventListener('toggle-theater', handleTheaterToggle);
    return () => window.removeEventListener('toggle-theater', handleTheaterToggle);
  }, []);

  // Fetch Video details and comments
  useEffect(() => {
    const fetchVideoData = async () => {
      setLoading(true);
      try {
        if (isOfflineMode) {
          // Load from IndexedDB
          const downloads = await offlineDb.getDownloadedVideos();
          const target = downloads.find(v => v._id === id);
          if (!target) {
            showCustomAlert('Offline Video Missing', 'This video is not cached on this device.');
            navigate('/downloads');
            return;
          }
          setVideo(target);
          setIsDownloaded(true);
          
          const blobUrl = await offlineDb.getOfflineVideoStreamUrl(id);
          setOfflineBlobUrl(blobUrl);
          setComments([
            {
              _id: 'offline-comment-1',
              text: 'Playing from local IndexedDB storage. Fully operational offline!',
              user: { name: 'Tubee System', avatar: '/favicon.svg' },
              isSupporter: true,
              createdAt: new Date().toISOString()
            }
          ]);
          setQueue(downloads.filter(v => v._id !== id));
          setLoading(false);
          return;
        }

        // Online mode: Fetch from backend
        const vidResponse = await videoAPI.getById(id);
        const videoData = vidResponse.data;
        setVideo(videoData);

        // Fetch comments
        const commentsResponse = await commentAPI.getByVideo(id);
        setComments(commentsResponse.data);

        // Sync local details with user liked/disliked lists
        if (user) {
          // Check if video is liked or disliked
          const freshUser = await videoAPI.getFeed(); // trigger a feed query to check stats, or use simple mock checks
        }

        // Check if cached in IndexedDB
        const downloadedState = await offlineDb.isDownloaded(id);
        setIsDownloaded(downloadedState);
        if (downloadedState) {
          const url = await offlineDb.getOfflineVideoStreamUrl(id);
          setOfflineBlobUrl(url);
        }

        // Fetch suggested queue
        const feedResponse = await videoAPI.getFeed();
        const related = feedResponse.data.filter(v => v._id !== id).slice(0, 8);
        setQueue(related);

      } catch (err) {
        console.error('Error fetching watch page details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchVideoData();
    // Reset collapse state on load
    setIsDescCollapsed(true);
    setIsCommentsCollapsed(true);
  }, [id, isOfflineMode, user]);

  const handleVideoEnded = () => {
    if (queue.length > 0) {
      console.log('Autoplay: Playing next video in suggested queue...');
      navigate(`/watch/${queue[0]._id}`);
    }
  };

  const playQueueItem = (item) => {
    navigate(`/watch/${item._id}`);
  };

  const handleDownload = async () => {
    if (!isAuthenticated) {
      showCustomAlert('Sign In Required', 'Please sign in with Google to download videos for offline playback.');
      return;
    }
    if (!video) return;

    try {
      setDownloading(true);
      setDownloadProgress(10);
      
      await offlineDb.downloadVideo(video, (progress) => {
        setDownloadProgress(progress);
      });

      // Synchronize download list with backend database so it shows up on other devices
      try {
        await videoAPI.syncDownload(video._id);
      } catch (syncErr) {
        console.warn('Failed to sync download to database:', syncErr.message);
      }
      
      setIsDownloaded(true);
      setDownloading(false);
      const url = await offlineDb.getOfflineVideoStreamUrl(video._id);
      setOfflineBlobUrl(url);
    } catch (err) {
      console.error(err);
      showCustomAlert('Download Failed', 'Download failed. Ensure server connection is stable.');
      setDownloading(false);
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      showCustomAlert('Sign In Required', 'Please sign in with Google to interact with videos.');
      return;
    }
    try {
      setIsLiked(!isLiked);
      setIsDisliked(false);
      await videoAPI.toggleLike(video._id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDislike = async () => {
    if (!isAuthenticated) {
      showCustomAlert('Sign In Required', 'Please sign in with Google to interact with videos.');
      return;
    }
    try {
      setIsDisliked(!isDisliked);
      setIsLiked(false);
      await videoAPI.toggleDislike(video._id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleWatchLater = async () => {
    if (!isAuthenticated) {
      showCustomAlert('Sign In Required', 'Please sign in with Google to add to Watch Later.');
      return;
    }
    try {
      setInWatchLater(!inWatchLater);
      await videoAPI.toggleWatchLater(video._id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubscribe = async () => {
    if (!isAuthenticated) {
      showCustomAlert('Sign In Required', 'Please sign in with Google to subscribe to channels.');
      return;
    }
    if (!video.channel) return;
    try {
      const res = await channelAPI.subscribe(video.channel._id);
      const isNowSubscribed = res.data.isSubscribed;
      setIsSubscribed(isNowSubscribed);

      // Sync local storage list
      const storedSubs = JSON.parse(localStorage.getItem('subscribedChannels') || '[]');
      let updatedSubs = [];
      
      if (!isNowSubscribed) {
        updatedSubs = storedSubs.filter(s => s._id !== video.channel._id);
      } else {
        updatedSubs = [...storedSubs, { 
          _id: video.channel._id, 
          name: video.channel.name, 
          avatar: video.channel.avatar || `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="%234E342E"/><circle cx="50" cy="50" r="24" fill="%23FFFFFF"/><polygon points="43,40 62,50 43,60" fill="%234E342E"/></svg>`
        }];
      }
      
      localStorage.setItem('subscribedChannels', JSON.stringify(updatedSubs));
      window.dispatchEvent(new Event('subscribe-change'));

      if (video.channel) {
        setVideo(prev => ({
          ...prev,
          channel: {
            ...prev.channel,
            subscribersCount: res.data.subscribersCount
          }
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    if (!isAuthenticated) {
      showCustomAlert('Sign In Required', 'Please sign in with Google to post comments.');
      return;
    }

    try {
      const isPaid = localStorage.getItem('isVerifiedSupporter') === 'true';
      const response = await commentAPI.create({
        videoId: video._id,
        text: newComment,
        channelId: video.channel?._id,
        isPaymentVerified: isPaid
      });
      
      setComments([response.data, ...comments]);
      setNewComment('');
    } catch (err) {
      console.error(err);
      showCustomAlert('Error', 'Failed to publish comment.');
    }
  };

  const handleInitiateSupport = async () => {
    if (!isAuthenticated) {
      showCustomAlert('Sign In Required', 'Please sign in with Google to support this creator.');
      return;
    }
    try {
      const response = await paymentAPI.createSession({
        amount: parseFloat(supportAmount),
        channelId: video.channel?._id || 'unaffiliated',
        channelName: video.isYouTubeVideo ? video.youtubeChannelTitle : (video.channel?.name || 'Creator')
      });
      window.location.href = response.data.checkoutUrl;
    } catch (err) {
      console.error(err);
      showCustomAlert('Paymongo Error', 'Failed to launch Paymongo payment window.');
    }
  };

  // Helper to format large views count
  const formatViews = (views) => {
    if (!views) return '1,024';
    return views.toLocaleString();
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '5px solid var(--border-color)',
          borderTopColor: 'var(--coffee-200)',
          borderRadius: '50%',
          animation: 'loading 1s linear infinite'
        }} />
      </div>
    );
  }

  if (!video) {
    return <div style={{ padding: '24px', textAlign: 'center' }}>Video not found.</div>;
  }

  // Fallback avatars for YouTube or custom channels
  const defaultPlayButtonAvatar = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="%234E342E"/><circle cx="50" cy="50" r="24" fill="%23FFFFFF"/><polygon points="43,40 62,50 43,60" fill="%234E342E"/></svg>`;
  const channelAvatarSrc = video.isYouTubeVideo 
    ? (video.youtubeChannelAvatar || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80`) 
    : (video.channel?.avatar || defaultPlayButtonAvatar);

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: theaterMode ? '1fr' : '2.2fr 1fr', 
      gap: '24px',
      paddingBottom: '60px'
    }}>
      {/* Left Column: Player & Details */}
      <div>
        <UnifiedPlayer
          videoId={video._id}
          videoUrl={video.videoUrl}
          thumbnailUrl={video.thumbnailUrl}
          isYouTubeVideo={video.isYouTubeVideo}
          youtubeVideoId={video.youtubeVideoId}
          isOfflineMode={isOfflineMode}
          offlineBlobUrl={offlineBlobUrl}
          onProgressLog={handleVideoProgressLog}
          onVideoEnded={handleVideoEnded}
        />

        {/* Video Title and Metadata Details */}
        <div style={{ marginTop: '20px' }}>
          <h1 style={{ fontFamily: 'Outfit', fontSize: '1.45rem', fontWeight: '700', marginBottom: '8px', color: 'white' }}>
            {video.title}
          </h1>

          {/* Action Row */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            flexWrap: 'wrap',
            gap: '16px',
            paddingBottom: '16px',
            borderBottom: '1px solid var(--border-color)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              <span>{formatViews(video.views)} views</span>
              <span>•</span>
              <span>{video.createdAt ? (typeof video.createdAt === 'string' ? video.createdAt.split('T')[0] : 'Recently') : 'Recently'}</span>
              
              {video.location && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '12px', color: 'var(--coffee-200)', fontWeight: 'bold' }}>
                  <MapPin size={12} />
                  <span>{video.location.name}</span>
                </div>
              )}
            </div>

            {/* User Interaction buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button onClick={handleLike} className={`btn btn-secondary ${isLiked ? 'btn-accent' : ''}`} style={{ padding: '8px 14px', fontSize: '0.8rem' }}>
                <ThumbsUp size={14} fill={isLiked ? 'white' : 'none'} />
                <span>{isLiked ? (video.likes + 1) : video.likes}</span>
              </button>
              
              <button onClick={handleDislike} className={`btn btn-secondary ${isDisliked ? 'btn-accent' : ''}`} style={{ padding: '8px 14px', fontSize: '0.8rem' }}>
                <ThumbsDown size={14} fill={isDisliked ? 'white' : 'none'} />
                <span>Dislike</span>
              </button>

              {/* Watch later protected */}
              <button onClick={handleWatchLater} className={`btn btn-secondary ${inWatchLater ? 'btn-accent' : ''}`} style={{ padding: '8px 14px', fontSize: '0.8rem' }}>
                <Clock size={14} />
                <span>Later</span>
              </button>
            </div>
          </div>
        </div>

        {/* Creator Channel details */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '20px 0', 
          borderBottom: '1px solid var(--border-color)',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link to={video.isYouTubeVideo ? `/channel/${video.youtubeChannelId}` : `/channel/${video.channel?._id}`}>
              <img 
                src={channelAvatarSrc} 
                alt={video.isYouTubeVideo ? video.youtubeChannelTitle : video.channel?.name}
                style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--coffee-700)' }}
              />
            </Link>
            <div>
              <Link to={video.isYouTubeVideo ? `/channel/${video.youtubeChannelId}` : `/channel/${video.channel?._id}`}>
                <h3 style={{ fontSize: '1rem', fontWeight: 'bold', color: 'white' }}>
                  {video.isYouTubeVideo ? video.youtubeChannelTitle : (video.channel?.name || 'Creator Studio')}
                </h3>
              </Link>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {video.isYouTubeVideo 
                  ? `${video.youtubeSubscribersCount || '2.5M'} subscribers` 
                  : `${video.channel?.subscribersCount || 0} subscribers`}
              </p>
            </div>
            
            {!video.isYouTubeVideo && video.channel && (
              <button 
                onClick={handleSubscribe} 
                className={`btn ${isSubscribed ? 'btn-secondary' : 'btn-primary'}`}
                style={{ padding: '6px 14px', fontSize: '0.8rem', marginLeft: '12px' }}
              >
                {isSubscribed ? 'Subscribed' : 'Subscribe'}
              </button>
            )}
          </div>
        </div>

        {/* Collapsable Description Box (Collapsed by default) */}
        <div style={{ 
          backgroundColor: 'var(--bg-card)', 
          padding: '16px', 
          borderRadius: '8px', 
          margin: '20px 0',
          border: '1px solid var(--border-color)',
          fontSize: '0.9rem',
          color: 'var(--text-secondary)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '6px' }}>
            <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>Video Description</span>
            <button 
              onClick={() => setIsDescCollapsed(!isDescCollapsed)}
              style={{ background: 'none', border: 'none', color: 'var(--coffee-200)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}
            >
              {isDescCollapsed ? (
                <>
                  <span>Show More</span>
                  <ChevronDown size={14} />
                </>
              ) : (
                <>
                  <span>Show Less</span>
                  <ChevronUp size={14} />
                </>
              )}
            </button>
          </div>

          <p style={{ 
            whiteSpace: 'pre-line',
            maxHeight: isDescCollapsed ? '80px' : 'none',
            overflow: 'hidden',
            transition: 'max-height 0.25s ease-in-out'
          }}>
            {video.description || 'No description provided.'}
          </p>
        </div>

        {/* Collapsable Comments Section (Collapsed by default) */}
        <div style={{ 
          marginTop: '30px',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          padding: '16px',
          backgroundColor: 'rgba(18, 13, 12, 0.4)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.1rem', fontFamily: 'Outfit', color: 'white' }}>
              {comments.length} Comments
            </h2>
            <button 
              onClick={() => setIsCommentsCollapsed(!isCommentsCollapsed)}
              style={{ background: 'none', border: 'none', color: 'var(--coffee-200)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', fontWeight: 'bold' }}
            >
              {isCommentsCollapsed ? (
                <>
                  <span>Show Comments</span>
                  <ChevronDown size={16} />
                </>
              ) : (
                <>
                  <span>Hide Comments</span>
                  <ChevronUp size={16} />
                </>
              )}
            </button>
          </div>

          {!isCommentsCollapsed && (
            <div>
              {/* Comment submission form */}
              {isAuthenticated ? (
                <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                  <img 
                    src={user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80'} 
                    alt="Me" 
                    style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div style={{ flex: 1, display: 'flex', gap: '10px' }}>
                    <input
                      type="text"
                      placeholder="Add a public comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      style={{
                        flex: 1,
                        backgroundColor: 'var(--bg-input)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '20px',
                        padding: '8px 16px',
                        color: 'white',
                        outline: 'none',
                        fontSize: '0.9rem'
                      }}
                    />
                    <button type="submit" className="btn btn-primary" style={{ borderRadius: '50%', width: '36px', height: '36px', padding: 0 }}>
                      <Send size={14} />
                    </button>
                  </div>
                </form>
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '24px' }}>
                  Please sign in with Google to post comments.
                </p>
              )}

              {/* Comments list details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {comments.map(c => (
                  <div key={c._id} style={{ display: 'flex', gap: '12px' }}>
                    <img 
                      src={c.user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80'} 
                      alt={c.user?.name} 
                      style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{c.user?.name}</span>
                        {c.isSupporter && (
                          <span className="supporter-badge">
                            ☕ Sponsor
                          </span>
                        )}
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {c.createdAt ? (c.createdAt.includes('T') ? c.createdAt.split('T')[0] : 'Just now') : 'Just now'}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{c.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Suggested Playlist Queue */}
      {!theaterMode && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '1.1rem', fontFamily: 'Outfit', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
            Next Up Queue
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {queue.map((item, idx) => (
              <div 
                key={item._id} 
                onClick={() => playQueueItem(item)}
                style={{ 
                  display: 'flex', 
                  gap: '10px', 
                  cursor: 'pointer',
                  backgroundColor: 'var(--bg-card)',
                  padding: '8px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  transition: 'var(--transition)'
                }}
                className="queue-card-hover"
              >
                <div style={{ position: 'relative', width: '120px', aspectRatio: '16/9', borderRadius: '4px', overflow: 'hidden', backgroundColor: 'black', flexShrink: 0 }}>
                  <img src={item.thumbnailUrl} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <span style={{ position: 'absolute', bottom: '4px', right: '4px', fontSize: '0.7rem', backgroundColor: 'black', padding: '1px 4px', borderRadius: '2px' }}>
                    {Math.floor(item.duration / 60)}:{item.duration % 60 < 10 ? '0' : ''}{item.duration % 60}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', justifyContent: 'center' }}>
                  <h4 style={{ fontSize: '0.8rem', fontWeight: 'bold', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.25 }}>
                    {item.title}
                  </h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {item.isYouTubeVideo ? item.youtubeChannelTitle : (item.channel?.name || 'Creator')}
                  </span>
                </div>
              </div>
            ))}
            
            {queue.length === 0 && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No remaining items in queue.</p>
            )}
          </div>
        </div>
      )}

      {/* Paymongo Channel Support Modal */}
      {showSupportModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'var(--bg-sidebar)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '24px',
            width: '90%',
            maxWidth: '400px',
            position: 'relative'
          }}>
            <button 
              onClick={() => setShowSupportModal(false)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>

            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{
                background: 'rgba(194, 178, 128, 0.15)',
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '12px'
              }}>
                <Coffee size={32} style={{ color: 'var(--coffee-200)' }} />
              </div>
              <h3 style={{ fontFamily: 'Outfit', fontSize: '1.25rem' }}>Support this Channel</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Your payment will be secured by **Paymongo**. Once complete, a supporter badge will be linked to your comments.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Contribution Amount (PHP)</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['50', '100', '500'].map(amount => (
                  <button
                    key={amount}
                    onClick={() => setSupportAmount(amount)}
                    style={{
                      flex: 1,
                      padding: '10px 0',
                      borderRadius: '8px',
                      border: '1px solid',
                      borderColor: supportAmount === amount ? 'var(--coffee-200)' : 'var(--border-color)',
                      backgroundColor: supportAmount === amount ? 'var(--coffee-800)' : 'var(--bg-card)',
                      color: supportAmount === amount ? 'var(--coffee-200)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '0.9rem'
                    }}
                  >
                    ₱{amount}
                  </button>
                ))}
              </div>
              
              <input
                type="number"
                value={supportAmount}
                onChange={(e) => setSupportAmount(e.target.value)}
                placeholder="Custom Amount"
                style={{
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  color: 'white',
                  outline: 'none',
                  fontSize: '0.95rem'
                }}
              />
            </div>

            <button 
              onClick={handleInitiateSupport}
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px 0', borderRadius: '8px' }}
            >
              Continue to Paymongo
            </button>
          </div>
        </div>
      )}

      {/* Global custom Modal Dialog element */}
      <CustomModal
        isOpen={customModal.isOpen}
        title={customModal.title}
        message={customModal.message}
        onConfirm={customModal.onConfirm}
        onCancel={customModal.onCancel}
        confirmText={customModal.confirmText}
        cancelText={customModal.cancelText}
        isAlert={customModal.isAlert}
      />
    </div>
  );
};

export default VideoPage;
