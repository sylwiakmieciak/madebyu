import { Link } from 'react-router-dom';
import '../style.css';

export default function Navbar({ user, onLogout }) {
  const handleLogout = (e) => {
    e.preventDefault();
    if (onLogout) {
      onLogout();
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
          <form className="search-form" action="/search" method="GET">
            <input
              type="text"
              name="q"
              className="search-input"
              placeholder="Szukaj rękodzieł..."
              autoComplete="off"
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

          {/* Rozwijane menu kategorii */}
          <div className="nav-dropdown">
            <Link to="/categories" className="dropdown-toggle">
              Kategorie
              <svg className="dropdown-icon" width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                <path d="M6 9L1 4h10z"></path>
              </svg>
            </Link>
            <div className="dropdown-menu">
              <div className="dropdown-content">
                <div className="category-column">
                  <Link to="/categories/ceramika" className="category-main">Ceramika</Link>
                  <Link to="/categories/ceramika/naczynia" className="category-sub">Naczynia</Link>
                  <Link to="/categories/ceramika/wazony" className="category-sub">Wazony</Link>
                  <Link to="/categories/ceramika/figurki" className="category-sub">Figurki</Link>
                </div>
                <div className="category-column">
                  <Link to="/categories/bizuteria" className="category-main">Biżuteria</Link>
                  <Link to="/categories/bizuteria/naszyjniki" className="category-sub">Naszyjniki</Link>
                  <Link to="/categories/bizuteria/bransoletki" className="category-sub">Bransoletki</Link>
                  <Link to="/categories/bizuteria/kolczyki" className="category-sub">Kolczyki</Link>
                </div>
                <div className="category-column">
                  <Link to="/categories/drewno" className="category-main">Drewno</Link>
                  <Link to="/categories/drewno/deski" className="category-sub">Deski do krojenia</Link>
                  <Link to="/categories/drewno/skrzynki" className="category-sub">Skrzynki</Link>
                  <Link to="/categories/drewno/dekoracje" className="category-sub">Dekoracje</Link>
                </div>
                <div className="category-column">
                  <Link to="/categories/tekstylia" className="category-main">Tekstylia</Link>
                  <Link to="/categories/tekstylia/szale" className="category-sub">Szale</Link>
                  <Link to="/categories/tekstylia/torby" className="category-sub">Torby</Link>
                  <Link to="/categories/tekstylia/poduszki" className="category-sub">Poduszki</Link>
                </div>
              </div>
            </div>
          </div>

          {user ? (
            <>
              <Link to="/dashboard">Moje Konto</Link>
              <a href="#" onClick={handleLogout} className="btn-logout">Wyloguj</a>
            </>
          ) : (
            <Link to="/login" className="btn-login">Zaloguj się</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
