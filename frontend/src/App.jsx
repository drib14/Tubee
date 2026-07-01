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
import DownloadsPage from './pages/DownloadsPage';
import CreateChannel from './pages/CreateChannel';
import ChannelPage from './pages/ChannelPage';
import UploadVideo from './pages/UploadVideo';
import PaymentSuccess from './pages/PaymentSuccess';

const Layout = () => {
  const { isOfflineMode } = useAuth();

  return (
    <div className="app-container">
      {/* Offline Alert Banner */}
      {isOfflineMode && (
        <div className="offline-banner" style={{ gridColumn: 'span 2' }}>
          <WifiOff size={16} />
          <span>Simulated Offline Mode Active — Watching from local IndexedDB cache</span>
        </div>
      )}

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
          <Route path="/downloads" element={<DownloadsPage />} />
          <Route path="/channel/create" element={<CreateChannel />} />
          <Route path="/channel/:id" element={<ChannelPage />} />
          <Route path="/upload" element={<UploadVideo />} />
          <Route path="/payment/success" element={<PaymentSuccess />} />
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
