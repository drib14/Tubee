import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ThumbsUp, ThumbsDown, Clock, Share2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { videoAPI, commentAPI } from '../lib/api';
import UnifiedPlayer from '../components/UnifiedPlayer';

const VideoPage = () => {
  const { id } = useParams();
  const { isAuthenticated } = useAuth();
  
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [descExpanded, setDescExpanded] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  // Liked, Disliked, and WatchLater state
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [watchLater, setWatchLater] = useState(false);

  const fetchVideoDetails = async () => {
    setLoading(true);
    try {
      // 1. Fetch main video metadata
      const res = await videoAPI.getById(id);
      setVideo(res.data);

      // Load like status
      const savedLikes = JSON.parse(localStorage.getItem('likedVideos') || '[]');
      setLiked(savedLikes.includes(id));
      
      const savedDislikes = JSON.parse(localStorage.getItem('dislikedVideos') || '[]');
      setDisliked(savedDislikes.includes(id));

      const savedWatchLater = JSON.parse(localStorage.getItem('watchLaterVideos') || '[]');
      setWatchLater(savedWatchLater.includes(id));

      // Load subscription status
      const subs = JSON.parse(localStorage.getItem('subscribedChannels') || '[]');
      setIsSubscribed(subs.some(item => item._id === `yt-channel-${res.data.youtubeChannelId}`));

      // 2. Fetch comments list
      const commRes = await commentAPI.getByVideo(id);
      setComments(commRes.data);

      // 3. Fetch suggestions feed
      const sugRes = await videoAPI.getFeed();
      setSuggestions(sugRes.data.filter(v => v._id !== id).slice(0, 8));
    } catch (err) {
      console.error('Watch detail loading failed:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideoDetails();
  }, [id]);

  const handleLike = () => {
    if (!isAuthenticated) return alert('Please sign in to like videos.');
    const savedLikes = JSON.parse(localStorage.getItem('likedVideos') || '[]');
    let updated;
    if (liked) {
      updated = savedLikes.filter(x => x !== id);
      setLiked(false);
    } else {
      updated = [...savedLikes, id];
      setLiked(true);
      // Remove from dislikes
      const savedDislikes = JSON.parse(localStorage.getItem('dislikedVideos') || '[]');
      localStorage.setItem('dislikedVideos', JSON.stringify(savedDislikes.filter(x => x !== id)));
      setDisliked(false);
    }
    localStorage.setItem('likedVideos', JSON.stringify(updated));
  };

  const handleDislike = () => {
    if (!isAuthenticated) return alert('Please sign in to dislike.');
    const savedDislikes = JSON.parse(localStorage.getItem('dislikedVideos') || '[]');
    let updated;
    if (disliked) {
      updated = savedDislikes.filter(x => x !== id);
      setDisliked(false);
    } else {
      updated = [...savedDislikes, id];
      setDisliked(true);
      // Remove from likes
      const savedLikes = JSON.parse(localStorage.getItem('likedVideos') || '[]');
      localStorage.setItem('likedVideos', JSON.stringify(savedLikes.filter(x => x !== id)));
      setLiked(false);
    }
    localStorage.setItem('dislikedVideos', JSON.stringify(updated));
  };

  const handleWatchLater = () => {
    if (!isAuthenticated) return alert('Please sign in.');
    const savedWL = JSON.parse(localStorage.getItem('watchLaterVideos') || '[]');
    let updated;
    if (watchLater) {
      updated = savedWL.filter(x => x !== id);
      setWatchLater(false);
    } else {
      updated = [...savedWL, id];
      setWatchLater(true);
    }
    localStorage.setItem('watchLaterVideos', JSON.stringify(updated));
  };

  const handleSubscribe = () => {
    if (!isAuthenticated) return alert('Please sign in to subscribe.');
    const subs = JSON.parse(localStorage.getItem('subscribedChannels') || '[]');
    const chId = `yt-channel-${video.youtubeChannelId}`;
    
    let updated;
    if (isSubscribed) {
      updated = subs.filter(item => item._id !== chId);
      setIsSubscribed(false);
    } else {
      updated = [...subs, {
        _id: chId,
        name: video.youtubeChannelTitle,
        avatar: video.youtubeChannelAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&q=80'
      }];
      setIsSubscribed(true);
    }
    localStorage.setItem('subscribedChannels', JSON.stringify(updated));
    window.dispatchEvent(new Event('subscribe-change'));
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    if (!isAuthenticated) return alert('Please sign in to submit comments.');

    try {
      const res = await commentAPI.create(id, newCommentText);
      setComments(prev => [res.data, ...prev]);
      setNewCommentText('');
    } catch (err) {
      console.error('Posting comment failed:', err);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="skeleton" style={{ width: '100%', aspectRatio: '16/9', borderRadius: '12px' }} />
          <div className="skeleton" style={{ height: '24px', width: '60%', borderRadius: '4px' }} />
        </div>
      </div>
    );
  }

  if (!video) {
    return <div style={{ color: 'var(--text-muted)' }}>Video details unavailable.</div>;
  }

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: '1fr', 
      gap: '24px',
      maxWidth: '1200px',
      margin: '0 auto'
    }} className="watch-page-responsive">
      
      {/* 1. Main Left Block (Video Player + Metadata) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <UnifiedPlayer youtubeVideoId={video.youtubeVideoId} />

        <h1 style={{ fontSize: '1.25rem', fontWeight: '700', fontFamily: 'Outfit', color: 'white' }}>
          {video.title}
        </h1>

        {/* Video Statistics & User Control Actions */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          paddingBottom: '12px',
          borderBottom: '1px solid var(--border-color)'
        }}>
          {/* Creator details */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link to={`/channel/${video.youtubeChannelId}`}>
              <img 
                src={video.youtubeChannelAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&q=80'} 
                alt={video.youtubeChannelTitle} 
                style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} 
              />
            </Link>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <Link to={`/channel/${video.youtubeChannelId}`} style={{ color: 'white', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.9rem' }}>
                {video.youtubeChannelTitle}
              </Link>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {video.youtubeSubscribersCount || '240K subscribers'}
              </span>
            </div>
            
            <button 
              onClick={handleSubscribe} 
              className={`btn ${isSubscribed ? 'btn-secondary' : 'btn-primary'}`}
              style={{ padding: '6px 14px', fontSize: '0.8rem', marginLeft: '12px', borderRadius: '20px' }}
            >
              {isSubscribed ? 'Subscribed' : 'Subscribe'}
            </button>
          </div>

          {/* Action pills buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'var(--bg-card)',
              borderRadius: '20px',
              border: '1px solid var(--border-color)',
              overflow: 'hidden'
            }}>
              <button 
                onClick={handleLike} 
                style={{
                  background: 'none',
                  border: 'none',
                  color: liked ? 'var(--coffee-200)' : 'white',
                  padding: '8px 16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.8rem',
                  fontWeight: '600'
                }}
              >
                <ThumbsUp size={16} />
                <span>{video.likes}</span>
              </button>
              <div style={{ width: '1px', height: '16px', backgroundColor: 'var(--border-color)' }} />
              <button 
                onClick={handleDislike}
                style={{
                  background: 'none',
                  border: 'none',
                  color: disliked ? 'var(--coffee-200)' : 'white',
                  padding: '8px 16px',
                  cursor: 'pointer'
                }}
              >
                <ThumbsDown size={16} />
              </button>
            </div>

            <button 
              onClick={handleWatchLater}
              className="btn btn-secondary"
              style={{ borderRadius: '20px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Clock size={16} style={{ color: watchLater ? 'var(--coffee-200)' : 'white' }} />
              <span>{watchLater ? 'In Watch Later' : 'Watch Later'}</span>
            </button>
          </div>
        </div>

        {/* Collapsable Description Box */}
        <div style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: '12px',
          padding: '12px',
          border: '1px solid var(--border-color)',
          fontSize: '0.85rem',
          lineHeight: '1.4'
        }}>
          <div style={{ display: 'flex', gap: '10px', fontWeight: 'bold', color: 'white', marginBottom: '6px' }}>
            <span>{Number(video.views).toLocaleString()} views</span>
            <span>•</span>
            <span>{video.createdAt}</span>
          </div>
          <p style={{ 
            color: 'var(--text-secondary)', 
            whiteSpace: 'pre-wrap',
            maxHeight: descExpanded ? 'none' : '60px',
            overflow: 'hidden',
            transition: 'max-height 0.25s ease'
          }}>
            {video.description}
          </p>
          <button 
            onClick={() => setDescExpanded(!descExpanded)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--coffee-200)',
              cursor: 'pointer',
              fontWeight: 'bold',
              marginTop: '6px',
              fontFamily: 'Outfit'
            }}
          >
            {descExpanded ? 'Show less' : '...more'}
          </button>
        </div>

        {/* Comments Feed Block */}
        <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '1.05rem', fontFamily: 'Outfit', fontWeight: 'bold', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
            {comments.length} Comments
          </h2>

          {isAuthenticated ? (
            <form onSubmit={handleCommentSubmit} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <input 
                type="text"
                placeholder="Add a public comment..."
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                style={{
                  flex: 1,
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '20px',
                  padding: '10px 16px',
                  color: 'white',
                  outline: 'none',
                  fontSize: '0.85rem'
                }}
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px', borderRadius: '20px' }}>
                Comment
              </button>
            </form>
          ) : (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Please sign in to add public comments.
            </p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '10px' }}>
            {comments.map(c => (
              <div key={c._id} style={{ display: 'flex', gap: '12px' }}>
                <img 
                  src={c.user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&q=80'} 
                  alt={c.user.name} 
                  style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} 
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'white' }}>{c.user.name}</span>
                    {c.isSupporter && (
                      <span style={{
                        backgroundColor: 'var(--coffee-900)',
                        color: 'var(--coffee-200)',
                        fontSize: '0.6rem',
                        fontWeight: 'bold',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        border: '1px solid var(--coffee-700)'
                      }}>
                        Member
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{c.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Suggested Videos Grid Sidebar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
        <h2 style={{ fontSize: '1.05rem', fontFamily: 'Outfit', fontWeight: 'bold', color: 'var(--coffee-200)' }}>
          Suggested Videos
        </h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {suggestions.map(s => (
            <Link 
              key={s._id} 
              to={`/watch/${s._id}`} 
              style={{ display: 'flex', gap: '10px', textDecoration: 'none', color: 'white' }}
              className="queue-card-hover"
            >
              <img 
                src={s.thumbnailUrl} 
                alt={s.title} 
                style={{ width: '120px', aspectRatio: '16/9', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--border-color)' }} 
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 'bold', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.2' }}>
                  {s.title}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '500' }}>
                  {s.youtubeChannelTitle}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {Number(s.views).toLocaleString()} views
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
};

export default VideoPage;
