import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Components
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

// Pages
import Home from './pages/Home';
import VideoPage from './pages/VideoPage';
import SearchPage from './pages/SearchPage';
import ChannelPage from './pages/ChannelPage';
import LibraryPage from './pages/LibraryPage';
import ShortsPage from './pages/ShortsPage';

const Layout = ({ children }) => {
  return (
    <div className="app-container">
      <Navbar />
      <Sidebar />
      <main className="app-main">{children}</main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shorts" element={<ShortsPage />} />
            <Route path="/watch/:id" element={<VideoPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/channel/:idOrHandle" element={<ChannelPage />} />
            <Route path="/library" element={<LibraryPage />} />
            <Route path="/history" element={<LibraryPage />} />
            <Route path="/watch-later" element={<LibraryPage />} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}

export default App;
