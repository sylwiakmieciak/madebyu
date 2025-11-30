import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../dashboard.css';

export default function Cart() {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = () => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) return;
    
    const updatedCart = cart.map(item => 
      item.id === productId ? { ...item, quantity: newQuantity } : item
    );
    
    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const removeFromCart = (productId) => {
    const updatedCart = cart.filter(item => item.id !== productId);
    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    window.dispatchEvent(new Event('cartUpdated'));
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
              <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                {item.description?.substring(0, 100)}...
              </p>
              
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
