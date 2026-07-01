import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Clock, History, Download, Tv, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { isAuthenticated, user, isOfflineMode } = useAuth();

  return (
    <aside className="app-sidebar">
      {/* Primary Links */}
      <NavLink 
        to="/" 
        className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
      >
        <Home size={18} />
        <span>Home</span>
      </NavLink>

      {/* Downloads / Offline list */}
      <NavLink 
        to="/downloads" 
        className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
      >
        <Download size={18} />
        <span>Downloads</span>
      </NavLink>

      {/* Auth Protected Links */}
      {!isOfflineMode && isAuthenticated && (
        <>
          <div style={{ 
            height: '1px', 
            backgroundColor: 'var(--border-color)', 
            margin: '8px 16px' 
          }} />
          
          <NavLink 
            to="/watch-later" 
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Clock size={18} />
            <span>Watch Later</span>
          </NavLink>

          <NavLink 
            to="/history" 
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <History size={18} />
            <span>History</span>
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
        </>
      )}
    </aside>
  );
};

export default Sidebar;
