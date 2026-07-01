import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Clock, History, Tv, ChevronDown, ChevronUp, Flame, Library, Film } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { isAuthenticated } = useAuth();
  const [isSubsCollapsed, setIsSubsCollapsed] = useState(false);
  const [subscribedChannels, setSubscribedChannels] = useState([]);

  useEffect(() => {
    const loadSubs = () => {
      const list = JSON.parse(localStorage.getItem('subscribedChannels') || '[]');
      setSubscribedChannels(list);
    };

    loadSubs();
    window.addEventListener('subscribe-change', loadSubs);
    return () => window.removeEventListener('subscribe-change', loadSubs);
  }, []);

  const visibleSubs = isSubsCollapsed ? subscribedChannels.slice(0, 3) : subscribedChannels.slice(0, 8);

  return (
    <aside className="app-sidebar">
      {/* 1. PUBLIC LINKS */}
      <NavLink 
        to="/" 
        className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
      >
        <Home size={18} />
        <span>Home</span>
      </NavLink>

      <NavLink 
        to="/shorts" 
        className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
      >
        <Film size={18} />
        <span>Shorts</span>
      </NavLink>

      <NavLink 
        to="/search?q=trending" 
        className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
      >
        <Flame size={18} />
        <span>Trending</span>
      </NavLink>

      {/* 2. PRIVATE LOGGED IN NAVIGATIONS */}
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

          {/* Subscriptions segments */}
          {subscribedChannels.length > 0 && (
            <>
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
                </div>
              </div>
            </>
          )}
        </>
      )}
    </aside>
  );
};

export default Sidebar;
