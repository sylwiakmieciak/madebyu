import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import '../dashboard.css';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [salesOrders, setSalesOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('notifications'); // 'notifications' | 'orders'
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [notifResponse, ordersResponse] = await Promise.all([
        api.get('/notifications'),
        api.get('/orders/sales/my')
      ]);
      
      setNotifications(notifResponse.data.notifications || []);
      setSalesOrders(ordersResponse.data.orders || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleShipOrder = async (orderId) => {
    if (!confirm('Potwierdzić wysyłkę zamówienia?')) return;

    try {
      await api.put(`/orders/${orderId}/ship`);
      alert('Zamówienie oznaczone jako wysłane!');
      loadData();
    } catch (error) {
      console.error('Failed to ship order:', error);
      alert('Nie udało się zaktualizować zamówienia');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_order': return '📦';
      case 'order_shipped': return '🚚';
      case 'order_delivered': return '✅';
      case 'order_cancelled': return '❌';
      default: return '🔔';
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { text: 'Oczekuje', color: '#ffa500' },
      confirmed: { text: 'Potwierdzone', color: '#2196f3' },
      shipped: { text: 'Wysłane', color: '#4caf50' },
      delivered: { text: 'Dostarczone', color: '#8bc34a' },
      cancelled: { text: 'Anulowane', color: '#f44336' }
    };
    
    const badge = badges[status] || badges.pending;
    return (
      <span style={{
        padding: '0.25rem 0.75rem',
        background: badge.color,
        color: 'white',
        borderRadius: '12px',
        fontSize: '0.85rem',
        fontWeight: 600
      }}>
        {badge.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Ładowanie...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '2rem' }}>Powiadomienia i Zamówienia</h1>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '2px solid var(--border-color)' }}>
        <button
          onClick={() => setActiveTab('notifications')}
          style={{
            padding: '1rem 2rem',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'notifications' ? '3px solid var(--primary-color)' : 'none',
            color: activeTab === 'notifications' ? 'var(--primary-color)' : 'var(--text-light)',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          🔔 Powiadomienia ({notifications.filter(n => !n.is_read).length})
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          style={{
            padding: '1rem 2rem',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'orders' ? '3px solid var(--primary-color)' : 'none',
            color: activeTab === 'orders' ? 'var(--primary-color)' : 'var(--text-light)',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          📦 Zamówienia do wysyłki ({salesOrders.filter(o => o.status === 'pending').length})
        </button>
      </div>

      {/* Powiadomienia Tab */}
      {activeTab === 'notifications' && (
        <div>
          {notifications.filter(n => !n.is_read).length > 0 && (
            <div style={{ marginBottom: '1rem', textAlign: 'right' }}>
              <button
                onClick={markAllAsRead}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'var(--primary-color)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                Oznacz wszystkie jako przeczytane
              </button>
            </div>
          )}

          {notifications.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-light)', padding: '3rem' }}>
              Brak powiadomień
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {notifications.map(notif => (
                <div
                  key={notif.id}
                  onClick={() => !notif.is_read && markAsRead(notif.id)}
                  style={{
                    padding: '1.5rem',
                    background: notif.is_read ? 'white' : 'var(--bg-light)',
                    border: `2px solid ${notif.is_read ? 'var(--border-color)' : 'var(--primary-color)'}`,
                    borderRadius: '12px',
                    cursor: notif.is_read ? 'default' : 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'start', gap: '1rem' }}>
                    <span style={{ fontSize: '2rem' }}>{getNotificationIcon(notif.type)}</span>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {notif.title}
                        {!notif.is_read && (
                          <span style={{
                            width: '8px',
                            height: '8px',
                            background: 'var(--primary-color)',
                            borderRadius: '50%'
                          }} />
                        )}
                      </h3>
                      <p style={{ color: 'var(--text-light)', marginBottom: '0.5rem' }}>
                        {notif.message}
                      </p>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>
                        {new Date(notif.created_at).toLocaleString('pl-PL')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Zamówienia Tab */}
      {activeTab === 'orders' && (
        <div>
          {salesOrders.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-light)', padding: '3rem' }}>
              Brak zamówień do wysyłki
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {salesOrders.map(order => (
                <div
                  key={order.id}
                  style={{
                    padding: '2rem',
                    background: 'white',
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                    <div>
                      <h3 style={{ marginBottom: '0.5rem' }}>
                        Zamówienie #{order.order_number}
                      </h3>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>
                        Kupujący: {order.buyer?.username} ({order.buyer?.email})
                      </p>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>
                        Data: {new Date(order.created_at).toLocaleString('pl-PL')}
                      </p>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>

                  {/* Adres wysyłki */}
                  <div style={{
                    padding: '1rem',
                    background: 'var(--bg-light)',
                    borderRadius: '8px',
                    marginBottom: '1rem'
                  }}>
                    <h4 style={{ marginBottom: '0.5rem' }}>Adres wysyłki:</h4>
                    <p style={{ fontSize: '0.9rem' }}>
                      {order.shipping_name}<br />
                      {order.shipping_address}<br />
                      {order.shipping_postal_code} {order.shipping_city}<br />
                      {order.shipping_country}
                    </p>
                    {order.shipping_phone && (
                      <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                        Tel: {order.shipping_phone}
                      </p>
                    )}
                  </div>

                  {/* Produkty */}
                  <div style={{ marginBottom: '1rem' }}>
                    <h4 style={{ marginBottom: '0.75rem' }}>Twoje produkty w tym zamówieniu:</h4>
                    {order.items?.map(item => (
                      <div
                        key={item.id}
                        style={{
                          display: 'flex',
                          gap: '1rem',
                          padding: '0.75rem',
                          background: 'var(--bg-light)',
                          borderRadius: '8px',
                          marginBottom: '0.5rem'
                        }}
                      >
                        {item.product?.images?.[0] && (
                          <img
                            src={item.product.images[0].image_url.startsWith('http') 
                              ? item.product.images[0].image_url 
                              : `http://localhost:3001${item.product.images[0].image_url}`}
                            alt={item.product.title}
                            style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px' }}
                          />
                        )}
                        <div style={{ flex: 1 }}>
                          <p style={{ fontWeight: 600 }}>{item.product?.title}</p>
                          <p style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>
                            Ilość: {item.quantity} × {item.price} zł = {item.subtotal} zł
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Przycisk wysyłki */}
                  {order.status === 'pending' && (
                    <button
                      onClick={() => handleShipOrder(order.id)}
                      style={{
                        width: '100%',
                        padding: '1rem',
                        background: 'var(--success-color)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        fontWeight: 600
                      }}
                    >
                      ✓ Potwierdź wysyłkę
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
