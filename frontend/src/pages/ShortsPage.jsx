import React, { useState, useEffect, useRef } from 'react';
import { ThumbsUp, ThumbsDown, MessageSquare, Share2, Music, Volume2, VolumeX } from 'lucide-react';
import { videoAPI, commentAPI } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const ShortsPage = () => {
  const { isAuthenticated } = useAuth();
  const [shorts, setShorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);

  // States for comments overlay panel
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newCommentText, setNewCommentText] = useState('');

  const containerRef = useRef(null);

  const fetchShorts = async () => {
    setLoading(true);
    try {
      const res = await videoAPI.getShorts();
      setShorts(res.data);
    } catch (err) {
      console.error('Loading shorts failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShorts();
  }, []);

  // Fetch comments whenever the active short video changes
  useEffect(() => {
    if (shorts.length > 0 && shorts[activeIndex]) {
      const loadComments = async () => {
        try {
          const res = await commentAPI.getByVideo(shorts[activeIndex]._id);
          setComments(res.data);
        } catch (err) {
          console.warn('Comments load failed for active Short:', err);
        }
      };
      loadComments();
    }
  }, [activeIndex, shorts]);

  // Handle keyboard navigation (ArrowUp / ArrowDown)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showComments) return; // Prevent scroll capture while typing in comments

      if (e.code === 'ArrowDown' && activeIndex < shorts.length - 1) {
        e.preventDefault();
        scrollToIndex(activeIndex + 1);
      } else if (e.code === 'ArrowUp' && activeIndex > 0) {
        e.preventDefault();
        scrollToIndex(activeIndex - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, shorts, showComments]);

  const scrollToIndex = (index) => {
    setActiveIndex(index);
    if (containerRef.current) {
      const height = containerRef.current.clientHeight;
      containerRef.current.scrollTo({
        top: index * height,
        behavior: 'smooth'
      });
    }
  };

  // Detect which vertical item is active on scroll end
  const handleScroll = (e) => {
    const scrollTop = e.currentTarget.scrollTop;
    const height = e.currentTarget.clientHeight;
    const index = Math.round(scrollTop / height);
    if (index !== activeIndex && index >= 0 && index < shorts.length) {
      setActiveIndex(index);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    if (!isAuthenticated) return alert('Please sign in to add comments.');

    try {
      const activeVideo = shorts[activeIndex];
      const res = await commentAPI.create(activeVideo._id, newCommentText);
      setComments(prev => [res.data, ...prev]);
      setNewCommentText('');
    } catch (err) {
      console.error('Comment posting failed:', err);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <div className="skeleton" style={{ width: '340px', height: '600px', borderRadius: '16px' }} />
      </div>
    );
  }

  if (shorts.length === 0) {
    return <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No Shorts streams available.</div>;
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: 'calc(100vh - 100px)',
      position: 'relative'
    }}>
      {/* Centered Scrollable Shorts Frame */}
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        style={{
          width: '360px',
          height: '640px',
          overflowY: 'scroll',
          scrollSnapType: 'y mandatory',
          borderRadius: '16px',
          boxShadow: 'var(--shadow-md)',
          backgroundColor: '#000',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
        className="shorts-vertical-scroller"
      >
        {shorts.map((item, idx) => {
          const isActive = idx === activeIndex;
          const embedUrl = `https://www.youtube.com/embed/${item.youtubeVideoId}?autoplay=${isActive ? 1 : 0}&mute=${isMuted ? 1 : 0}&loop=1&playlist=${item.youtubeVideoId}&controls=0&modestbranding=1&rel=0&iv_load_policy=3`;

          return (
            <div 
              key={item._id}
              style={{
                width: '100%',
                height: '640px',
                scrollSnapAlign: 'start',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}
            >
              {/* Iframe Stream */}
              <iframe
                width="100%"
                height="100%"
                src={embedUrl}
                title={item.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                style={{
                  pointerEvents: 'auto',
                  border: 'none'
                }}
              />

              {/* Title & Channel overlay info */}
              <div style={{
                position: 'absolute',
                bottom: '16px',
                left: '16px',
                right: '72px',
                color: 'white',
                textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                zIndex: 10,
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <img 
                    src={item.youtubeChannelAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&q=80'} 
                    alt={item.youtubeChannelTitle} 
                    style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid white', objectFit: 'cover' }} 
                  />
                  <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>@{item.youtubeChannelTitle}</span>
                  <button style={{
                    backgroundColor: 'var(--coffee-200)',
                    color: '#1E1412',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '2px 10px',
                    fontSize: '0.7rem',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}>
                    Subscribe
                  </button>
                </div>
                <p style={{ fontSize: '0.8rem', fontWeight: '500', lineHeight: '1.3' }}>{item.title}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', opacity: 0.8 }}>
                  <Music size={12} />
                  <span>Original audio stream</span>
                </div>
              </div>

              {/* Side Floating Overlay Toolbar Buttons */}
              <div style={{
                position: 'absolute',
                bottom: '16px',
                right: '12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px',
                zIndex: 10
              }}>
                {/* Audio sound state toggle */}
                <button 
                  onClick={() => setIsMuted(!isMuted)}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white'
                  }}
                >
                  {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>

                {/* Like */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                  <button style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white'
                  }}>
                    <ThumbsUp size={18} />
                  </button>
                  <span style={{ fontSize: '0.7rem', color: 'white', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>{item.likes}</span>
                </div>

                {/* Dislike */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                  <button style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white'
                  }}>
                    <ThumbsDown size={18} />
                  </button>
                  <span style={{ fontSize: '0.7rem', color: 'white', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>Dislike</span>
                </div>

                {/* Comments trigger */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                  <button 
                    onClick={() => setShowComments(!showComments)}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(0,0,0,0.6)',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: showComments ? 'var(--coffee-200)' : 'white'
                    }}
                  >
                    <MessageSquare size={18} />
                  </button>
                  <span style={{ fontSize: '0.7rem', color: 'white', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>{comments.length}</span>
                </div>

                {/* Share */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                  <button style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white'
                  }}>
                    <Share2 size={18} />
                  </button>
                  <span style={{ fontSize: '0.7rem', color: 'white', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>Share</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Comments Panel overlay */}
      {showComments && (
        <div style={{
          position: 'absolute',
          top: '5%',
          bottom: '5%',
          left: 'calc(50% + 200px)',
          width: '300px',
          backgroundColor: 'var(--bg-sidebar)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          boxShadow: 'var(--shadow-md)',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <div style={{ padding: '12px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 'bold', fontFamily: 'Outfit' }}>Comments</span>
            <button 
              onClick={() => setShowComments(false)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem' }}
            >
              Close
            </button>
          </div>

          {/* List panel */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {comments.map(c => (
              <div key={c._id} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <img 
                  src={c.user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&q=80'} 
                  alt={c.user.name} 
                  style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} 
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'white' }}>{c.user.name}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{c.text}</span>
                </div>
              </div>
            ))}

            {comments.length === 0 && (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                No comments yet.
              </div>
            )}
          </div>

          {/* Submit form */}
          {isAuthenticated ? (
            <form onSubmit={handleCommentSubmit} style={{ padding: '8px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '6px' }}>
              <input 
                type="text"
                placeholder="Add comment..."
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                style={{
                  flex: 1,
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '16px',
                  padding: '6px 12px',
                  color: 'white',
                  fontSize: '0.75rem',
                  outline: 'none'
                }}
              />
              <button type="submit" className="btn btn-primary" style={{ padding: '4px 10px', fontSize: '0.7rem', borderRadius: '16px' }}>
                Send
              </button>
            </form>
          ) : (
            <div style={{ padding: '10px', textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)' }}>
              Sign in to add comments.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ShortsPage;
