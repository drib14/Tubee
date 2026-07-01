import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Settings, Tv, PictureInPicture } from 'lucide-react';

const UnifiedPlayer = ({ 
  videoId, 
  videoUrl, 
  thumbnailUrl, 
  isYouTubeVideo, 
  youtubeVideoId, 
  isOfflineMode, 
  offlineBlobUrl,
  onProgressLog,
  onVideoEnded // Callback when video ends
}) => {
  const containerRef = useRef(null);
  const videoRef = useRef(null); // Ref for HTML5 video
  const ytPlayerRef = useRef(null); // Ref for YouTube player instance
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [selectedResolution, setSelectedResolution] = useState('Auto');
  const [isAutoplayEnabled, setIsAutoplayEnabled] = useState(true);
  const [ytReady, setYtReady] = useState(false);

  const useYtEmbed = isYouTubeVideo && !isOfflineMode;
  const activeVideoSrc = isOfflineMode ? (offlineBlobUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4') : videoUrl;

  // --- YouTube Iframe API setup ---
  useEffect(() => {
    if (!useYtEmbed) {
      if (ytPlayerRef.current) {
        try { ytPlayerRef.current.destroy(); } catch(e){}
        ytPlayerRef.current = null;
      }
      setYtReady(false);
      return;
    }

    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    let checkInterval;
    const initPlayer = () => {
      if (window.YT && window.YT.Player) {
        clearInterval(checkInterval);
        
        ytPlayerRef.current = new window.YT.Player('youtube-player-frame', {
          videoId: youtubeVideoId,
          playerVars: {
            controls: 0,
            rel: 0,
            showinfo: 0,
            modestbranding: 1,
            disablekb: 1,
            fs: 0,
            iv_load_policy: 3
          },
          events: {
            onReady: (event) => {
              setYtReady(true);
              setDuration(event.target.getDuration());
              event.target.setVolume(volume * 100);
              event.target.setPlaybackRate(playbackSpeed);
            },
            onStateChange: (event) => {
              if (event.data === window.YT.PlayerState.PLAYING) {
                setIsPlaying(true);
              } else if (event.data === window.YT.PlayerState.PAUSED) {
                setIsPlaying(false);
              } else if (event.data === window.YT.PlayerState.ENDED) {
                setIsPlaying(false);
                if (isAutoplayEnabled && onVideoEnded) {
                  onVideoEnded();
                }
              }
            }
          }
        });
      }
    };

    checkInterval = setInterval(initPlayer, 200);

    return () => {
      clearInterval(checkInterval);
    };
  }, [youtubeVideoId, useYtEmbed]);

  // YouTube Poll Progress Interval
  useEffect(() => {
    if (!useYtEmbed || !ytReady || !isPlaying) return;

    const progressInterval = setInterval(() => {
      if (ytPlayerRef.current && ytPlayerRef.current.getCurrentTime) {
        const current = ytPlayerRef.current.getCurrentTime();
        setCurrentTime(current);
        if (onProgressLog) onProgressLog(current);
      }
    }, 500);

    return () => clearInterval(progressInterval);
  }, [useYtEmbed, ytReady, isPlaying]);

  // Sync Video source changes
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
  }, [videoId, isOfflineMode]);

  // --- Keyboard controls ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') {
        return;
      }

      const key = e.key.toLowerCase();
      
      if (key === ' ' || key === 'k') {
        e.preventDefault();
        togglePlay();
      } else if (key === 'arrowleft' || key === 'j') {
        e.preventDefault();
        const offset = key === 'j' ? 10 : 5;
        seekTo(Math.max(0, currentTime - offset));
      } else if (key === 'arrowright' || key === 'l') {
        e.preventDefault();
        const offset = key === 'l' ? 10 : 5;
        seekTo(Math.min(duration, currentTime + offset));
      } else if (key === 'arrowup') {
        e.preventDefault();
        changeVolume(Math.min(1, volume + 0.05));
      } else if (key === 'arrowdown') {
        e.preventDefault();
        changeVolume(Math.max(0, volume - 0.05));
      } else if (key === 'm') {
        e.preventDefault();
        toggleMute();
      } else if (key === 'f') {
        e.preventDefault();
        toggleFullscreen();
      } else if (key === 't') {
        e.preventDefault();
        toggleTheaterMode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTime, duration, volume, isMuted, isPlaying, ytReady, useYtEmbed, isAutoplayEnabled]);

  // --- HTML5 Player Event Handlers ---
  const handleHTML5TimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      if (onProgressLog) onProgressLog(videoRef.current.currentTime);
    }
  };

  const handleHTML5Metadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleHTML5Ended = () => {
    setIsPlaying(false);
    if (isAutoplayEnabled && onVideoEnded) {
      onVideoEnded();
    }
  };

  // --- Unified Helpers ---
  const seekTo = (seconds) => {
    setCurrentTime(seconds);
    if (useYtEmbed) {
      if (ytPlayerRef.current && ytPlayerRef.current.seekTo) {
        ytPlayerRef.current.seekTo(seconds, true);
      }
    } else {
      if (videoRef.current) {
        videoRef.current.currentTime = seconds;
      }
    }
  };

  const changeVolume = (val) => {
    setVolume(val);
    setIsMuted(val === 0);
    if (useYtEmbed) {
      if (ytPlayerRef.current && ytPlayerRef.current.setVolume) {
        ytPlayerRef.current.setVolume(val * 100);
        ytPlayerRef.current.unMute();
      }
    } else {
      if (videoRef.current) {
        videoRef.current.volume = val;
        videoRef.current.muted = false;
      }
    }
  };

  const togglePlay = () => {
    if (useYtEmbed) {
      if (!ytReady || !ytPlayerRef.current) return;
      if (isPlaying) {
        ytPlayerRef.current.pauseVideo();
        setIsPlaying(false);
      } else {
        ytPlayerRef.current.playVideo();
        setIsPlaying(true);
      }
    } else {
      if (!videoRef.current) return;
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(err => console.error(err));
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleScrubChange = (e) => {
    seekTo(parseFloat(e.target.value));
  };

  const handleVolumeChange = (e) => {
    changeVolume(parseFloat(e.target.value));
  };

  const toggleMute = () => {
    const newMuteState = !isMuted;
    setIsMuted(newMuteState);

    if (useYtEmbed) {
      if (ytPlayerRef.current && ytPlayerRef.current.mute) {
        if (newMuteState) {
          ytPlayerRef.current.mute();
        } else {
          ytPlayerRef.current.unMute();
          ytPlayerRef.current.setVolume(volume * 100);
        }
      }
    } else {
      if (videoRef.current) {
        videoRef.current.muted = newMuteState;
      }
    }
  };

  const handleSpeedChange = (speed) => {
    setPlaybackSpeed(speed);
    setShowSpeedMenu(false);

    if (useYtEmbed) {
      if (ytPlayerRef.current && ytPlayerRef.current.setPlaybackRate) {
        ytPlayerRef.current.setPlaybackRate(speed);
      }
    } else {
      if (videoRef.current) {
        videoRef.current.playbackRate = speed;
      }
    }
  };

  const toggleTheaterMode = () => {
    setIsTheaterMode(!isTheaterMode);
    window.dispatchEvent(new CustomEvent('toggle-theater', { detail: !isTheaterMode }));
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => console.error(err));
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const togglePictureInPicture = async () => {
    if (useYtEmbed) {
      alert('Picture-in-Picture is restricted on YouTube embeds.');
      return;
    }
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (err) {
      console.error('Failed to toggle Picture-in-Picture:', err);
    }
  };

  // Keep fullscreen state in sync if exited with Esc key
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Format seconds to H:MM:SS or MM:SS correctly
  const formatTime = (secs) => {
    if (isNaN(secs) || secs === null) return '0:00';
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const seconds = Math.floor(secs % 60);
    
    if (hrs > 0) {
      return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${seconds < 10 ? '0' : ''}${seconds}`;
    }
    return `${mins}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <div 
      ref={containerRef} 
      className={`custom-player-wrapper ${isTheaterMode ? 'theater' : ''}`}
      style={{
        width: '100%',
        aspectRatio: '16/9',
        backgroundColor: '#000',
        borderRadius: isFullscreen ? '0px' : '12px',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* 1. YouTube Frame Container */}
      <div 
        style={{
          width: '100%',
          height: '100%',
          display: useYtEmbed ? 'block' : 'none',
          pointerEvents: 'none'
        }}
      >
        <div id="youtube-player-frame" style={{ width: '100%', height: '100%' }}></div>
      </div>

      {/* 2. HTML5 Video Tag (Cloudinary/Offline/Fallback) */}
      {!useYtEmbed && (
        <video
          ref={videoRef}
          src={activeVideoSrc}
          className="custom-player-video"
          poster={thumbnailUrl}
          onClick={togglePlay}
          onTimeUpdate={handleHTML5TimeUpdate}
          onLoadedMetadata={handleHTML5Metadata}
          onEnded={handleHTML5Ended}
          playsInline
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
      )}

      {/* 3. Custom Overlay Controls */}
      <div className="custom-player-controls">
        {/* Progress scrub timeline */}
        <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleScrubChange}
            style={{
              width: '100%',
              height: '5px',
              accentColor: 'var(--accent-light)',
              cursor: 'pointer',
              background: `linear-gradient(to right, var(--accent-light) 0%, var(--accent-light) ${((currentTime / (duration || 1)) * 100).toFixed(2)}%, rgba(255,255,255,0.2) ${((currentTime / (duration || 1)) * 100).toFixed(2)}%, rgba(255,255,255,0.2) 100%)`
            }}
          />
        </div>

        {/* Button Bar */}
        <div className="custom-player-control-row">
          <div className="custom-player-group">
            {/* Play/Pause */}
            <button className="custom-player-btn" onClick={togglePlay}>
              {isPlaying ? <Pause size={20} fill="white" /> : <Play size={20} fill="white" />}
            </button>

            {/* Volume controls */}
            <div className="custom-player-group" style={{ gap: '8px' }}>
              <button className="custom-player-btn" onClick={toggleMute}>
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="custom-player-volume-slider"
              />
            </div>

            {/* Time Stamp */}
            <span className="custom-player-time">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="custom-player-group" style={{ gap: '12px' }}>
            {/* Autoplay Switch */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Autoplay</span>
              <button 
                onClick={() => setIsAutoplayEnabled(!isAutoplayEnabled)}
                style={{
                  width: '32px',
                  height: '16px',
                  borderRadius: '10px',
                  backgroundColor: isAutoplayEnabled ? 'var(--accent-light)' : 'rgba(255,255,255,0.2)',
                  border: 'none',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
              >
                <div style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: 'white',
                  position: 'absolute',
                  top: '2px',
                  left: isAutoplayEnabled ? '18px' : '2px',
                  transition: 'left 0.2s'
                }} />
              </button>
            </div>

            {/* Picture-in-Picture */}
            {!useYtEmbed && (
              <button className="custom-player-btn" onClick={togglePictureInPicture} title="Picture in Picture">
                <PictureInPicture size={18} />
              </button>
            )}

            {/* Speed selection */}
            <div style={{ position: 'relative' }}>
              <button 
                className="custom-player-btn" 
                onClick={() => { setShowSpeedMenu(!showSpeedMenu); setShowSettingsMenu(false); }}
                style={{ fontSize: '0.85rem', fontWeight: 'bold' }}
              >
                {playbackSpeed}x
              </button>
              
              {showSpeedMenu && (
                <div 
                  style={{
                    position: 'absolute',
                    bottom: '120%',
                    right: 0,
                    backgroundColor: '#1E1412',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '4px 0',
                    width: '70px',
                    display: 'flex',
                    flexDirection: 'column',
                    zIndex: 100
                  }}
                >
                  {[0.5, 1, 1.5, 2].map(speed => (
                    <button
                      key={speed}
                      onClick={() => handleSpeedChange(speed)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'white',
                        padding: '6px 12px',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        textAlign: 'center',
                        backgroundColor: playbackSpeed === speed ? 'var(--coffee-700)' : 'transparent'
                      }}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Settings Button */}
            <div style={{ position: 'relative' }}>
              <button 
                className="custom-player-btn" 
                onClick={() => { setShowSettingsMenu(!showSettingsMenu); setShowSpeedMenu(false); }}
              >
                <Settings size={18} />
              </button>
              
              {showSettingsMenu && (
                <div 
                  style={{
                    position: 'absolute',
                    bottom: '130%',
                    right: 0,
                    backgroundColor: '#1E1412',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '8px 0',
                    width: '150px',
                    display: 'flex',
                    flexDirection: 'column',
                    zIndex: 100,
                    boxShadow: 'var(--shadow-md)'
                  }}
                >
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '4px 12px', borderBottom: '1px solid var(--border-color)' }}>Quality Option</span>
                  {['1080p HD', '720p', '480p', 'Auto'].map(res => (
                    <button
                      key={res}
                      onClick={() => { setSelectedResolution(res); setShowSettingsMenu(false); }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'white',
                        padding: '8px 12px',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        textAlign: 'left',
                        backgroundColor: selectedResolution === res ? 'var(--coffee-700)' : 'transparent',
                        display: 'flex',
                        justifyContent: 'space-between'
                      }}
                    >
                      <span>{res}</span>
                      {selectedResolution === res && <span style={{ color: 'var(--accent-light)' }}>✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Theater Mode */}
            <button className="custom-player-btn" onClick={toggleTheaterMode} title="Theater Mode">
              <Tv size={18} />
            </button>

            {/* Fullscreen */}
            <button className="custom-player-btn" onClick={toggleFullscreen}>
              {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedPlayer;
