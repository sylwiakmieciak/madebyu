import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../style.css';

export default function ProductDetails({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [error, setError] = useState('');
  const viewCountedRef = useRef(false);

  useEffect(() => {
    viewCountedRef.current = false; // Resetuj przy zmianie ID
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3001/api/products/${id}`);
      const data = await response.json();
      
      if (response.ok) {
        setProduct(data.product);
        
        // Zwiększ licznik wyświetleń tylko raz
        if (!viewCountedRef.current) {
          viewCountedRef.current = true;
          incrementViewCount();
        }
      } else {
        setError('Nie znaleziono produktu');
      }
    } catch (error) {
      console.error('Failed to load product:', error);
      setError('Błąd ładowania produktu');
    } finally {
      setLoading(false);
    }
  };

  const incrementViewCount = async () => {
    try {
      await fetch(`http://localhost:3001/api/products/${id}/view`, {
        method: 'POST'
      });
    } catch (error) {
      console.error('Failed to increment view count:', error);
    }
  };

  const toggleFeatured = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/products/${id}/featured`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        loadProduct(); // Reload to get updated status
      } else {
        const data = await response.json();
        alert(data.error || 'Nie udało się zmienić statusu');
      }
    } catch (error) {
      console.error('Failed to toggle featured:', error);
      alert('Wystąpił błąd');
    }
  };

  const handleAddToCart = () => {
    // Pobierz istniejący koszyk
    const savedCart = localStorage.getItem('cart');
    const cart = savedCart ? JSON.parse(savedCart) : [];
    
    // Sprawdź czy produkt już jest w koszyku
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      // Zwiększ ilość
      existingItem.quantity += 1;
    } else {
      // Dodaj nowy produkt
      cart.push({
        id: product.id,
        title: product.title,
        price: parseFloat(product.price),
        description: product.description,
        image: product.images?.[0]?.image_url 
          ? (product.images[0].image_url.startsWith('http') 
              ? product.images[0].image_url 
              : `http://localhost:3001${product.images[0].image_url}`)
          : null,
        quantity: 1
      });
    }
    
    // Zapisz koszyk
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Pokaż komunikat
    alert('Produkt dodany do koszyka!');
  };

  const handleContactSeller = () => {
    // TODO: Implement messaging
    alert('Funkcja wiadomości zostanie dodana wkrótce!');
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '3rem 1rem', textAlign: 'center' }}>
        <p style={{ fontSize: '1.2rem', color: 'var(--text-light)' }}>Ładowanie...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container" style={{ padding: '3rem 1rem', textAlign: 'center' }}>
        <p style={{ fontSize: '1.2rem', color: 'var(--danger-color)', marginBottom: '2rem' }}>{error || 'Produkt nie został znaleziony'}</p>
        <button
          onClick={() => navigate('/products')}
          className="btn"
        >
          Powrót do produktów
        </button>
      </div>
    );
  }

  const images = product.images || [];
  const hasImages = images.length > 0;

  return (
    <div className="container" style={{ padding: '3rem 1rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Breadcrumb */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.5rem',
        marginBottom: '2rem',
        fontSize: '0.9rem',
        color: 'var(--text-light)'
      }}>
        <span 
          onClick={() => navigate('/')} 
          style={{ cursor: 'pointer', color: 'var(--primary-color)' }}
        >
          Strona główna
        </span>
        <span>›</span>
        <span 
          onClick={() => navigate('/products')} 
          style={{ cursor: 'pointer', color: 'var(--primary-color)' }}
        >
          Produkty
        </span>
        <span>›</span>
        <span>{product.title}</span>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: window.innerWidth > 768 ? '1fr 1fr' : '1fr',
        gap: '3rem',
        marginBottom: '3rem'
      }}>
        {/* Galeria zdjęć */}
        <div>
          {hasImages ? (
            <>
              <div style={{
                width: '100%',
                height: '500px',
                backgroundColor: 'var(--bg-light)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                marginBottom: '1rem',
                border: '1px solid var(--border-color)'
              }}>  
                <img
                  src={images[selectedImage].image_url.startsWith('http') 
                    ? images[selectedImage].image_url 
                    : `http://localhost:3001${images[selectedImage].image_url}`}
                  alt={product.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    padding: '1rem'
                  }}
                />
              </div>
              
              {images.length > 1 && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${Math.min(images.length, 5)}, 1fr)`,
                  gap: '0.5rem'
                }}>
                  {images.map((img, index) => (
                    <div
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      style={{
                        width: '100%',
                        height: '100px',
                        backgroundColor: 'var(--bg-light)',
                        borderRadius: 'var(--radius-sm)',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        border: selectedImage === index 
                          ? '3px solid var(--primary-color)' 
                          : '1px solid var(--border-color)',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <img
                        src={img.image_url.startsWith('http') 
                          ? img.image_url 
                          : `http://localhost:3001${img.image_url}`}
                        alt={`${product.title} ${index + 1}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div style={{
              width: '100%',
              height: '500px',
              backgroundColor: 'var(--bg-light)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--border-color)',
              color: 'var(--text-light)'
            }}>
              Brak zdjęcia
            </div>
          )}
        </div>

        {/* Informacje o produkcie */}
        <div>
          <h1 style={{ 
            fontSize: '2.5rem', 
            fontWeight: 700, 
            marginBottom: '1rem',
            lineHeight: 1.2,
            color: 'var(--text-color)'
          }}>
            {product.title}
          </h1>

          {product.category && (
            <p style={{ 
              fontSize: '1rem', 
              color: 'var(--text-light)',
              marginBottom: '1.5rem'
            }}>
              Kategoria: <span style={{ color: 'var(--primary-color)' }}>{product.category.name}</span>
            </p>
          )}

          <div style={{
            padding: '1.5rem',
            backgroundColor: 'var(--bg-light)',
            borderRadius: 'var(--radius-md)',
            marginBottom: '2rem'
          }}>
            <p style={{ 
              fontSize: '3rem', 
              fontWeight: 700, 
              color: 'var(--primary-color)',
              marginBottom: '0.5rem'
            }}>
              {parseFloat(product.price).toFixed(2)} zł
            </p>
            <p style={{ 
              fontSize: '1rem',
              color: product.stock_quantity > 0 ? '#4caf50' : '#f44336',
              fontWeight: 600
            }}>
              {product.stock_quantity > 0 
                ? `✓ Dostępne: ${product.stock_quantity} szt.` 
                : '✗ Brak w magazynie'}
            </p>
          </div>

          {product.stock_quantity > 0 && (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column',
              gap: '1rem',
              marginBottom: '2rem'
            }}>
              <button
                onClick={handleAddToCart}
                className="btn btn-full"
                style={{
                  padding: '1rem 2rem',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, var(--primary-color), var(--primary-dark))',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => e.target.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
              >
                🛒 Dodaj do koszyka
              </button>
              
              <button
                onClick={handleContactSeller}
                style={{
                  padding: '1rem 2rem',
                  fontSize: '1rem',
                  fontWeight: 600,
                  background: 'white',
                  border: '2px solid var(--primary-color)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--primary-color)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = 'var(--primary-color)';
                  e.target.style.color = 'white';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'white';
                  e.target.style.color = 'var(--primary-color)';
                }}
              >
                💬 Skontaktuj się ze sprzedawcą
              </button>
            </div>
          )}

          {user?.role === 'admin' && (
            <button
              type="button"
              onClick={toggleFeatured}
              style={{
                width: '100%',
                padding: '1rem',
                marginBottom: '2rem',
                backgroundColor: product.is_featured ? '#fbbf24' : 'var(--bg-light)',
                border: product.is_featured ? '2px solid #f59e0b' : '2px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                color: product.is_featured ? '#92400e' : 'var(--text-primary)',
                fontWeight: 600,
                fontSize: '1rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
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

          {/* Informacje o sprzedawcy */}
          {product.seller && (
            <div style={{
              padding: '1.5rem',
              backgroundColor: 'var(--bg-cream)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '2rem'
            }}>
              <h3 style={{ 
                fontSize: '1.2rem', 
                fontWeight: 600,
                marginBottom: '1rem',
                color: 'var(--text-color)'
              }}>
                Sprzedawca
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {product.seller.avatar_url ? (
                  <img
                    src={product.seller.avatar_url}
                    alt={product.seller.username}
                    style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '50%',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <div style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--primary-color)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    fontWeight: 700
                  }}>
                    {product.seller.username.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p style={{ 
                    fontSize: '1.1rem', 
                    fontWeight: 600,
                    color: 'var(--text-color)'
                  }}>
                    {product.seller.username}
                  </p>
                  {product.seller.bio && (
                    <p style={{
                      fontSize: '0.9rem',
                      color: 'var(--text-light)',
                      marginTop: '0.25rem'
                    }}>
                      {product.seller.bio}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Wyświetlenia */}
          <p style={{ 
            fontSize: '0.9rem', 
            color: 'var(--text-light)',
            marginTop: '1rem'
          }}>
            👁️ Wyświetlenia: {product.views_count || 0}
          </p>
        </div>
      </div>

      {/* Opis produktu */}
      {product.description && (
        <div style={{
          padding: '2rem',
          backgroundColor: 'white',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          marginBottom: '2rem'
        }}>
          <h2 style={{ 
            fontSize: '1.8rem', 
            fontWeight: 700, 
            marginBottom: '1.5rem',
            color: 'var(--text-color)'
          }}>
            Opis produktu
          </h2>
          <p style={{ 
            fontSize: '1.05rem', 
            lineHeight: 1.8,
            color: 'var(--text-color)',
            whiteSpace: 'pre-wrap'
          }}>
            {product.description}
          </p>
        </div>
      )}

      {/* Przycisk powrotu */}
      <div style={{ textAlign: 'center', marginTop: '3rem' }}>
        <button
          onClick={() => navigate('/products')}
          style={{
            padding: '0.75rem 2rem',
            fontSize: '1rem',
            fontWeight: 600,
            background: 'transparent',
            border: '2px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-color)',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => {
            e.target.style.borderColor = 'var(--primary-color)';
            e.target.style.color = 'var(--primary-color)';
          }}
          onMouseOut={(e) => {
            e.target.style.borderColor = 'var(--border-color)';
            e.target.style.color = 'var(--text-color)';
          }}
        >
          ← Powrót do listy produktów
        </button>
      </div>
    </div>
  );
}
