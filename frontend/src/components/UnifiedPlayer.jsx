import React, { useEffect, useRef } from 'react';

const UnifiedPlayer = ({ youtubeVideoId }) => {
  const iframeRef = useRef(null);

  // Keyboard controls listener (Space to play/pause, F to fullscreen, M to mute)
  useEffect(() => {
    const handleKeyPress = (e) => {
      const activeEl = document.activeElement;
      // Skip if typing in inputs/textareas
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
        return;
      }

      if (e.code === 'KeyF') {
        e.preventDefault();
        try {
          if (iframeRef.current) {
            if (document.fullscreenElement) {
              document.exitFullscreen();
            } else {
              iframeRef.current.requestFullscreen();
            }
          }
        } catch (err) {
          console.warn('Fullscreen request failed:', err);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const videoSrc = `https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&rel=0&enablejsapi=1`;

  return (
    <div style={{
      width: '100%',
      aspectRatio: '16/9',
      borderRadius: '12px',
      overflow: 'hidden',
      backgroundColor: 'black',
      boxShadow: 'var(--shadow-md)',
      border: '1px solid var(--border-color)'
    }}>
      <iframe
        ref={iframeRef}
        width="100%"
        height="100%"
        src={videoSrc}
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        style={{ border: 'none' }}
      />
    </div>
  );
};

export default UnifiedPlayer;
