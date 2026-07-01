import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { WifiOff } from 'lucide-react';

// Context & State
import { AuthProvider, useAuth } from './context/AuthContext';

// Components
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

// Pages
import Home from './pages/Home';
import VideoPage from './pages/VideoPage';
import SearchPage from './pages/SearchPage';
import ChannelPage from './pages/ChannelPage';
import LibraryPage from './pages/LibraryPage';

const Layout = () => {
  return (
    <div className="app-container">
      {/* Header */}
      <Navbar />

      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Container */}
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/watch/:id" element={<VideoPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/liked-videos" element={<LibraryPage />} />
          <Route path="/channel/:id" element={<ChannelPage />} />
        </Routes>
      </main>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <Layout />
      </AuthProvider>
    </Router>
  );
};

export default App;
