import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Settings, Video } from 'lucide-react';

const UnifiedPlayer = ({ 
  videoId, 
  videoUrl, 
  thumbnailUrl, 
  isYouTubeVideo, 
  youtubeVideoId, 
  isOfflineMode, 
  offlineBlobUrl,
  onProgressLog
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

    // Initialize/Load YT API script
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
              // YT.PlayerState.PLAYING = 1, YT.PlayerState.PAUSED = 2
              if (event.data === window.YT.PlayerState.PLAYING) {
                setIsPlaying(true);
              } else if (event.data === window.YT.PlayerState.PAUSED) {
                setIsPlaying(false);
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
  };

  // --- Unified Controls Actions ---
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
    const scrubTime = parseFloat(e.target.value);
    setCurrentTime(scrubTime);

    if (useYtEmbed) {
      if (ytPlayerRef.current && ytPlayerRef.current.seekTo) {
        ytPlayerRef.current.seekTo(scrubTime, true);
      }
    } else {
      if (videoRef.current) {
        videoRef.current.currentTime = scrubTime;
      }
    }
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
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
    // Dispatch global event so page layout can expand
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

  // Keep fullscreen state in sync if exited with Esc key
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Format seconds to mm:ss
  const formatTime = (secs) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
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
          pointerEvents: 'none' // Intercept interactions via our custom overlay
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

          <div className="custom-player-group">
            {/* Speed selection */}
            <div style={{ position: 'relative' }}>
              <button 
                className="custom-player-btn" 
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
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

            {/* Theater Mode */}
            <button className="custom-player-btn" onClick={toggleTheaterMode}>
              <span style={{ 
                border: '2px solid white', 
                width: '18px', 
                height: '12px', 
                borderRadius: '2px',
                display: 'inline-block'
              }}></span>
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
