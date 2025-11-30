import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../dashboard.css';

export default function Cart() {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadCart();
    syncCartWithBackend();
  }, []);

  const syncCartWithBackend = async () => {
    const token = localStorage.getItem('token');
    if (!token) return; // Nie zalogowany - używaj tylko localStorage

    try {
      // Pobierz koszyk z backendu
      const response = await fetch('http://localhost:3001/api/cart', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const backendCart = data.cart || [];

        // Pobierz lokalny koszyk
        const localCart = JSON.parse(localStorage.getItem('cart') || '[]');

        if (localCart.length > 0 && backendCart.length === 0) {
          // Jeśli mamy produkty lokalnie ale nie w bazie - wyślij do bazy
          await fetch('http://localhost:3001/api/cart/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ cart: localCart })
          });
        } else if (backendCart.length > 0) {
          // Jeśli są produkty w bazie - użyj ich
          setCart(backendCart);
          localStorage.setItem('cart', JSON.stringify(backendCart));
          window.dispatchEvent(new Event('cartUpdated'));
        }
      }
    } catch (error) {
      console.error('Cart sync error:', error);
      // W przypadku błędu używaj lokalnego koszyka
    }
  };

  const loadCart = () => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  };

  const updateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) return;
    
    const updatedCart = cart.map(item => 
      item.id === productId ? { ...item, quantity: newQuantity } : item
    );
    
    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    window.dispatchEvent(new Event('cartUpdated'));

    // Aktualizuj backend jeśli zalogowany
    const token = localStorage.getItem('token');
    if (token) {
      try {
        await fetch(`http://localhost:3001/api/cart/${productId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ quantity: newQuantity })
        });
      } catch (error) {
        console.error('Update cart backend error:', error);
      }
    }
  };

  const removeFromCart = async (productId) => {
    const updatedCart = cart.filter(item => item.id !== productId);
    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    window.dispatchEvent(new Event('cartUpdated'));

    // Aktualizuj backend jeśli zalogowany
    const token = localStorage.getItem('token');
    if (token) {
      try {
        await fetch(`http://localhost:3001/api/cart/${productId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      } catch (error) {
        console.error('Remove from cart backend error:', error);
      }
    }
  };

  const getTotalPrice = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2);
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('Koszyk jest pusty');
      return;
    }
    navigate('/checkout');
  };

  if (cart.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Koszyk</h1>
        <p style={{ color: 'var(--text-light)', margin: '2rem 0' }}>
          Twój koszyk jest pusty
        </p>
        <button 
          onClick={() => navigate('/products')}
          style={{
            padding: '0.75rem 2rem',
            background: 'var(--primary-color)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 600
          }}
        >
          Przeglądaj produkty
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '2rem' }}>Koszyk</h1>

      <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
        {cart.map(item => (
          <div 
            key={item.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '120px 1fr auto',
              gap: '1.5rem',
              padding: '1.5rem',
              background: 'white',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              alignItems: 'center'
            }}
          >
            {/* Zdjęcie */}
            <img 
              src={item.image || '/placeholder.jpg'}
              alt={item.title}
              style={{
                width: '100%',
                height: '120px',
                objectFit: 'cover',
                borderRadius: '8px'
              }}
            />

            {/* Info */}
            <div>
              <h3 style={{ marginBottom: '0.5rem' }}>{item.title}</h3>
              <div 
                style={{ color: 'var(--text-light)', fontSize: '0.9rem', marginBottom: '1rem' }}
                dangerouslySetInnerHTML={{ 
                  __html: item.description?.substring(0, 150) + '...' || '' 
                }}
              />
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--primary-color)' }}>
                  {item.price} zł
                </span>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    style={{
                      padding: '0.25rem 0.75rem',
                      background: 'var(--bg-light)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    −
                  </button>
                  <span style={{ minWidth: '30px', textAlign: 'center', fontWeight: 600 }}>
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    style={{
                      padding: '0.25rem 0.75rem',
                      background: 'var(--bg-light)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Usuń */}
            <button
              onClick={() => removeFromCart(item.id)}
              style={{
                padding: '0.5rem 1rem',
                background: '#ff4444',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Usuń
            </button>
          </div>
        ))}
      </div>

      {/* Podsumowanie */}
      <div style={{
        padding: '2rem',
        background: 'var(--bg-light)',
        borderRadius: '12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>Razem:</p>
          <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary-color)' }}>
            {getTotalPrice()} zł
          </p>
        </div>
        
        <button
          onClick={handleCheckout}
          disabled={loading}
          style={{
            padding: '1rem 3rem',
            background: 'var(--primary-color)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1.1rem',
            fontWeight: 600
          }}
        >
          {loading ? 'Przetwarzanie...' : 'Przejdź do kasy'}
        </button>
      </div>
    </div>
  );
}
