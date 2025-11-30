import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [orderData, setOrderData] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    
    if (!sessionId) {
      setStatus('error');
      setMessage('Brak identyfikatora sesji płatności');
      return;
    }

    verifyPayment(sessionId);
  }, [searchParams]);

  const verifyPayment = async (sessionId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/payments/verify-session/${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setStatus('success');
        setOrderData(data.order);
        setMessage('Płatność została pomyślnie zrealizowana!');
      } else {
        setStatus('error');
        setMessage(data.error || 'Nie udało się zweryfikować płatności');
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      setStatus('error');
      setMessage('Wystąpił błąd podczas weryfikacji płatności');
    }
  };

  return (
    <div className="container" style={{ 
      padding: '3rem 1rem',
      maxWidth: '600px',
      margin: '0 auto',
      textAlign: 'center'
    }}>
      {status === 'verifying' && (
        <div>
          <div style={{
            fontSize: '4rem',
            marginBottom: '1rem',
            animation: 'spin 2s linear infinite'
          }}>
            ⏳
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '1rem' }}>
            Weryfikacja płatności...
          </h2>
          <p style={{ color: 'var(--text-light)' }}>
            Proszę czekać, trwa sprawdzanie statusu płatności
          </p>
        </div>
      )}

      {status === 'success' && (
        <div>
          <div style={{
            fontSize: '5rem',
            marginBottom: '1rem',
            color: '#10b981'
          }}>
            ✓
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem', color: '#10b981' }}>
            Płatność udana!
          </h2>
          <p style={{ fontSize: '1.1rem', marginBottom: '2rem', color: 'var(--text-light)' }}>
            {message}
          </p>
          
          {orderData && (
            <div style={{
              backgroundColor: 'var(--bg-cream)',
              borderRadius: '12px',
              padding: '1.5rem',
              marginBottom: '2rem',
              textAlign: 'left'
            }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '1rem' }}>
                Szczegóły zamówienia
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-light)' }}>Numer zamówienia:</span>
                  <span style={{ fontWeight: 600 }}>{orderData.order_number}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-light)' }}>Status płatności:</span>
                  <span style={{ fontWeight: 600, color: '#10b981' }}>Opłacone</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-light)' }}>Kwota:</span>
                  <span style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--primary-color)' }}>
                    {parseFloat(orderData.total_amount).toFixed(2)} zł
                  </span>
                </div>
              </div>
            </div>
          )}

          <div style={{
            backgroundColor: '#d1fae5',
            border: '1px solid #10b981',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '2rem'
          }}>
            <p style={{ margin: 0, color: '#065f46', fontSize: '0.95rem' }}>
              📧 Potwierdzenie płatności zostało wysłane na Twój adres email
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button
              onClick={() => navigate('/dashboard')}
              className="btn"
              style={{ 
                padding: '0.75rem 2rem',
                fontSize: '1rem'
              }}
            >
              Przejdź do Dashboard
            </button>
            <button
              onClick={() => navigate('/')}
              className="btn"
              style={{ 
                padding: '0.75rem 2rem',
                fontSize: '1rem',
                backgroundColor: 'white',
                color: 'var(--primary-color)',
                border: '2px solid var(--primary-color)'
              }}
            >
              Wróć do sklepu
            </button>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div>
          <div style={{
            fontSize: '5rem',
            marginBottom: '1rem',
            color: '#ef4444'
          }}>
            ✕
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1rem', color: '#ef4444' }}>
            Błąd płatności
          </h2>
          <p style={{ fontSize: '1.1rem', marginBottom: '2rem', color: 'var(--text-light)' }}>
            {message}
          </p>
          
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button
              onClick={() => navigate('/dashboard')}
              className="btn"
              style={{ 
                padding: '0.75rem 2rem',
                fontSize: '1rem'
              }}
            >
              Spróbuj ponownie
            </button>
            <button
              onClick={() => navigate('/')}
              className="btn"
              style={{ 
                padding: '0.75rem 2rem',
                fontSize: '1rem',
                backgroundColor: 'white',
                color: 'var(--primary-color)',
                border: '2px solid var(--primary-color)'
              }}
            >
              Wróć do sklepu
            </button>
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}
