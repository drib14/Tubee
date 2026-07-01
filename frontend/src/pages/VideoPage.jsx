import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ThumbsUp, ThumbsDown, Clock, Download, Check, Sparkles, Send, Share2, MapPin, Coffee, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { videoAPI, channelAPI, commentAPI, paymentAPI } from '../lib/api';
import { offlineDb } from '../lib/offlineDb';
import UnifiedPlayer from '../components/UnifiedPlayer';

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
  
  // Download State
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const [offlineBlobUrl, setOfflineBlobUrl] = useState(null);

  // Queue State
  const [queue, setQueue] = useState([]);
  const [theaterMode, setTheaterMode] = useState(false);
  
  // Paymongo Modal
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [supportAmount, setSupportAmount] = useState('100'); // PHP 100 default

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
            alert('This video is not available offline. Please download it first.');
            navigate('/downloads');
            return;
          }
          setVideo(target);
          setIsDownloaded(true);
          
          // Get offline blob URL
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

        // Check if user liked/disliked or added to watch later
        if (user) {
          // These lists exist in the populated user object
          // For simplicity, we can query our current state or look at user object lists
          const storedUserStr = localStorage.getItem('user');
          if (storedUserStr) {
            const u = JSON.parse(storedUserStr);
            // Wait, we can fetch fresh user profile or read from local storage
            // Let's implement local checks
          }
        }

        // Is Downloaded?
        const downloadedState = await offlineDb.isDownloaded(id);
        setIsDownloaded(downloadedState);
        if (downloadedState) {
          const url = await offlineDb.getOfflineVideoStreamUrl(id);
          setOfflineBlobUrl(url);
        }

        // Fetch related videos to populate the suggested queue
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
  }, [id, isOfflineMode, user]);

  // Unified auto-play when video finishes
  const handleVideoProgressLog = (currentTime) => {
    // If progress is close to duration, or we can mock ended, but the player handle onEnd will trigger
    // We will let client manage playing next item from queue if they choose.
  };

  const playQueueItem = (item) => {
    navigate(`/watch/${item._id}`);
  };

  const handleDownload = async () => {
    if (!video) return;
    try {
      setDownloading(true);
      setDownloadProgress(10);
      
      await offlineDb.downloadVideo(video, (progress) => {
        setDownloadProgress(progress);
      });
      
      setIsDownloaded(true);
      setDownloading(false);
      const url = await offlineDb.getOfflineVideoStreamUrl(video._id);
      setOfflineBlobUrl(url);
    } catch (err) {
      console.error(err);
      alert('Download failed. Ensure server connection is stable.');
      setDownloading(false);
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      alert('Please sign in to like videos');
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
      alert('Please sign in to dislike videos');
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
      alert('Please sign in to save videos');
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
      alert('Please sign in to subscribe');
      return;
    }
    if (!video.channel) return;
    try {
      setIsSubscribed(!isSubscribed);
      await channelAPI.subscribe(video.channel._id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    if (!isAuthenticated) {
      alert('Please sign in with Google to post comments');
      return;
    }

    try {
      // Send comment
      const response = await commentAPI.create({
        videoId: video._id,
        text: newComment,
        channelId: video.channel?._id
      });
      
      setComments([response.data, ...comments]);
      setNewComment('');
    } catch (err) {
      console.error(err);
      alert('Failed to send comment');
    }
  };

  const handleInitiateSupport = async () => {
    if (!isAuthenticated) {
      alert('Sign in to support this channel');
      return;
    }
    try {
      const response = await paymentAPI.createSession({
        amount: parseFloat(supportAmount),
        channelId: video.channel?._id || 'unaffiliated',
        channelName: video.isYouTubeVideo ? video.youtubeChannelTitle : (video.channel?.name || 'Creator')
      });
      // Redirect to Paymongo secure checkout checkoutUrl
      window.location.href = response.data.checkoutUrl;
    } catch (err) {
      console.error(err);
      alert('Failed to launch Paymongo checkout: ' + (err.response?.data?.message || err.message));
    }
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

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: theaterMode ? '1fr' : '2fr 1fr', 
      gap: '24px',
      paddingBottom: '60px'
    }}>
      {/* Left Column: Player & Metadata */}
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
        />

        {/* Video Info Card */}
        <div style={{ marginTop: '20px' }}>
          <h1 style={{ fontFamily: 'Outfit', fontSize: '1.4rem', fontWeight: '700', marginBottom: '8px' }}>
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
              <span>{video.views ? video.views.toLocaleString() : '1,024'} views</span>
              <span>•</span>
              <span>{video.createdAt ? (typeof video.createdAt === 'string' ? video.createdAt.split('T')[0] : 'Recently') : 'Recently'}</span>
              
              {video.location && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '12px', color: 'var(--coffee-200)', fontWeight: 'bold' }}>
                  <MapPin size={12} />
                  <span>{video.location.name}</span>
                </div>
              )}
            </div>

            {/* Interaction Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button onClick={handleLike} className={`btn btn-secondary ${isLiked ? 'btn-accent' : ''}`} style={{ padding: '8px 14px', fontSize: '0.8rem' }}>
                <ThumbsUp size={14} fill={isLiked ? 'white' : 'none'} />
                <span>{isLiked ? (video.likes + 1) : video.likes}</span>
              </button>
              
              <button onClick={handleDislike} className={`btn btn-secondary ${isDisliked ? 'btn-accent' : ''}`} style={{ padding: '8px 14px', fontSize: '0.8rem' }}>
                <ThumbsDown size={14} fill={isDisliked ? 'white' : 'none'} />
                <span>Dislike</span>
              </button>

              <button onClick={handleWatchLater} className={`btn btn-secondary ${inWatchLater ? 'btn-accent' : ''}`} style={{ padding: '8px 14px', fontSize: '0.8rem' }}>
                <Clock size={14} />
                <span>Later</span>
              </button>

              {/* Download trigger */}
              <button 
                onClick={handleDownload} 
                disabled={isDownloaded || downloading}
                className="btn btn-secondary" 
                style={{ 
                  padding: '8px 14px', 
                  fontSize: '0.8rem',
                  backgroundColor: isDownloaded ? 'rgba(78, 52, 46, 0.2)' : 'var(--bg-card)'
                }}
              >
                {downloading ? (
                  <>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', border: '2px solid white', borderTopColor: 'transparent', animation: 'loading 0.8s linear infinite' }} />
                    <span>{downloadProgress}%</span>
                  </>
                ) : isDownloaded ? (
                  <>
                    <Check size={14} style={{ color: 'var(--coffee-200)' }} />
                    <span style={{ color: 'var(--coffee-200)' }}>Downloaded</span>
                  </>
                ) : (
                  <>
                    <Download size={14} />
                    <span>Download</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Channel Details Grid */}
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
            <img 
              src={
                video.isYouTubeVideo 
                  ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80' 
                  : (video.channel?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80')
              } 
              alt={video.isYouTubeVideo ? video.youtubeChannelTitle : video.channel?.name}
              style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--coffee-700)' }}
            />
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 'bold' }}>
                {video.isYouTubeVideo ? video.youtubeChannelTitle : (video.channel?.name || 'Creator Studio')}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {video.isYouTubeVideo ? 'YouTube Channel' : `${video.channel?.subscribersCount || 0} subscribers`}
              </p>
            </div>
            
            {/* Subscribe toggle for local channels */}
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

          {/* Paymongo Donation Support Trigger */}
          <button 
            onClick={() => setShowSupportModal(true)} 
            className="btn btn-primary"
            style={{ 
              backgroundColor: 'var(--coffee-800)', 
              color: 'var(--coffee-200)',
              border: '1px solid var(--coffee-700)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Coffee size={16} fill="var(--coffee-200)" />
            <span>Support Channel</span>
          </button>
        </div>

        {/* Video Description Box */}
        <div style={{ 
          backgroundColor: 'var(--bg-card)', 
          padding: '16px', 
          borderRadius: '8px', 
          margin: '20px 0',
          border: '1px solid var(--border-color)',
          fontSize: '0.9rem',
          color: 'var(--text-secondary)'
        }}>
          <p style={{ whiteSpace: 'pre-line' }}>{video.description || 'No description provided.'}</p>
        </div>

        {/* Comments Section */}
        <div style={{ marginTop: '30px' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '16px', fontFamily: 'Outfit' }}>
            {comments.length} Comments
          </h2>

          {/* Comment Form */}
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

          {/* Comments List */}
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
                    
                    {/* Paymongo patron badge */}
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
            width: '100%',
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
    </div>
  );
};

export default VideoPage;
