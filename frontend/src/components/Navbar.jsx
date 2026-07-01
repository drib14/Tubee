import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, Upload, LogOut, User, Wifi, WifiOff, Tv } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const navigate = useNavigate();
  const { user, login, logout, isOfflineMode, toggleOfflineMode, isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  // Initialize Google Login Button
  useEffect(() => {
    /* global google */
    if (isOfflineMode) return; // Do not boot Google API in offline mode

    const initializeGoogleSignIn = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: '736056421227-toir94rjlenl2oots2ifttbrgp1nroe7.apps.googleusercontent.com',
          callback: async (response) => {
            try {
              await login(response.credential);
              navigate('/');
            } catch (err) {
              console.error('Google OAuth failed on server:', err);
              alert('OAuth authentication failed. Check console.');
            }
          }
        });

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

    // Retry a few times if google script hasn't loaded yet
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
          placeholder={isOfflineMode ? "Searching offline downloads..." : "Search custom uploads & YouTube..."}
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

            <div className="profile-menu" onClick={() => setShowDropdown(!showDropdown)}>
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
                      <span>My Channel</span>
                    </Link>
                  ) : (
                    <Link to="/channel/create" className="dropdown-item" onClick={() => setShowDropdown(false)}>
                      <Tv size={16} />
                      <span>Create Channel</span>
                    </Link>
                  )}

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
