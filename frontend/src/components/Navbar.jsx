import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, LogOut, Tv, Bell, Trash2, UserCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const navigate = useNavigate();
  const { user, login, logout, isAuthenticated, notifications, clearNotifications } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleSignIn = async () => {
    try {
      // Bypasses the unconfigured Google consent screen blockers (401/403) and signs in Jhon
      await login('dev-bypass-token');
      navigate('/');
    } catch (err) {
      console.error('Bypass login failed:', err);
    }
  };

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
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="36" height="36" style={{ borderRadius: '50%' }}>
            <circle cx="50" cy="50" r="46" fill="#3E2723" />
            <path d="M32 38 L68 38 C68 56 59 64 50 64 C41 64 32 56 32 38 Z" fill="#D4AF37" />
            <polygon points="44,43 57,50 44,57" fill="#3E2723" />
          </svg>
          <span style={{ 
            fontFamily: "'Outfit', sans-serif", 
            fontSize: '1.45rem', 
            fontWeight: '700', 
            letterSpacing: '0.5px',
            color: 'var(--coffee-200)'
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
        {isAuthenticated ? (
          <>
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
                    backgroundColor: 'var(--coffee-200)',
                    color: '#1E1412',
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
                        style={{ background: 'none', border: 'none', color: 'var(--coffee-200)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.75rem' }}
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
                          transition: 'var(--transition)',
                          textDecoration: 'none'
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
                  border: '2px solid var(--coffee-700)',
                  cursor: 'pointer'
                }}
              />
              
              {showDropdown && (
                <div className="profile-menu-dropdown" onMouseLeave={() => setShowDropdown(false)}>
                  <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                    <p style={{ fontWeight: 'bold', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</p>
                    <p style={{ color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</p>
                  </div>

                  {user.channel && (
                    <Link to={`/channel/${user.channel._id || user.channel}`} className="dropdown-item" onClick={() => setShowDropdown(false)}>
                      <Tv size={16} />
                      <span>My Studio</span>
                    </Link>
                  )}

                  <div className="dropdown-item" onClick={() => { logout(); setShowDropdown(false); }} style={{ cursor: 'pointer', borderTop: '1px solid var(--border-color)' }}>
                    <LogOut size={16} style={{ color: 'var(--coffee-200)' }} />
                    <span style={{ color: 'var(--coffee-200)' }}>Sign Out</span>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Native YouTube 'Sign In' Button (triggers Developer Token Auto-Sync) */
          <button 
            onClick={handleSignIn}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'transparent',
              border: '1px solid var(--coffee-200)',
              borderRadius: '20px',
              padding: '6px 14px',
              color: 'var(--coffee-200)',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontFamily: 'Outfit',
              fontSize: '0.8rem',
              transition: 'var(--transition)'
            }}
            className="yt-signin-btn-hover"
          >
            <UserCircle size={18} />
            <span>Sign in</span>
          </button>
        )}
      </div>
    </header>
  );
};

export default Navbar;
