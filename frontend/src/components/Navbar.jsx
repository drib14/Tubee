import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, Upload, LogOut, Tv, Wifi, WifiOff, Bell, Trash2, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const navigate = useNavigate();
  const { user, login, logout, isOfflineMode, toggleOfflineMode, isAuthenticated, notifications, clearNotifications } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Sync YouTube Subscriptions from Google Account
  const triggerSyncSubscriptions = () => {
    try {
      if (window.google?.accounts?.oauth2) {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: '736056421227-toir94rjlenl2oots2ifttbrgp1nroe7.apps.googleusercontent.com',
          scope: 'https://www.googleapis.com/auth/youtube.readonly',
          callback: async (tokenResponse) => {
            if (tokenResponse.access_token) {
              console.log('Google Access Token acquired. Syncing subscriptions...');
              try {
                const response = await fetch(
                  `https://www.googleapis.com/youtube/v3/subscriptions?part=snippet&mine=true&maxResults=50`,
                  {
                    headers: {
                      Authorization: `Bearer ${tokenResponse.access_token}`
                    }
                  }
                );
                const data = await response.json();
                if (data.items) {
                  const syncedSubs = data.items.map(item => ({
                    _id: item.snippet.resourceId.channelId,
                    name: item.snippet.title,
                    avatar: item.snippet.thumbnails?.default?.url || item.snippet.thumbnails?.high?.url || ''
                  }));
                  localStorage.setItem('subscribedChannels', JSON.stringify(syncedSubs));
                  window.dispatchEvent(new Event('subscribe-change'));
                  alert(`Successfully synced ${syncedSubs.length} YouTube subscriptions!`);
                } else {
                  alert('No subscriptions found on this Google account.');
                }
              } catch (apiErr) {
                console.error('Failed to query YouTube subscriptions:', apiErr);
                alert('OAuth query failed. Verify network connection.');
              }
            }
          }
        });
        tokenClient.requestAccessToken({ prompt: 'consent' });
      } else {
        alert('Google OAuth2 API is loading, please try again in a few seconds.');
      }
    } catch (err) {
      console.warn('OAuth2 client initialization failed:', err);
    }
  };

  // Initialize Google Login Button
  useEffect(() => {
    /* global google */
    if (isOfflineMode) return; 

    const initializeGoogleSignIn = () => {
      if (window.google?.accounts?.id) {
        if (!window.gsiInitialized) {
          window.gsiInitialized = true;
          window.google.accounts.id.initialize({
            client_id: '736056421227-toir94rjlenl2oots2ifttbrgp1nroe7.apps.googleusercontent.com',
            callback: async (response) => {
              try {
                await login(response.credential);
                // Automatically run sync after login
                setTimeout(triggerSyncSubscriptions, 1500);
                navigate('/');
              } catch (err) {
                console.error('Google OAuth failed on server:', err);
                alert('OAuth authentication failed. Check console.');
              }
            }
          });
        }

        const btnElement = document.getElementById('google-signin-btn');
        if (btnElement) {
          window.google.accounts.id.renderButton(btnElement, {
            theme: 'filled_black',
            size: 'medium',
            shape: 'pill',
            text: 'signin_with'
          });
        }
      }
    };

    const timer = setTimeout(initializeGoogleSignIn, 500);
    return () => clearTimeout(timer);
  }, [user, isOfflineMode]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="app-header">
      {/* Brand logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="36" height="36" style={{ borderRadius: '50%' }}>
            <circle cx="50" cy="50" r="46" fill="#3E2723" />
            <path d="M32 38 L68 38 C68 56 59 64 50 64 C41 64 32 56 32 38 Z" fill="#D7CCC8" />
            <polygon points="44,43 57,50 44,57" fill="#3E2723" />
          </svg>
          <span style={{ 
            fontFamily: "'Outfit', sans-serif", 
            fontSize: '1.45rem', 
            fontWeight: '700', 
            letterSpacing: '0.5px',
            color: 'var(--text-primary)'
          }}>
            Tubee
          </span>
        </Link>
      </div>

      {/* Search form */}
      <form onSubmit={handleSearchSubmit} className="search-container">
        <input
          type="text"
          placeholder="search..."
          className="search-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button type="submit" className="search-btn">
          <Search size={18} />
        </button>
      </form>

      {/* Header Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Offline Switcher */}
        <button 
          onClick={toggleOfflineMode}
          className="btn btn-secondary"
          style={{ 
            padding: '6px 12px', 
            fontSize: '0.8rem', 
            display: 'flex', 
            gap: '6px', 
            alignItems: 'center',
            borderColor: isOfflineMode ? 'var(--accent)' : 'var(--coffee-700)',
            backgroundColor: isOfflineMode ? 'rgba(230, 81, 0, 0.15)' : 'var(--bg-card)'
          }}
          title={isOfflineMode ? "Go Online" : "Go Offline (Simulate)"}
        >
          {isOfflineMode ? (
            <>
              <WifiOff size={14} style={{ color: 'var(--accent)' }} />
              <span style={{ color: 'var(--accent)' }}>Offline</span>
            </>
          ) : (
            <>
              <Wifi size={14} style={{ color: 'var(--coffee-300)' }} />
              <span>Online</span>
            </>
          )}
        </button>

        {/* User buttons / Login */}
        {!isOfflineMode && isAuthenticated ? (
          <>
            <Link to="/upload" className="btn btn-primary" style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
              <Upload size={14} />
              <span>Upload</span>
            </Link>

            {/* Notification Bell Badge */}
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => { setShowNotifications(!showNotifications); setShowDropdown(false); }}
                className="btn btn-secondary btn-circle"
                style={{ 
                  width: '36px', 
                  height: '36px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  position: 'relative'
                }}
              >
                <Bell size={18} />
                {notifications.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-2px',
                    backgroundColor: 'var(--accent)',
                    color: 'white',
                    fontSize: '0.65rem',
                    fontWeight: 'bold',
                    borderRadius: '50%',
                    width: '16px',
                    height: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {notifications.length}
                  </div>
                )}
              </button>

              {/* Notifications Dropdown Panel */}
              {showNotifications && (
                <div 
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '110%',
                    backgroundColor: 'var(--bg-sidebar)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    width: '280px',
                    padding: '12px 0',
                    boxShadow: 'var(--shadow-md)',
                    display: 'flex',
                    flexDirection: 'column',
                    zIndex: 200,
                    maxHeight: '350px',
                    overflowY: 'auto'
                  }}
                  onMouseLeave={() => setShowNotifications(false)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 12px 8px 12px', borderBottom: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'white', fontFamily: 'Outfit' }}>Notifications</span>
                    {notifications.length > 0 && (
                      <button 
                        onClick={clearNotifications}
                        style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.75rem' }}
                      >
                        <Trash2 size={12} />
                        Clear
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {notifications.map(n => (
                      <Link 
                        key={n.id}
                        to={`/watch/${n.videoId}`}
                        onClick={() => setShowNotifications(false)}
                        style={{
                          padding: '10px 12px',
                          borderBottom: '1px solid rgba(255,255,255,0.03)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '2px',
                          transition: 'var(--transition)'
                        }}
                        className="dropdown-item"
                      >
                        <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'white' }}>{n.title}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{n.message}</span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', alignSelf: 'flex-end', marginTop: '2px' }}>
                          {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </Link>
                    ))}

                    {notifications.length === 0 && (
                      <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        No new notifications.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="profile-menu" onClick={() => { setShowDropdown(!showDropdown); setShowNotifications(false); }}>
              <img 
                src={user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80&q=80'} 
                alt={user.name} 
                style={{ 
                  width: '36px', 
                  height: '36px', 
                  borderRadius: '50%', 
                  objectFit: 'cover',
                  border: '2px solid var(--coffee-700)'
                }}
              />
              
              {showDropdown && (
                <div className="profile-menu-dropdown" onMouseLeave={() => setShowDropdown(false)}>
                  <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                    <p style={{ fontWeight: 'bold', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</p>
                    <p style={{ color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</p>
                  </div>

                  {user.channel ? (
                    <Link to={`/channel/${user.channel._id || user.channel}`} className="dropdown-item" onClick={() => setShowDropdown(false)}>
                      <Tv size={16} />
                      <span>My Studio</span>
                    </Link>
                  ) : (
                    <Link to="/channel/create" className="dropdown-item" onClick={() => setShowDropdown(false)}>
                      <Tv size={16} />
                      <span>Create Channel</span>
                    </Link>
                  )}

                  {/* Sync YouTube Subscriptions */}
                  <div className="dropdown-item" onClick={() => { triggerSyncSubscriptions(); setShowDropdown(false); }} style={{ cursor: 'pointer' }}>
                    <RefreshCw size={16} />
                    <span>Sync YouTube</span>
                  </div>

                  <div className="dropdown-item" onClick={() => { logout(); setShowDropdown(false); }} style={{ cursor: 'pointer', borderTop: '1px solid var(--border-color)' }}>
                    <LogOut size={16} style={{ color: 'var(--accent)' }} />
                    <span style={{ color: 'var(--accent)' }}>Sign Out</span>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          !isOfflineMode && <div id="google-signin-btn" className="google-signin-btn-container"></div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
