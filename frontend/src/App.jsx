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

  // Sprawdz czy user jest zalogowany przy starcie
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const data = await authAPI.getMe();
          setUser(data.user);
          
          // Zaladuj i zastosuj motyw uzytkownika
          await loadUserTheme(token);
        } catch (error) {
          // Token niewazny - usun
          localStorage.removeItem('token');
          // Zaladuj domyslny motyw dla niezalogowanych
          await loadDefaultTheme();
        }
      } else {
        // Uzytkownik niezalogowany - zaladuj domyslny motyw
        await loadDefaultTheme();
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const loadDefaultTheme = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/themes');
      const data = await response.json();
      
      // Znajdz motyw domyslny
      const defaultTheme = data.themes.find(t => t.is_default);
      if (defaultTheme) {
        applyTheme(defaultTheme);
      }
    } catch (error) {
      console.error('Failed to load default theme:', error);
    }
  };

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
    const root = document.documentElement;
    
    // Bazowe 3 kolory
    root.style.setProperty('--primary-color', theme.primary_color);
    root.style.setProperty('--secondary-color', theme.secondary_color);
    root.style.setProperty('--accent-color', theme.accent_color);
    
    // Wyliczone kolory ciemniejsze/jaśniejsze
    root.style.setProperty('--primary-dark', adjustColor(theme.primary_color, -20));
    root.style.setProperty('--primary-light', adjustColor(theme.primary_color, 40));
    root.style.setProperty('--secondary-dark', adjustColor(theme.secondary_color, -15));
    root.style.setProperty('--accent-light', adjustColor(theme.accent_color, 30));
    
    // Tła
    root.style.setProperty('--bg-cream', adjustColor(theme.accent_color, 70, 0.3)); // Bardzo jasny accent
    root.style.setProperty('--bg-light', adjustColor(theme.accent_color, 85, 0.2)); // Jeszcze jaśniejszy
    
    // Teksty
    root.style.setProperty('--text-color', adjustColor(theme.primary_color, -40));
    root.style.setProperty('--text-light', adjustColor(theme.secondary_color, 0));
    
    // Obramowania
    root.style.setProperty('--border-color', adjustColor(theme.accent_color, 20));
    
    // Cienie
    const shadowColor = hexToRgb(theme.primary_color);
    root.style.setProperty('--shadow-soft', `rgba(${shadowColor.r}, ${shadowColor.g}, ${shadowColor.b}, 0.08)`);
    
    // Gradienty
    root.style.setProperty('--theme-gradient-primary', `linear-gradient(135deg, ${theme.primary_color}, ${adjustColor(theme.primary_color, -20)})`);
    
    // Wymuś repaint przez toggle klasy
    document.body.classList.remove('theme-update');
    void document.body.offsetHeight; // Force reflow
    document.body.classList.add('theme-update');
  };

  // Funkcje pomocnicze do modyfikacji kolorów
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  };

  const rgbToHex = (r, g, b) => {
    return "#" + [r, g, b].map(x => {
      const hex = Math.max(0, Math.min(255, Math.round(x))).toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    }).join('');
  };

  const adjustColor = (hex, amount, saturationFactor = 1) => {
    const rgb = hexToRgb(hex);
    
    // Regulacja jasności
    let r = rgb.r + amount;
    let g = rgb.g + amount;
    let b = rgb.b + amount;
    
    // Regulacja saturacji (dla tła)
    if (saturationFactor < 1) {
      const gray = (r + g + b) / 3;
      r = gray + (r - gray) * saturationFactor;
      g = gray + (g - gray) * saturationFactor;
      b = gray + (b - gray) * saturationFactor;
    }
    
    return rgbToHex(r, g, b);
  };

  const handleLogout = async () => {
    authAPI.logout();
    setUser(null);
    
    // Zaladuj domyslny motyw po wylogowaniu
    await loadDefaultTheme();
    
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

