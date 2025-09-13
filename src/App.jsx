import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Berita from './pages/Berita';
import Pembayaran from './pages/Pembayaran';
import Keaktifan from './pages/Keaktifan';
import Santri from './pages/Santri';
import Login from './pages/Login';
import Register from './pages/Register';
import Chat from './pages/Chat';
import AdminChat from './pages/AdminChat';
import Profile from './pages/Profile';
import BeritaDetail from './pages/BeritaDetail';
import Users from './pages/Users';  // <<== tambahin ini
import './styles/App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/berita" element={<Berita />} />
              <Route path="/pembayaran" element={<Pembayaran />} />
              <Route path="/keaktifan" element={<Keaktifan />} />
              <Route path="/santri" element={<Santri />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/admin-chat" element={<AdminChat />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/berita/:id" element={<BeritaDetail />} />
              <Route path="/users" element={<Users />} />
              <Route path="/anggota" element={<Users />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
