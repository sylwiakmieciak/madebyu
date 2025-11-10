import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../dashboard.css';

export default function Dashboard({ user }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [themes, setThemes] = useState([]);
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [newTheme, setNewTheme] = useState({
    name: '',
    primary_color: '#8b6f47',
    secondary_color: '#a0826d',
    accent_color: '#c9a882'
  });

  useEffect(() => {
    if (user) {
      loadThemes();
      loadUserTheme();
    }
  }, [user]);

  useEffect(() => {
    // Zastosuj kolory aktualnego motywu po załadowaniu
    if (selectedTheme) {
      applyTheme(selectedTheme);
    }
  }, [selectedTheme]);

  const loadThemes = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/themes');
      const data = await response.json();
      setThemes(data.themes);
    } catch (error) {
      console.error('Failed to load themes:', error);
    }
  };

  const loadUserTheme = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/themes/my', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setSelectedTheme(data.theme);
    } catch (error) {
      console.error('Failed to load user theme:', error);
    }
  };

  const selectTheme = async (themeId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/themes/select', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ theme_id: themeId })
      });

      if (response.ok) {
        await loadUserTheme();
        // Zastosuj kolory na żywo
        const theme = themes.find(t => t.id === themeId);
        if (theme) {
          applyTheme(theme);
        }
      }
    } catch (error) {
      console.error('Failed to select theme:', error);
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

  const createTheme = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/themes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newTheme)
      });

      if (response.ok) {
        await loadThemes();
        setNewTheme({
          name: '',
          primary_color: '#8b6f47',
          secondary_color: '#a0826d',
          accent_color: '#c9a882'
        });
      }
    } catch (error) {
      console.error('Failed to create theme:', error);
    }
  };

  const setDefaultTheme = async (themeId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/themes/${themeId}/default`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        await loadThemes();
      }
    } catch (error) {
      console.error('Failed to set default theme:', error);
    }
  };

  const deleteTheme = async (themeId) => {
    if (!confirm('Czy na pewno chcesz usunąć ten motyw?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/themes/${themeId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        await loadThemes();
      }
    } catch (error) {
      console.error('Failed to delete theme:', error);
    }
  };
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p>Musisz być zalogowany aby zobaczyć dashboard</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '3rem 1rem' }}>
      {/* Tabs */}
      <div className="dashboard-tabs">
        <button
          onClick={() => setActiveTab('overview')}
          className={`dashboard-tab ${activeTab === 'overview' ? 'active' : ''}`}
        >
          Przegląd
        </button>
        <button
          onClick={() => setActiveTab('theme')}
          className={`dashboard-tab ${activeTab === 'theme' ? 'active' : ''}`}
        >
          Wybór Motywu
        </button>
        {user.role === 'admin' && (
          <button
            onClick={() => setActiveTab('admin')}
            className={`dashboard-tab ${activeTab === 'admin' ? 'active' : ''}`}
          >
            Panel Admina
          </button>
        )}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Moje produkty</h3>
            <p>0</p>
          </div>
          <div className="stat-card">
            <h3>Zamówienia</h3>
            <p>0</p>
          </div>
          <div className="stat-card">
            <h3>Ulubione</h3>
            <p>0</p>
          </div>
        </div>
      )}

      {/* Theme Selection Tab */}
      {activeTab === 'theme' && (
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '1.5rem' }}>Wybierz Motyw</h2>
          {selectedTheme && (
            <div className="theme-current">
              <p style={{ fontWeight: 600, marginBottom: '0.75rem' }}>Aktualny motyw: {selectedTheme.name}</p>
              <div className="theme-colors">
                <div 
                  className="theme-color-box"
                  style={{ backgroundColor: selectedTheme.primary_color }}
                  title="Primary"
                ></div>
                <div 
                  className="theme-color-box"
                  style={{ backgroundColor: selectedTheme.secondary_color }}
                  title="Secondary"
                ></div>
                <div 
                  className="theme-color-box"
                  style={{ backgroundColor: selectedTheme.accent_color }}
                  title="Accent"
                ></div>
              </div>
            </div>
          )}

          <div className="theme-grid">
            {themes.map(theme => (
              <div key={theme.id} className="theme-card">
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h3 className="theme-name">{theme.name}</h3>
                  {theme.is_default && <span className="theme-badge">Domyślny</span>}
                </div>
                
                <div className="theme-colors">
                  <div 
                    className="theme-color-box"
                    style={{ backgroundColor: theme.primary_color }}
                  ></div>
                  <div 
                    className="theme-color-box"
                    style={{ backgroundColor: theme.secondary_color }}
                  ></div>
                  <div 
                    className="theme-color-box"
                    style={{ backgroundColor: theme.accent_color }}
                  ></div>
                </div>

                <button
                  onClick={() => selectTheme(theme.id)}
                  className="btn btn-full"
                  disabled={selectedTheme?.id === theme.id}
                  style={{ marginTop: '1rem' }}
                >
                  {selectedTheme?.id === theme.id ? 'Wybrany' : 'Wybierz'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Admin Panel Tab */}
      {activeTab === 'admin' && user.role === 'admin' && (
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '1.5rem' }}>Panel Admina - Zarządzanie Motywami</h2>

          {/* Create Theme Form */}
          <div className="form-section">
            <h3>Stwórz Nowy Motyw</h3>
            <form onSubmit={createTheme}>
              <div className="form-group">
                <label>Nazwa motywu</label>
                <input
                  type="text"
                  value={newTheme.name}
                  onChange={e => setNewTheme({...newTheme, name: e.target.value})}
                  required
                />
              </div>

              <div className="color-inputs">
                <div className="form-group">
                  <label>Kolor Główny</label>
                  <input
                    type="color"
                    value={newTheme.primary_color}
                    onChange={e => setNewTheme({...newTheme, primary_color: e.target.value})}
                  />
                  <input
                    type="text"
                    value={newTheme.primary_color}
                    onChange={e => setNewTheme({...newTheme, primary_color: e.target.value})}
                    style={{ marginTop: '0.5rem' }}
                  />
                </div>

                <div className="form-group">
                  <label>Kolor Drugorzędny</label>
                  <input
                    type="color"
                    value={newTheme.secondary_color}
                    onChange={e => setNewTheme({...newTheme, secondary_color: e.target.value})}
                  />
                  <input
                    type="text"
                    value={newTheme.secondary_color}
                    onChange={e => setNewTheme({...newTheme, secondary_color: e.target.value})}
                    style={{ marginTop: '0.5rem' }}
                  />
                </div>

                <div className="form-group">
                  <label>Kolor Akcentu</label>
                  <input
                    type="color"
                    value={newTheme.accent_color}
                    onChange={e => setNewTheme({...newTheme, accent_color: e.target.value})}
                  />
                  <input
                    type="text"
                    value={newTheme.accent_color}
                    onChange={e => setNewTheme({...newTheme, accent_color: e.target.value})}
                    style={{ marginTop: '0.5rem' }}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-full" style={{ marginTop: '1.5rem' }}>
                Stwórz Motyw
              </button>
            </form>
          </div>

          {/* Theme List */}
          <div className="theme-list">
            <h3 style={{ marginBottom: '1.5rem' }}>Wszystkie Motywy</h3>
            {themes.map(theme => (
              <div key={theme.id} className="theme-list-item">
                <div className="theme-info">
                  <div className="theme-colors">
                    <div 
                      className="theme-color-box"
                      style={{ backgroundColor: theme.primary_color }}
                    ></div>
                    <div 
                      className="theme-color-box"
                      style={{ backgroundColor: theme.secondary_color }}
                    ></div>
                    <div 
                      className="theme-color-box"
                      style={{ backgroundColor: theme.accent_color }}
                    ></div>
                  </div>
                  <div>
                    <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{theme.name}</p>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>{theme.slug}</p>
                  </div>
                  {theme.is_default && (
                    <span className="theme-badge">Domyślny</span>
                  )}
                </div>

                <div className="theme-actions">
                  {!theme.is_default && (
                    <>
                      <button
                        onClick={() => setDefaultTheme(theme.id)}
                        className="btn-success"
                      >
                        Ustaw jako domyślny
                      </button>
                      <button
                        onClick={() => deleteTheme(theme.id)}
                        className="btn-danger"
                      >
                        Usuń
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
