import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Clock, History, Download, Tv, ChevronDown, ChevronUp, Compass, Flame, Music, Gamepad2, Trophy, FolderHeart, Library, PlaySquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { isAuthenticated, user, isOfflineMode } = useAuth();
  
  // Subscription sidebar states
  const [isSubsCollapsed, setIsSubsCollapsed] = useState(false);
  const [subscribedChannels, setSubscribedChannels] = useState([]);

  // Load subscriptions dynamically
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const loadSubs = () => {
      const list = JSON.parse(localStorage.getItem('subscribedChannels') || '[]');
      setSubscribedChannels(list);
    };

    loadSubs();
    window.addEventListener('subscribe-change', loadSubs);
    return () => window.removeEventListener('subscribe-change', loadSubs);
  }, [isAuthenticated]);

  const visibleSubs = isSubsCollapsed ? subscribedChannels.slice(0, 3) : subscribedChannels.slice(0, 8);

  return (
    <aside className="app-sidebar">
      {/* 1. PUBLIC GENERAL LINKS */}
      <NavLink 
        to="/" 
        className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
      >
        <Home size={18} />
        <span>Home</span>
      </NavLink>

      {!isOfflineMode && (
        <>
          <NavLink 
            to="/search?q=shorts" 
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <PlaySquare size={18} />
            <span>Shorts</span>
          </NavLink>

          <NavLink 
            to="/search?q=trending" 
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Flame size={18} />
            <span>Trending</span>
          </NavLink>
        </>
      )}

      {/* 2. LOGGED IN PRIVATE NAVIGATION */}
      {isAuthenticated && (
        <>
          <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '8px 16px' }} />
          
          <NavLink 
            to="/library" 
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Library size={18} />
            <span>Library</span>
          </NavLink>

          <NavLink 
            to="/history" 
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <History size={18} />
            <span>History</span>
          </NavLink>

          <NavLink 
            to="/watch-later" 
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Clock size={18} />
            <span>Watch Later</span>
          </NavLink>

          <NavLink 
            to="/liked-videos" 
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <FolderHeart size={18} />
            <span>Liked Videos</span>
          </NavLink>

          <NavLink 
            to="/downloads" 
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Download size={18} />
            <span>Downloads</span>
          </NavLink>

          {user?.channel && (
            <NavLink 
              to={`/channel/${user.channel._id || user.channel}`} 
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Tv size={18} />
              <span>My Studio</span>
            </NavLink>
          )}

          {/* Subscriptions Segment */}
          <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '8px 16px' }} />
          
          <div style={{ padding: '4px 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button 
              onClick={() => setIsSubsCollapsed(!isSubsCollapsed)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontFamily: 'Outfit',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                fontWeight: 'bold',
                padding: '4px 0'
              }}
            >
              <span>Subscriptions</span>
              {isSubsCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </button>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
              {visibleSubs.map(ch => (
                <NavLink 
                  key={ch._id}
                  to={`/channel/${ch._id}`} 
                  className="sidebar-link"
                  style={{ padding: '6px 0px', gap: '10px', fontSize: '0.85rem' }}
                >
                  <img 
                    src={ch.avatar} 
                    alt={ch.name} 
                    style={{ width: '22px', height: '22px', borderRadius: '50%', objectFit: 'cover' }} 
                  />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '120px' }}>
                    {ch.name}
                  </span>
                </NavLink>
              ))}
              
              {subscribedChannels.length > 8 && (
                <button
                  onClick={() => setIsSubsCollapsed(!isSubsCollapsed)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--coffee-200)',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    textAlign: 'left',
                    marginTop: '4px',
                    fontWeight: 'bold'
                  }}
                >
                  {isSubsCollapsed ? 'View More' : 'Show Less'}
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {/* 3. EXPLORE CATEGORIES SECTION (Online Only) */}
      {!isOfflineMode && (
        <>
          <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '8px 16px' }} />
          
          <div style={{ padding: '4px 16px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'Outfit', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Explore
            </span>
          </div>

          <NavLink 
            to="/search?q=music" 
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Music size={18} />
            <span>Music</span>
          </NavLink>

          <NavLink 
            to="/search?q=gaming" 
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Gamepad2 size={18} />
            <span>Gaming</span>
          </NavLink>

          <NavLink 
            to="/search?q=sports" 
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Trophy size={18} />
            <span>Sports</span>
          </NavLink>
        </>
      )}
    </aside>
  );
};

export default Sidebar;
