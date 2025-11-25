import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import '../dashboard.css';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [salesOrders, setSalesOrders] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('notifications'); // 'notifications' | 'orders' | 'my-orders'
  const [reviewModal, setReviewModal] = useState(null); // { orderId, sellerId, sellerName }
  const [commentModal, setCommentModal] = useState(null); // { orderId, productId, productTitle }
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [productComment, setProductComment] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [notifData, ordersData, myOrdersData] = await Promise.all([
        api.get('/notifications'),
        api.get('/orders/sales/my'),
        api.get('/orders/my')
      ]);
      
      console.log('Notifications data:', notifData);
      console.log('Orders data:', ordersData);
      console.log('My orders data:', myOrdersData);
      
      setNotifications(notifData.notifications || []);
      setSalesOrders(ordersData.orders || []);
      setMyOrders(myOrdersData.orders || []);
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
      // Odśwież licznik powiadomień
      window.dispatchEvent(new Event('refreshNotifications'));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      // Odśwież licznik powiadomień
      window.dispatchEvent(new Event('refreshNotifications'));
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

  const handleConfirmDelivery = async (orderId) => {
    if (!confirm('Potwierdzić otrzymanie przesyłki?')) return;

    try {
      await api.put(`/orders/${orderId}/confirm-delivery`);
      alert('Potwierdzono otrzymanie przesyłki!');
      loadData();
    } catch (error) {
      console.error('Failed to confirm delivery:', error);
      alert('Nie udało się potwierdzić dostawy');
    }
  };

  const handleOpenReviewModal = (orderId, sellerId, sellerName) => {
    setReviewModal({ orderId, sellerId, sellerName });
    setRating(5);
    setComment('');
  };

  const handleOpenCommentModal = (orderId, productId, productTitle) => {
    setCommentModal({ orderId, productId, productTitle });
    setProductComment('');
  };

  const handleSubmitReview = async () => {
    if (!rating || rating < 1 || rating > 5) {
      alert('Wybierz ocenę od 1 do 5 gwiazdek');
      return;
    }

    console.log('Submitting review:', {
      orderId: reviewModal.orderId,
      seller_id: reviewModal.sellerId,
      rating,
      comment
    });

    try {
      const response = await api.post(`/orders/${reviewModal.orderId}/review`, {
        seller_id: reviewModal.sellerId,
        rating,
        comment
      });
      console.log('Review response:', response);
      alert('Ocena dodana pomyślnie!');
      setReviewModal(null);
      loadData();
    } catch (error) {
      console.error('Failed to submit review:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
      alert(error.message || 'Nie udało się dodać oceny');
    }
  };

  const handleSubmitProductComment = async () => {
    if (!productComment.trim()) {
      alert('Komentarz nie może być pusty');
      return;
    }

    console.log('Submitting product comment:', {
      productId: commentModal.productId,
      comment: productComment.trim()
    });

    try {
      const token = localStorage.getItem('token');
      const url = `http://localhost:3001/api/comments/product/${commentModal.productId}`;
      console.log('Request URL:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ comment: productComment.trim() })
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Błąd podczas dodawania komentarza');
      }

      alert('Komentarz został dodany! Możesz go zobaczyć na stronie produktu. Komentarz czeka na akceptację przez administratora.');
      setCommentModal(null);
      setProductComment('');
      loadData();
    } catch (error) {
      console.error('Failed to submit comment:', error);
      alert(error.message || 'Nie udało się dodać komentarza');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_order': return '';
      case 'order_shipped': return '';
      case 'order_delivered': return '';
      case 'order_cancelled': return '';
      default: return '';
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
            fontWeight: activeTab === 'notifications' ? 700 : 500,
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          Powiadomienia ({notifications.filter(n => !n.is_read).length})
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          style={{
            padding: '1rem 2rem',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'orders' ? '3px solid var(--primary-color)' : 'none',
            color: activeTab === 'orders' ? 'var(--primary-color)' : 'var(--text-light)',
            fontWeight: activeTab === 'orders' ? 700 : 500,
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          Zamówienia do wysyłki ({salesOrders.filter(o => o.status === 'pending').length})
        </button>
        <button
          onClick={() => setActiveTab('my-orders')}
          style={{
            padding: '1rem 2rem',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'my-orders' ? '3px solid var(--primary-color)' : 'none',
            color: activeTab === 'my-orders' ? 'var(--primary-color)' : 'var(--text-light)',
            fontWeight: activeTab === 'my-orders' ? 700 : 500,
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          Moje zamówienia ({myOrders.length})
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
                    Potwierdź wysyłkę
                  </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Moje Zamówienia Tab */}
      {activeTab === 'my-orders' && (
        <div>
          {myOrders.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-light)', padding: '3rem' }}>
              Nie masz jeszcze zamówień
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {myOrders.map(order => (
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
                        Data: {new Date(order.created_at).toLocaleString('pl-PL')}
                      </p>
                      <p style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>
                        Suma: {order.total_amount} zł
                      </p>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>

                  {/* Produkty */}
                  <div style={{ marginTop: '1rem' }}>
                    <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Zamówione produkty:</p>
                    {order.items?.map(item => (
                      <div
                        key={item.id}
                        style={{
                          display: 'flex',
                          gap: '1rem',
                          alignItems: 'center',
                          padding: '1rem',
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
                            Sprzedawca: {item.seller?.username}
                          </p>
                          <p style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>
                            Ilość: {item.quantity} × {item.price} zł = {item.subtotal} zł
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Przyciski akcji */}
                  <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    {order.status === 'shipped' && (
                      <button
                        onClick={() => handleConfirmDelivery(order.id)}
                        style={{
                          flex: 1,
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
                        ✓ Zamówienie dotarło
                      </button>
                    )}
                    
                    {/* Przyciski oceń i skomentuj - tylko dla dostarczonych zamówień */}
                    {order.status === 'delivered' && order.items?.map(item => {
                      const hasReview = order.reviews?.some(
                        review => review.seller_id === item.seller_id
                      );
                      return (
                        <div key={item.id} style={{ display: 'flex', gap: '0.5rem', flex: 1, minWidth: '250px' }}>
                          {!hasReview && (
                            <button
                              onClick={() => handleOpenReviewModal(order.id, item.seller_id, item.seller?.username)}
                              style={{
                                flex: 1,
                                padding: '1rem',
                                background: '#10b981',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontSize: '0.95rem',
                                fontWeight: 600
                              }}
                            >
                              ⭐ Oceń sprzedawcę
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenCommentModal(order.id, item.product_id, item.product?.title)}
                            style={{
                              flex: 1,
                              padding: '1rem',
                              background: 'var(--primary-color)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              fontSize: '0.95rem',
                              fontWeight: 600
                            }}
                          >
                            💬 Skomentuj produkt
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal oceny */}
      {reviewModal && (
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
              Oceń sprzedawcę
            </h3>
            <p style={{ marginBottom: '1.5rem', color: 'var(--text-light)' }}>
              Sprzedawca: <strong>{reviewModal.sellerName}</strong>
            </p>
            
            {/* Gwiazdki */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                Ocena
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', fontSize: '2rem' }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <span
                    key={star}
                    onClick={() => setRating(star)}
                    style={{
                      cursor: 'pointer',
                      color: star <= rating ? '#fbbf24' : '#d1d5db'
                    }}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>

            {/* Komentarz */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                Opinia (opcjonalnie)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Napisz swoją opinię o sprzedawcy..."
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid var(--border-color)',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  minHeight: '100px',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={handleSubmitReview}
                className="btn"
                style={{ flex: 1, padding: '0.75rem' }}
              >
                Dodaj ocenę
              </button>
              <button
                onClick={() => setReviewModal(null)}
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

      {/* Modal komentarza produktu */}
      {commentModal && (
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
              Skomentuj produkt
            </h3>
            <p style={{ marginBottom: '1.5rem', color: 'var(--text-light)' }}>
              Produkt: <strong>{commentModal.productTitle}</strong>
            </p>
            
            {/* Komentarz */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                Twój komentarz *
              </label>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '0.5rem' }}>
                Komentarz będzie widoczny publicznie pod produktem
              </p>
              <textarea
                value={productComment}
                onChange={(e) => setProductComment(e.target.value)}
                placeholder="Podziel się swoją opinią o produkcie, jego jakości, użytkowaniu..."
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid var(--border-color)',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  minHeight: '150px',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={handleSubmitProductComment}
                className="btn"
                style={{ flex: 1, padding: '0.75rem' }}
                disabled={!productComment.trim()}
              >
                Dodaj komentarz
              </button>
              <button
                onClick={() => {
                  setCommentModal(null);
                  setProductComment('');
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
  );
}

