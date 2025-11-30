import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import '../style.css';

export default function Navbar({ user, onLogout }) {
  const [allCategories, setAllCategories] = useState([]);
  const [currentLevel, setCurrentLevel] = useState([]);
  const [breadcrumb, setBreadcrumb] = useState([]);
  const [showCategories, setShowCategories] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const navigate = useNavigate();
  const closeTimeoutRef = useRef(null);

  useEffect(() => {
    loadCategories();
    loadCartCount();
    
    if (user) {
      loadUnreadCount();
      // Odświeżaj co 30 sekund
      const interval = setInterval(loadUnreadCount, 30000);
      // Nasłuchuj na custom event z Notifications
      const handleRefresh = () => loadUnreadCount();
      window.addEventListener('refreshNotifications', handleRefresh);
      return () => {
        clearInterval(interval);
        window.removeEventListener('refreshNotifications', handleRefresh);
      };
    }
  }, [user]);

  useEffect(() => {
    // Nasłuchuj na zmiany w koszyku
    const handleCartUpdate = () => loadCartCount();
    window.addEventListener('cartUpdated', handleCartUpdate);
    window.addEventListener('storage', handleCartUpdate);
    
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
      window.removeEventListener('storage', handleCartUpdate);
    };
  }, []);

  const loadCartCount = () => {
    try {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        const cart = JSON.parse(savedCart);
        const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
        setCartCount(totalItems);
      } else {
        setCartCount(0);
      }
    } catch (error) {
      console.error('Błąd ładowania koszyka:', error);
      setCartCount(0);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/notifications/unread-count', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setUnreadCount(data.count || 0);
    } catch (error) {
      console.error('Błąd ładowania licznika powiadomień:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/categories');
      const data = await response.json();
      
      const flatCategories = data.flat || [];
      setAllCategories(flatCategories);
      const mainCategories = flatCategories.filter(cat => cat.parent_id === null || cat.parent_id === undefined);
      setCurrentLevel(mainCategories);
    } catch (error) {
      console.error('Błąd ładowania kategorii:', error);
    }
  };

  const handleCategoryClick = (category) => {
    // Kliknięcie w kafelek - zawsze pokaż produkty
    navigate(`/products?category=${category.id}`);
    setShowCategories(false);
    resetNavigation();
  };

  const handleArrowClick = (category, e) => {
    e.stopPropagation();
    // Kliknięcie w strzałkę - nawiguj do podkategorii
    const children = allCategories.filter(cat => cat.parent_id === category.id);
    
    if (children.length > 0) {
      setCurrentLevel(children);
      setBreadcrumb([...breadcrumb, category]);
    }
  };

  const handleBreadcrumbClick = (index) => {
    if (index === -1) {
      const mainCategories = allCategories.filter(cat => cat.parent_id === null || cat.parent_id === undefined);
      setCurrentLevel(mainCategories);
      setBreadcrumb([]);
    } else {
      const category = breadcrumb[index];
      const children = allCategories.filter(cat => cat.parent_id === category.id);
      setCurrentLevel(children);
      setBreadcrumb(breadcrumb.slice(0, index + 1));
    }
  };

  const resetNavigation = () => {
    const mainCategories = allCategories.filter(cat => cat.parent_id === null || cat.parent_id === undefined);
    setCurrentLevel(mainCategories);
    setBreadcrumb([]);
  };

  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setShowCategories(true);
  };

  const handleMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setShowCategories(false);
      resetNavigation();
    }, 1500); // Zwiększone z 1000ms do 1500ms
  };

  const handleLogout = (e) => {
    e.preventDefault();
    if (onLogout) {
      onLogout();
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  return (
    <header className="navbar">
      <div className="container navbar-container">
        <div className="nav-brand">
          <Link to="/">MadeByU</Link>
        </div>

        {/* Wyszukiwarka */}
        <div className="search-container">
          <form className="search-form" onSubmit={handleSearch}>
            <input
              type="text"
              name="q"
              className="search-input"
              placeholder="Szukaj rękodzieł..."
              autoComplete="off"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="search-button" aria-label="Szukaj">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
            </button>
          </form>
        </div>

        <nav className="nav-menu">
          <Link to="/">Strona Główna</Link>
          <Link to="/products">Produkty</Link>

          {/* Menu kategorii z nawigacją breadcrumb */}
          <div 
            className="nav-dropdown"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <span className="dropdown-toggle">
              Kategorie
              <svg className="dropdown-icon" width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                <path d="M6 9L1 4h10z"></path>
              </svg>
            </span>
            {showCategories && (
              <div className="dropdown-menu categories-nav-menu">
                {/* Breadcrumb nawigacja */}
                <div className="nav-breadcrumb-path">
                  <span 
                    className={breadcrumb.length === 0 ? "nav-breadcrumb-item" : "nav-breadcrumb-item clickable"}
                    onClick={() => breadcrumb.length > 0 && handleBreadcrumbClick(-1)}
                  >
                    Kategorie
                  </span>
                  {breadcrumb.map((cat, index) => (
                    <span key={cat.id}>
                      <span className="nav-breadcrumb-separator">→</span>
                      <span 
                        className="nav-breadcrumb-item clickable"
                        onClick={() => handleBreadcrumbClick(index)}
                      >
                        {cat.name}
                      </span>
                    </span>
                  ))}
                </div>

                {/* Kafelki kategorii */}
                <div className="nav-categories-grid">
                  {currentLevel.map((category) => {
                    const hasChildren = allCategories.filter(cat => cat.parent_id === category.id).length > 0;
                    return (
                      <div
                        key={category.id}
                        className={`nav-category-tile ${hasChildren ? 'has-children' : 'is-final'}`}
                        onClick={() => handleCategoryClick(category)}
                      >
                        <div className="nav-category-name">{category.name}</div>
                        {hasChildren && (
                          <span 
                            className="nav-arrow-icon"
                            onClick={(e) => handleArrowClick(category, e)}
                          >
                            →
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {user ? (
            <>
              <Link to="/cart" style={{ 
                position: 'relative', 
                paddingRight: cartCount > 0 ? '30px' : '0', 
                display: 'inline-flex', 
                alignItems: 'center' 
              }}>
                Koszyk
                {cartCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '50%',
                    right: '0',
                    transform: 'translateY(-50%)',
                    backgroundColor: '#e53e3e',
                    color: 'white',
                    borderRadius: '12px',
                    padding: '2px 6px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    minWidth: '20px',
                    textAlign: 'center'
                  }}>
                    {cartCount}
                  </span>
                )}
              </Link>
              <Link to="/notifications" style={{ 
                position: 'relative', 
                paddingRight: unreadCount > 0 ? '30px' : '0', 
                display: 'inline-flex', 
                alignItems: 'center' 
              }}>
                Powiadomienia
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '50%',
                    right: '0',
                    transform: 'translateY(-50%)',
                    backgroundColor: '#e53e3e',
                    color: 'white',
                    borderRadius: '12px',
                    padding: '2px 6px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    minWidth: '20px',
                    textAlign: 'center'
                  }}>
                    {unreadCount}
                  </span>
                )}
              </Link>
              <Link to="/dashboard">Moje Konto</Link>
              <a href="#" onClick={handleLogout} className="btn-logout">Wyloguj</a>
            </>
          ) : (
            <>
              <Link to="/cart" style={{ 
                position: 'relative', 
                paddingRight: cartCount > 0 ? '30px' : '0', 
                display: 'inline-flex', 
                alignItems: 'center' 
              }}>
                Koszyk
                {cartCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '50%',
                    right: '0',
                    transform: 'translateY(-50%)',
                    backgroundColor: '#e53e3e',
                    color: 'white',
                    borderRadius: '12px',
                    padding: '2px 6px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    minWidth: '20px',
                    textAlign: 'center'
                  }}>
                    {cartCount}
                  </span>
                )}
              </Link>
              <Link to="/login" className="btn-login">Zaloguj się</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
