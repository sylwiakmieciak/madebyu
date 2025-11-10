import { Link } from 'react-router-dom';
import '../style.css';

export default function Home() {
  const addToCart = (productId) => {
    console.log('Dodano do koszyka:', productId);
    // TODO: Implementacja koszyka
  };

  return (
    <main>
      {/* Wyróżniające się produkty */}
      <section className="featured-products" style={{ paddingTop: '4rem' }}>
        <div className="container">
          <h2>Wybór Redakcji</h2>
          <div className="products-grid">
            {/* Przykladowe produkty - pozniej z bazy danych */}
            <div className="product-card">
              <div className="product-image">
                <img src="https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=600&h=600&fit=crop" alt="Ceramiczna miska" />
                <span className="badge">Wybór Redakcji</span>
              </div>
              <div className="product-info">
                <h3>Ręcznie robiona miska ceramiczna</h3>
                <p className="product-price">50.00 zł</p>
                <p className="product-seller">Sprzedawca: Kasia</p>
                <button className="btn btn-small" onClick={() => addToCart(1)}>Dodaj do koszyka</button>
              </div>
            </div>

            <div className="product-card">
              <div className="product-image">
                <img src="https://images.unsplash.com/photo-1565183928294-7d22f6518a02?w=600&h=600&fit=crop" alt="Drewniana deska" />
              </div>
              <div className="product-info">
                <h3>Drewniana deska do krojenia</h3>
                <p className="product-price">120.00 zł</p>
                <p className="product-seller">Sprzedawca: Marek</p>
                <button className="btn btn-small" onClick={() => addToCart(2)}>Dodaj do koszyka</button>
              </div>
            </div>

            <div className="product-card">
              <div className="product-image">
                <img src="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&h=600&fit=crop" alt="Biżuteria srebrna" />
                <span className="badge">Nowość</span>
              </div>
              <div className="product-info">
                <h3>Ręcznie robiona biżuteria srebrna</h3>
                <p className="product-price">85.00 zł</p>
                <p className="product-seller">Sprzedawca: Anna</p>
                <button className="btn btn-small" onClick={() => addToCart(3)}>Dodaj do koszyka</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Kategorie */}
      <section className="categories-section">
        <div className="container">
          <h2>Kategorie Produktów</h2>
          <div className="categories-grid">
            <div className="category-card">
              <h3>Ceramika</h3>
              <p>Miseczki, talerze, wazony</p>
            </div>
            <div className="category-card">
              <h3>Bizuteria</h3>
              <p>Naszyjniki, bransoletki, kolczyki</p>
            </div>
            <div className="category-card">
              <h3>Drewno</h3>
              <p>Deski, skrzynki, dekoracje</p>
            </div>
            <div className="category-card">
              <h3>Tekstylia</h3>
              <p>Szale, torby, poduszki</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
