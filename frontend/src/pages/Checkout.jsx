import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import '../dashboard.css';

export default function Checkout() {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    shipping_name: '',
    shipping_email: '',
    shipping_phone: '',
    shipping_address: '',
    shipping_city: '',
    shipping_postal_code: '',
    shipping_country: 'Polska',
    notes: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    // Sprawdź czy user jest zalogowany
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Musisz być zalogowany, aby złożyć zamówienie');
      navigate('/login');
      return;
    }

    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    } else {
      navigate('/cart');
    }
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const getTotalPrice = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const orderData = {
        ...formData,
        items: cart.map(item => ({
          product_id: item.id,
          quantity: item.quantity
        }))
      };

      console.log('Sending order:', orderData);
      const response = await api.post('/orders', orderData);
      console.log('Order response:', response);
      
      // Wyczyść koszyk
      localStorage.removeItem('cart');
      
      // Przekieruj do potwierdzenia
      alert('Zamówienie zostało złożone! Numer: ' + response.order.order_number);
      navigate('/notifications');

    } catch (error) {
      console.error('Checkout error:', error);
      console.error('Error message:', error.message);
      alert(error.message || 'Nie udało się złożyć zamówienia');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '2rem' }}>Finalizacja zamówienia</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '2rem' }}>
        {/* Formularz */}
        <div>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{
              padding: '2rem',
              background: 'white',
              borderRadius: '12px',
              border: '1px solid var(--border-color)'
            }}>
              <h2 style={{ marginBottom: '1.5rem' }}>Dane do wysyłki</h2>

              <div style={{ display: 'grid', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                    Imię i nazwisko *
                  </label>
                  <input
                    type="text"
                    name="shipping_name"
                    value={formData.shipping_name}
                    onChange={handleChange}
                    required
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                      Email *
                    </label>
                    <input
                      type="email"
                      name="shipping_email"
                      value={formData.shipping_email}
                      onChange={handleChange}
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        fontSize: '1rem'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                      Telefon
                    </label>
                    <input
                      type="tel"
                      name="shipping_phone"
                      value={formData.shipping_phone}
                      onChange={handleChange}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        fontSize: '1rem'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                    Adres *
                  </label>
                  <input
                    type="text"
                    name="shipping_address"
                    value={formData.shipping_address}
                    onChange={handleChange}
                    required
                    placeholder="Ulica i numer"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                      Miasto *
                    </label>
                    <input
                      type="text"
                      name="shipping_city"
                      value={formData.shipping_city}
                      onChange={handleChange}
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        fontSize: '1rem'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                      Kod pocztowy *
                    </label>
                    <input
                      type="text"
                      name="shipping_postal_code"
                      value={formData.shipping_postal_code}
                      onChange={handleChange}
                      required
                      placeholder="00-000"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        fontSize: '1rem'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                    Uwagi do zamówienia
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows="3"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      resize: 'vertical'
                    }}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '1rem',
                background: 'var(--primary-color)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '1.1rem',
                fontWeight: 600
              }}
            >
              {loading ? 'Przetwarzanie...' : 'Złóż zamówienie'}
            </button>
          </form>
        </div>

        {/* Podsumowanie */}
        <div>
          <div style={{
            padding: '2rem',
            background: 'white',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            position: 'sticky',
            top: '2rem'
          }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Podsumowanie</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              {cart.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontWeight: 600 }}>{item.title}</p>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>
                      {item.quantity} × {item.price} zł
                    </p>
                  </div>
                  <p style={{ fontWeight: 600 }}>
                    {(item.price * item.quantity).toFixed(2)} zł
                  </p>
                </div>
              ))}
            </div>

            <div style={{
              paddingTop: '1.5rem',
              borderTop: '2px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <p style={{ fontSize: '1.2rem', fontWeight: 600 }}>Razem:</p>
              <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary-color)' }}>
                {getTotalPrice()} zł
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
