import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../dashboard.css';

export default function Dashboard({ user }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [themes, setThemes] = useState([]);
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [products, setProducts] = useState([]);
  const [newTheme, setNewTheme] = useState({
    name: '',
    primary_color: '#8b6f47',
    secondary_color: '#a0826d',
    accent_color: '#c9a882'
  });
  const [profileData, setProfileData] = useState({
    username: user?.username || '',
    full_name: user?.full_name || '',
    bio: user?.bio || '',
    avatar_url: user?.avatar_url || '',
    greeting: user?.greeting || 'Witaj na moim profilu! 👋'
  });
  const [profileMessage, setProfileMessage] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  useEffect(() => {
    if (user) {
      loadThemes();
      loadUserTheme();
      loadMyProducts();
      loadArchivedProducts();
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

  const loadMyProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/products/my', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  const [archivedProducts, setArchivedProducts] = useState([]);
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [productToRestore, setProductToRestore] = useState(null);
  const [newStock, setNewStock] = useState('');

  const loadArchivedProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/products/my', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setArchivedProducts((data.products || []).filter(p => p.status === 'archived'));
    } catch (error) {
      console.error('Failed to load archived products:', error);
    }
  };

  const handleRestoreClick = (product) => {
    setProductToRestore(product);
    setNewStock('');
    setRestoreModalOpen(true);
  };

  const handleRestoreProduct = async () => {
    if (!newStock || parseInt(newStock) < 1) {
      alert('Podaj prawidłową ilość sztuk (minimum 1)');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/products/${productToRestore.id}/restore`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ stock_quantity: parseInt(newStock) })
      });

      if (response.ok) {
        alert('Produkt przywrócony pomyślnie!');
        setRestoreModalOpen(false);
        setProductToRestore(null);
        setNewStock('');
        loadMyProducts();
        loadArchivedProducts();
      } else {
        const data = await response.json();
        alert(data.error || 'Nie udało się przywrócić produktu');
      }
    } catch (error) {
      console.error('Failed to restore product:', error);
      alert('Wystąpił błąd połączenia');
    }
  };

  const handleDeleteProduct = async (productId, productTitle) => {
    if (!confirm(`Czy na pewno chcesz usunąć produkt "${productTitle}"?\n\nTa operacja jest nieodwracalna.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/products/${productId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        alert('Produkt został usunięty');
        loadMyProducts();
        loadArchivedProducts();
      } else {
        const data = await response.json();
        alert(data.error || 'Nie udało się usunąć produktu');
      }
    } catch (error) {
      console.error('Failed to delete product:', error);
      alert('Wystąpił błąd połączenia');
    }
  };

  const toggleFeatured = async (productId, e) => {
    e.stopPropagation(); // Prevent navigation to product page
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/products/${productId}/featured`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        // Reload products to get updated featured status
        loadMyProducts();
      } else {
        const data = await response.json();
        alert(data.error || 'Nie udało się zmienić statusu');
      }
    } catch (error) {
      console.error('Failed to toggle featured:', error);
      alert('Wystąpił błąd');
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setProfileMessage('❌ Plik jest za duży. Maksymalny rozmiar to 5MB.');
        return;
      }
      
      setAvatarFile(file);
      
      // Podgląd
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const updateProfile = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      
      // Jeśli jest nowe zdjęcie, najpierw je wyślij
      let newAvatarUrl = profileData.avatar_url;
      if (avatarFile) {
        const formData = new FormData();
        formData.append('avatar', avatarFile);
        
        const uploadResponse = await fetch('http://localhost:3001/api/auth/upload-avatar', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: formData
        });
        
        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          newAvatarUrl = uploadData.avatar_url;
        } else {
          setProfileMessage('❌ Nie udało się przesłać zdjęcia');
          return;
        }
      }
      
      // Aktualizuj profil
      const response = await fetch('http://localhost:3001/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...profileData,
          avatar_url: newAvatarUrl
        })
      });
      
      const data = await response.json();
      if (response.ok) {
        setProfileMessage('✅ Profil zaktualizowany pomyślnie!');
        setTimeout(() => setProfileMessage(''), 3000);
        setIsEditMode(false);
        setAvatarFile(null);
        setAvatarPreview(null);
        // Odśwież dane użytkownika
        window.location.reload();
      } else {
        setProfileMessage('❌ ' + (data.error || 'Błąd aktualizacji profilu'));
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      setProfileMessage('❌ Błąd połączenia z serwerem');
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
    
    // Sprawdź czy to motyw świąteczny i wyślij event
    const isChristmas = theme.name?.toLowerCase().includes('świąteczny') || 
                       theme.name?.toLowerCase().includes('christmas');
    window.dispatchEvent(new CustomEvent('themeChanged', { 
      detail: { isChristmas } 
    }));
    
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
    
    // Kolor sukcesu (dla kategorii finalnych) - wyliczony z primary
    root.style.setProperty('--success-color', adjustColor(theme.primary_color, 0, 1.2)); // Lekko bardziej żywy
    
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
    console.log('=== CREATE THEME (Frontend) ===');
    console.log('Theme data:', newTheme);
    
    try {
      const token = localStorage.getItem('token');
      console.log('Token exists:', !!token);
      
      const response = await fetch('http://localhost:3001/api/themes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newTheme)
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (response.ok) {
        console.log('[OK] Theme created successfully');
        await loadThemes();
        setNewTheme({
          name: '',
          primary_color: '#8b6f47',
          secondary_color: '#a0826d',
          accent_color: '#c9a882'
        });
      } else {
        console.error('[ERROR] Failed:', data);
      }
    } catch (error) {
      console.error('[ERROR] Create theme error:', error);
    }
  };

  const setDefaultTheme = async (themeId) => {
    console.log('=== SET DEFAULT THEME (Frontend) ===');
    console.log('Theme ID:', themeId);
    
    try {
      const token = localStorage.getItem('token');
      console.log('Token exists:', !!token);
      
      const response = await fetch(`http://localhost:3001/api/themes/${themeId}/default`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (response.ok) {
        console.log('[OK] Default theme set successfully');
        
        // Przeladuj liste motywow (zaktualizuje badge "Domyslny")
        await loadThemes();
        
        // NIE zmieniaj motywu uzytkownika - pozostaw jego osobisty wybor
        // Admin ma swoj wybrany motyw, zmiana domyslnego nie powinna go dotyczyc
        
      } else {
        console.error('[ERROR] Failed:', data);
      }
    } catch (error) {
      console.error('[ERROR] Set default theme error:', error);
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
          onClick={() => setActiveTab('profile')}
          className={`dashboard-tab ${activeTab === 'profile' ? 'active' : ''}`}
        >
          Moje dane
        </button>
        <button
          onClick={() => setActiveTab('archive')}
          className={`dashboard-tab ${activeTab === 'archive' ? 'active' : ''}`}
        >
          Archiwum ({archivedProducts.length})
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
        <div>
          <div className="stats-grid" style={{ marginBottom: '2rem' }}>
            <div className="stat-card">
              <h3>Moje produkty</h3>
              <p style={{ fontSize: '2rem', fontWeight: 700 }}>{products.length}</p>
            </div>
            <div className="stat-card">
              <h3>Opublikowane</h3>
              <p style={{ fontSize: '2rem', fontWeight: 700 }}>
                {products.filter(p => p.status === 'published').length}
              </p>
            </div>
            <div className="stat-card">
              <h3>Zarchiwizowane</h3>
              <p style={{ fontSize: '2rem', fontWeight: 700 }}>
                {products.filter(p => p.status === 'archived').length}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Twoje produkty</h2>
            <Link
              to="/add-product"
              className="btn"
              style={{ textDecoration: 'none' }}
            >
              + Dodaj produkt
            </Link>
          </div>

          {products.length === 0 ? (
            <div style={{
              padding: '3rem',
              textAlign: 'center',
              backgroundColor: 'var(--bg-cream)',
              borderRadius: '8px'
            }}>
              <p style={{ marginBottom: '1rem', color: 'var(--text-light)' }}>
                Nie masz jeszcze zadnych produktow
              </p>
              <Link to="/add-product" className="btn">
                Dodaj pierwszy produkt
              </Link>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1.5rem'
            }}>
              {products.map(product => (
                <div
                  key={product.id}
                  style={{
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                  }}
                  onClick={() => navigate(`/product/${product.id}`)}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 16px var(--shadow-soft)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {product.images && product.images[0] && (
                    <div style={{
                      width: '100%',
                      height: '200px',
                      backgroundColor: 'var(--bg-cream)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <img
                        src={product.images[0].image_url.startsWith('http') 
                          ? product.images[0].image_url 
                          : `http://localhost:3001${product.images[0].image_url}`}
                        alt={product.title}
                        style={{
                          maxWidth: '100%',
                          maxHeight: '100%',
                          objectFit: 'cover'
                        }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = '<span style="color: var(--text-light)">Brak zdjecia</span>';
                        }}
                      />
                    </div>
                  )}
                  <div style={{ padding: '1rem' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                      {product.title}
                    </h3>
                    <p style={{ color: 'var(--text-light)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                      {product.category.name}
                    </p>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.75rem'
                    }}>
                      <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary-color)' }}>
                        {product.price} PLN
                      </span>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '4px',
                        fontSize: '0.875rem',
                        backgroundColor: product.status === 'published' ? '#d1fae5' : '#fee2e2',
                        color: product.status === 'published' ? '#065f46' : '#991b1b'
                      }}>
                        {product.status === 'published' ? 'Opublikowane' : 'Archiwum'}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>
                      Dostepne: {product.stock_quantity} szt.
                    </p>
                    
                    <div style={{ 
                      marginTop: '1rem',
                      display: 'flex',
                      gap: '0.5rem'
                    }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProduct(product.id, product.title);
                        }}
                        style={{
                          flex: 1,
                          padding: '0.5rem',
                          backgroundColor: '#fee2e2',
                          border: '2px solid #fecaca',
                          borderRadius: '6px',
                          color: '#991b1b',
                          fontWeight: 600,
                          fontSize: '0.875rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = '#fecaca';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = '#fee2e2';
                        }}
                      >
                        🗑️ Usuń
                      </button>
                    </div>

                    {user.role === 'admin' && (
                      <button
                        type="button"
                        onClick={(e) => toggleFeatured(product.id, e)}
                        style={{
                          marginTop: '0.75rem',
                          width: '100%',
                          padding: '0.5rem',
                          backgroundColor: product.is_featured ? '#fbbf24' : 'var(--bg-cream)',
                          border: product.is_featured ? '2px solid #f59e0b' : '2px solid var(--border-color)',
                          borderRadius: '6px',
                          color: product.is_featured ? '#92400e' : 'var(--text-primary)',
                          fontWeight: 600,
                          fontSize: '0.875rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.transform = 'scale(1.02)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      >
                        {product.is_featured ? '⭐ Wybór redakcji' : '☆ Dodaj do wyborów redakcji'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '2rem' 
          }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0 }}>Moje dane</h2>
            {!isEditMode && (
              <button
                onClick={() => setIsEditMode(true)}
                className="btn"
                style={{
                  padding: '0.75rem 1.5rem',
                  fontSize: '1rem'
                }}
              >
                ✏️ Edytuj profil
              </button>
            )}
          </div>
          
          {profileMessage && (
            <div style={{
              padding: '1rem',
              marginBottom: '1.5rem',
              borderRadius: '8px',
              backgroundColor: profileMessage.includes('✅') ? '#d4edda' : '#f8d7da',
              color: profileMessage.includes('✅') ? '#155724' : '#721c24',
              border: `1px solid ${profileMessage.includes('✅') ? '#c3e6cb' : '#f5c6cb'}`
            }}>
              {profileMessage}
            </div>
          )}

          <div style={{
            maxWidth: '800px',
            margin: '0 auto',
            backgroundColor: 'white',
            padding: '3rem',
            borderRadius: '16px',
            border: '1px solid var(--border-color)',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15), 0 4px 16px rgba(0, 0, 0, 0.1)'
          }}>
            {/* Avatar Section - z oceną i powitaniem obok */}
            <div style={{ 
              display: 'flex',
              gap: '2.5rem',
              marginBottom: '3rem',
              paddingBottom: '2.5rem',
              borderBottom: '1px solid var(--border-color)',
              alignItems: 'start'
            }}>
              {/* Avatar */}
              <div style={{ flexShrink: 0, textAlign: 'center' }}>
                {avatarPreview || profileData.avatar_url || user?.avatar_url ? (
                  <img 
                    src={avatarPreview || profileData.avatar_url || user?.avatar_url} 
                    alt="Profil" 
                    style={{
                      width: '180px',
                      height: '180px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '4px solid var(--primary-color)',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)'
                    }}
                  />
                ) : (
                  <div style={{
                    width: '180px',
                    height: '180px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--primary-color), var(--accent-color))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '5rem',
                    color: 'white',
                    fontWeight: 700,
                    border: '4px solid var(--primary-color)',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)'
                  }}>
                    {user?.username?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
                
                {isEditMode && (
                  <div style={{ marginTop: '1.5rem' }}>
                    <label 
                      htmlFor="avatar-upload"
                      style={{ 
                        display: 'inline-block',
                        padding: '0.75rem 1.5rem',
                        backgroundColor: 'var(--primary-color)',
                        color: 'white',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 600,
                        transition: 'all 0.2s',
                        border: '2px solid var(--primary-color)'
                      }}
                      onMouseOver={(e) => e.target.style.backgroundColor = 'var(--primary-dark)'}
                      onMouseOut={(e) => e.target.style.backgroundColor = 'var(--primary-color)'}
                    >
                      📷 Wybierz zdjęcie
                    </label>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      style={{ display: 'none' }}
                    />
                    {avatarFile && (
                      <p style={{ 
                        marginTop: '0.5rem', 
                        fontSize: '0.9rem', 
                        color: 'var(--success-color)',
                        fontWeight: 500
                      }}>
                        ✓ {avatarFile.name}
                      </p>
                    )}
                    <p style={{ 
                      marginTop: '0.5rem', 
                      fontSize: '0.85rem', 
                      color: 'var(--text-light)' 
                    }}>
                      Maksymalny rozmiar: 5MB
                    </p>
                  </div>
                )}
              </div>

              {/* Ocena i Powitanie obok */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Ocena */}
                <div style={{
                  padding: '1.25rem',
                  backgroundColor: 'var(--bg-cream)',
                  borderRadius: '10px',
                  border: '1px solid var(--accent-color)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-light)' }}>
                      Ocena
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.8rem' }}>⭐⭐⭐⭐⭐</span>
                    <div>
                      <span style={{ fontSize: '1.5rem', color: 'var(--text-color)', fontWeight: 700 }}>
                        5.0
                      </span>
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-light)', marginLeft: '0.5rem' }}>
                        (brak ocen)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Powitanie */}
                {isEditMode ? (
                  <div style={{
                    padding: '1.25rem',
                    backgroundColor: 'var(--bg-light)',
                    borderRadius: '10px'
                  }}>
                    <label style={{ 
                      display: 'block',
                      marginBottom: '0.75rem',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      color: 'var(--text-light)'
                    }}>
                      Powitanie
                    </label>
                    <textarea
                      value={profileData.greeting}
                      onChange={(e) => setProfileData({...profileData, greeting: e.target.value})}
                      rows="3"
                      placeholder="Witaj na moim profilu! 👋"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid var(--border-color)',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        fontFamily: 'inherit',
                        resize: 'vertical'
                      }}
                    />
                  </div>
                ) : (
                  <div style={{
                    padding: '1.5rem',
                    backgroundColor: 'var(--bg-light)',
                    borderRadius: '10px',
                    fontSize: '1.1rem',
                    color: 'var(--text-color)',
                    fontStyle: 'italic',
                    lineHeight: '1.6'
                  }}>
                    {user?.greeting || 'Witaj na moim profilu! 👋'}
                  </div>
                )}
              </div>
            </div>

            {isEditMode ? (
              /* TRYB EDYCJI */
              <form onSubmit={updateProfile}>
                {/* Email (tylko do odczytu) */}
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: '180px 1fr',
                  gap: '1.5rem',
                  alignItems: 'center',
                  marginBottom: '1.5rem',
                  padding: '1.25rem',
                  backgroundColor: 'var(--bg-light)',
                  borderRadius: '10px'
                }}>
                  <label style={{ fontWeight: 600, color: 'var(--text-color)', fontSize: '0.95rem' }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    style={{
                      padding: '0.75rem',
                      border: '2px solid var(--border-color)',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      backgroundColor: 'var(--bg-cream)',
                      color: 'var(--text-light)',
                      cursor: 'not-allowed'
                    }}
                  />
                </div>

                {/* Username */}
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: '180px 1fr',
                  gap: '1.5rem',
                  alignItems: 'center',
                  marginBottom: '1.5rem',
                  padding: '1.25rem',
                  backgroundColor: 'var(--bg-light)',
                  borderRadius: '10px'
                }}>
                  <label style={{ fontWeight: 600, color: 'var(--text-color)', fontSize: '0.95rem' }}>
                    Login *
                  </label>
                  <div>
                    <input
                      type="text"
                      value={profileData.username}
                      onChange={(e) => setProfileData({...profileData, username: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid var(--primary-color)',
                        borderRadius: '8px',
                        fontSize: '1rem'
                      }}
                      required
                    />
                    <small style={{ color: 'var(--text-light)', fontSize: '0.85rem', display: 'block', marginTop: '0.25rem' }}>
                      Wyświetlana jako sprzedawca
                    </small>
                  </div>
                </div>

                {/* Full Name */}
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: '180px 1fr',
                  gap: '1.5rem',
                  alignItems: 'center',
                  marginBottom: '1.5rem',
                  padding: '1.25rem',
                  backgroundColor: 'var(--bg-light)',
                  borderRadius: '10px'
                }}>
                  <label style={{ fontWeight: 600, color: 'var(--text-color)', fontSize: '0.95rem' }}>
                    Nazwa użytkownika
                  </label>
                  <input
                    type="text"
                    value={profileData.full_name}
                    onChange={(e) => setProfileData({...profileData, full_name: e.target.value})}
                    placeholder="Opcjonalne"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid var(--border-color)',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                  />
                </div>

                {/* Bio */}
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: '180px 1fr',
                  gap: '1.5rem',
                  alignItems: 'start',
                  marginBottom: '2rem',
                  padding: '1.25rem',
                  backgroundColor: 'var(--bg-light)',
                  borderRadius: '10px'
                }}>
                  <label style={{ fontWeight: 600, color: 'var(--text-color)', paddingTop: '0.75rem', fontSize: '0.95rem' }}>
                    Opis
                  </label>
                  <textarea
                    value={profileData.bio}
                    onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                    rows="4"
                    placeholder="Opowiedz coś o sobie i swoich produktach..."
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid var(--border-color)',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      fontFamily: 'inherit',
                      resize: 'vertical'
                    }}
                  />
                </div>

                {/* Buttons */}
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditMode(false);
                      setAvatarFile(null);
                      setAvatarPreview(null);
                      setProfileData({
                        username: user?.username || '',
                        full_name: user?.full_name || '',
                        bio: user?.bio || '',
                        avatar_url: user?.avatar_url || '',
                        greeting: user?.greeting || 'Witaj na moim profilu! 👋'
                      });
                    }}
                    style={{
                      padding: '0.75rem 1.5rem',
                      fontSize: '1rem',
                      fontWeight: 600,
                      border: '2px solid var(--border-color)',
                      borderRadius: '8px',
                      backgroundColor: 'white',
                      color: 'var(--text-color)',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    Anuluj
                  </button>
                  <button
                    type="submit"
                    className="btn"
                    style={{
                      padding: '0.75rem 2rem',
                      fontSize: '1rem',
                      fontWeight: 600
                    }}
                  >
                    💾 Zapisz zmiany
                  </button>
                </div>
              </form>
            ) : (
              /* TRYB WYŚWIETLANIA */
              <div>
                {/* Email */}
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: '180px 1fr',
                  gap: '1.5rem',
                  alignItems: 'center',
                  marginBottom: '1.5rem',
                  padding: '1.25rem',
                  backgroundColor: 'var(--bg-light)',
                  borderRadius: '10px',
                  transition: 'all 0.2s'
                }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-light)', fontSize: '0.9rem' }}>
                    Email
                  </span>
                  <span style={{ fontSize: '1.1rem', color: 'var(--text-color)', fontWeight: 500 }}>
                    {user?.email}
                  </span>
                </div>

                {/* Username */}
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: '180px 1fr',
                  gap: '1.5rem',
                  alignItems: 'center',
                  marginBottom: '1.5rem',
                  padding: '1.25rem',
                  backgroundColor: 'var(--bg-light)',
                  borderRadius: '10px',
                  transition: 'all 0.2s'
                }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-light)', fontSize: '0.9rem' }}>
                    Login
                  </span>
                  <span style={{ fontSize: '1.1rem', color: 'var(--text-color)', fontWeight: 500 }}>
                    {user?.username}
                  </span>
                </div>

                {/* Full Name */}
                {user?.full_name && (
                  <div style={{ 
                    display: 'grid',
                    gridTemplateColumns: '180px 1fr',
                    gap: '1.5rem',
                    alignItems: 'center',
                    marginBottom: '1.5rem',
                    padding: '1.25rem',
                    backgroundColor: 'var(--bg-light)',
                    borderRadius: '10px',
                    transition: 'all 0.2s'
                  }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-light)', fontSize: '0.9rem' }}>
                      Nazwa użytkownika
                    </span>
                    <span style={{ fontSize: '1.1rem', color: 'var(--text-color)', fontWeight: 500 }}>
                      {user?.full_name}
                    </span>
                  </div>
                )}

                {/* Bio */}
                {user?.bio && (
                  <div style={{ 
                    display: 'grid',
                    gridTemplateColumns: '180px 1fr',
                    gap: '1.5rem',
                    alignItems: 'start',
                    marginBottom: '1.5rem',
                    padding: '1.25rem',
                    backgroundColor: 'var(--bg-light)',
                    borderRadius: '10px',
                    transition: 'all 0.2s'
                  }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-light)', fontSize: '0.9rem' }}>
                      Opis
                    </span>
                    <span style={{ fontSize: '1rem', color: 'var(--text-color)', lineHeight: '1.6' }}>
                      {user?.bio}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Archive Tab */}
      {activeTab === 'archive' && (
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '1.5rem' }}>
            Zarchiwizowane produkty ({archivedProducts.length})
          </h2>

          {archivedProducts.length === 0 ? (
            <div style={{
              padding: '3rem',
              textAlign: 'center',
              backgroundColor: 'var(--bg-cream)',
              borderRadius: '8px'
            }}>
              <p style={{ color: 'var(--text-light)' }}>
                Nie masz żadnych zarchiwizowanych produktów
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1.5rem'
            }}>
              {archivedProducts.map(product => (
                <div
                  key={product.id}
                  style={{
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    backgroundColor: 'white'
                  }}
                >
                  {product.images && product.images[0] && (
                    <div style={{
                      width: '100%',
                      height: '200px',
                      backgroundColor: 'var(--bg-cream)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <img
                        src={product.images[0].image_url.startsWith('http') 
                          ? product.images[0].image_url 
                          : `http://localhost:3001${product.images[0].image_url}`}
                        alt={product.title}
                        style={{
                          maxWidth: '100%',
                          maxHeight: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    </div>
                  )}
                  <div style={{ padding: '1rem' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                      {product.title}
                    </h3>
                    <p style={{ color: 'var(--text-light)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                      {product.category.name}
                    </p>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '1rem'
                    }}>
                      <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary-color)' }}>
                        {product.price} PLN
                      </span>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '4px',
                        fontSize: '0.875rem',
                        backgroundColor: '#fee2e2',
                        color: '#991b1b'
                      }}>
                        Wyprzedane
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleRestoreClick(product)}
                        className="btn"
                        style={{
                          flex: 1,
                          padding: '0.75rem',
                          fontSize: '0.95rem',
                          fontWeight: 600
                        }}
                      >
                        🔄 Przywróć
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id, product.title)}
                        style={{
                          padding: '0.75rem',
                          backgroundColor: '#fee2e2',
                          border: '2px solid #fecaca',
                          borderRadius: '8px',
                          color: '#991b1b',
                          fontWeight: 600,
                          fontSize: '0.95rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = '#fecaca';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = '#fee2e2';
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Restore Modal */}
          {restoreModalOpen && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000
            }}>
              <div style={{
                backgroundColor: 'white',
                padding: '2rem',
                borderRadius: '12px',
                maxWidth: '500px',
                width: '90%',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
              }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>
                  Przywróć produkt
                </h3>
                <p style={{ marginBottom: '0.5rem', fontWeight: 600 }}>
                  {productToRestore?.title}
                </p>
                <p style={{ marginBottom: '1.5rem', color: 'var(--text-light)', fontSize: '0.9rem' }}>
                  Wprowadź nową dostępną ilość sztuk, aby przywrócić produkt do sprzedaży
                </p>
                
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                    Dostępna ilość sztuk
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newStock}
                    onChange={(e) => setNewStock(e.target.value)}
                    placeholder="Wprowadź ilość..."
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid var(--border-color)',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                    autoFocus
                  />
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button
                    onClick={handleRestoreProduct}
                    className="btn"
                    style={{ flex: 1, padding: '0.75rem' }}
                  >
                    Przywróć
                  </button>
                  <button
                    onClick={() => {
                      setRestoreModalOpen(false);
                      setProductToRestore(null);
                      setNewStock('');
                    }}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      border: '2px solid var(--border-color)',
                      borderRadius: '8px',
                      backgroundColor: 'white',
                      color: 'var(--text-color)',
                      fontSize: '1rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Anuluj
                  </button>
                </div>
              </div>
            </div>
          )}
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
