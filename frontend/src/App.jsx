import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { authAPI } from './services/api';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Products from './pages/Products';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AuthCallback from './pages/AuthCallback';
import './style.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sprawdź czy user jest zalogowany przy starcie
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const data = await authAPI.getMe();
          setUser(data.user);
          
          // Załaduj i zastosuj motyw użytkownika
          loadUserTheme(token);
        } catch (error) {
          // Token nieważny - usuń
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const loadUserTheme = async (token) => {
    try {
      const response = await fetch('http://localhost:3001/api/themes/my', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.theme) {
        applyTheme(data.theme);
      }
    } catch (error) {
      console.error('Failed to load user theme:', error);
    }
  };

  const applyTheme = (theme) => {
    document.documentElement.style.setProperty('--primary-color', theme.primary_color);
    document.documentElement.style.setProperty('--secondary-color', theme.secondary_color);
    document.documentElement.style.setProperty('--accent-color', theme.accent_color);
  };

  const handleLogout = () => {
    authAPI.logout();
    setUser(null);
    window.location.href = '/';
  };

  if (loading) {
    return <div>Ładowanie...</div>;
  }

  return (
    <BrowserRouter>
      <div>
        <Navbar user={user} onLogout={handleLogout} />
        
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/login" element={<Login setUser={setUser} />} />
          <Route path="/register" element={<Register setUser={setUser} />} />
          <Route path="/dashboard" element={<Dashboard user={user} />} />
          <Route path="/auth/callback" element={<AuthCallback setUser={setUser} />} />
        </Routes>

        <footer className="footer">
          <div className="container">
            <p>&copy; 2025 MadeByU. Wszystkie prawa zastrzeżone.</p>
            <div className="footer-links">
              <a href="/about">O nas</a>
              <a href="/contact">Kontakt</a>
              <a href="/terms">Regulamin</a>
            </div>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}

export default App;

