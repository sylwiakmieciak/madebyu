import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import '../dashboard.css';

export default function UserProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserProfile();
  }, [userId]);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      
      const [userResponse, productsResponse, reviewsResponse] = await Promise.all([
        fetch(`http://localhost:3001/api/auth/user/${userId}`),
        fetch(`http://localhost:3001/api/products?seller=${userId}`),
        fetch(`http://localhost:3001/api/reviews/seller/${userId}`)
      ]);

      const userData = await userResponse.json();
      const productsData = await productsResponse.json();
      const reviewsData = await reviewsResponse.json();

      setUser(userData.user || userData);
      setProducts(productsData.products || []);
      setReviews(reviewsData.reviews || []);
      setReviewStats(reviewsData.stats || null);
    } catch (error) {
      console.error('Failed to load user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    return (
      <div style={{ display: 'flex', gap: '2px', fontSize: '1.2rem' }}>
        {[1, 2, 3, 4, 5].map(star => (
          <span key={star} style={{ color: star <= rating ? '#fbbf24' : '#d1d5db' }}>
            ★
          </span>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Ładowanie profilu...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <p>Nie znaleziono użytkownika</p>
        <button onClick={() => navigate('/')} className="btn">
          Powrót do strony głównej
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '2rem' }}>
        
        {/* LEWA KOLUMNA - Profil */}
        <div>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '2rem',
            border: '1px solid var(--border-color)',
            position: 'sticky',
            top: '2rem'
          }}>
            {/* Avatar */}
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              {user.avatar_url ? (
                <img
                  src={user.avatar_url.startsWith('http') 
                    ? user.avatar_url 
                    : `http://localhost:3001${user.avatar_url}`}
                  alt={user.username}
                  style={{
                    width: '150px',
                    height: '150px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '4px solid var(--primary-color)'
                  }}
                />
              ) : (
                <div style={{
                  width: '150px',
                  height: '150px',
                  borderRadius: '50%',
                  background: 'var(--bg-cream)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto',
                  fontSize: '4rem',
                  color: 'var(--text-light)',
                  border: '4px solid var(--primary-color)'
                }}>
                  {user.username?.[0]?.toUpperCase()}
                </div>
              )}
            </div>

            {/* Nazwa użytkownika */}
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, textAlign: 'center', marginBottom: '0.5rem' }}>
              {user.full_name || user.username}
            </h1>
            <p style={{ textAlign: 'center', color: 'var(--text-light)', marginBottom: '1rem' }}>
              @{user.username}
            </p>

            {/* Powitanie */}
            {user.greeting && (
              <div style={{
                padding: '1rem',
                background: 'var(--bg-light)',
                borderRadius: '8px',
                marginBottom: '1.5rem',
                textAlign: 'center',
                fontStyle: 'italic',
                color: 'var(--text-light)'
              }}>
                {user.greeting}
              </div>
            )}

            {/* Opis */}
            {user.bio && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                  O mnie
                </h3>
                <p style={{ color: 'var(--text-light)', lineHeight: '1.6', fontSize: '0.95rem' }}>
                  {user.bio}
                </p>
              </div>
            )}

            {/* Statystyki ocen */}
            {reviewStats && reviewStats.total > 0 && (
              <div style={{
                padding: '1.5rem',
                background: 'var(--bg-cream)',
                borderRadius: '8px',
                marginTop: '1.5rem'
              }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
                  Oceny
                </h3>
                <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '3rem', fontWeight: 700, color: 'var(--primary-color)' }}>
                    {reviewStats.average}
                  </div>
                  {renderStars(Math.round(reviewStats.average))}
                  <p style={{ marginTop: '0.5rem', color: 'var(--text-light)', fontSize: '0.9rem' }}>
                    na podstawie {reviewStats.total} {reviewStats.total === 1 ? 'oceny' : 'ocen'}
                  </p>
                </div>

                {/* Rozkład ocen */}
                <div style={{ marginTop: '1rem' }}>
                  {[5, 4, 3, 2, 1].map(rating => {
                    const count = reviewStats.distribution[rating] || 0;
                    const percentage = reviewStats.total > 0 ? (count / reviewStats.total) * 100 : 0;
                    return (
                      <div key={rating} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.9rem', width: '20px' }}>{rating}</span>
                        <span style={{ color: '#fbbf24' }}>★</span>
                        <div style={{
                          flex: 1,
                          height: '8px',
                          background: '#e5e7eb',
                          borderRadius: '4px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            height: '100%',
                            width: `${percentage}%`,
                            background: '#fbbf24',
                            borderRadius: '4px'
                          }} />
                        </div>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-light)', width: '30px', textAlign: 'right' }}>
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Statystyki produktów */}
            <div style={{
              padding: '1.5rem',
              background: 'var(--bg-light)',
              borderRadius: '8px',
              marginTop: '1.5rem'
            }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
                Produkty
              </h3>
              <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary-color)', textAlign: 'center' }}>
                {products.length}
              </p>
              <p style={{ textAlign: 'center', color: 'var(--text-light)', fontSize: '0.9rem' }}>
                aktywnych ogłoszeń
              </p>
            </div>
          </div>
        </div>

        {/* PRAWA KOLUMNA - Oceny */}
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '1.5rem' }}>
            Opinie kupujących
          </h2>

          {!reviews || reviews.length === 0 ? (
            <div style={{
              padding: '3rem',
              textAlign: 'center',
              background: 'white',
              borderRadius: '12px',
              border: '1px solid var(--border-color)'
            }}>
              <p style={{ color: 'var(--text-light)', fontSize: '1.1rem' }}>
                Brak opinii
              </p>
              <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                Ten sprzedawca nie otrzymał jeszcze żadnych ocen
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {reviews.map(review => (
                <div
                  key={review.id}
                  style={{
                    padding: '1.5rem',
                    background: 'white',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  {/* Nagłówek oceny */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      {review.buyer?.avatar_url ? (
                        <img
                          src={review.buyer.avatar_url}
                          alt={review.buyer.full_name || review.buyer.username}
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            objectFit: 'cover'
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '50%',
                          background: 'var(--bg-cream)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.5rem',
                          color: 'var(--text-light)'
                        }}>
                          {(review.buyer?.full_name || review.buyer?.username)?.[0]?.toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                          {review.buyer?.full_name || review.buyer?.username}
                        </p>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>
                          {new Date(review.createdAt || review.created_at).toLocaleDateString('pl-PL')}
                        </p>
                      </div>
                    </div>
                    {renderStars(review.rating)}
                  </div>

                  {/* Komentarz */}
                  {review.comment && (
                    <p style={{
                      color: 'var(--text-color)',
                      lineHeight: '1.6',
                      fontSize: '0.95rem',
                      marginTop: '1rem'
                    }}>
                      {review.comment}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Inne ogłoszenia sprzedawcy */}
          {products.length > 0 && (
            <div style={{ marginTop: '3rem' }}>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '1.5rem' }}>
                Inne ogłoszenia tego sprzedawcy
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1.5rem' }}>
                {products.slice(0, 6).map(product => (
                  <div
                    key={product.id}
                    onClick={() => navigate(`/products/${product.id}`)}
                    style={{
                      background: 'white',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      border: '1px solid var(--border-color)',
                      cursor: 'pointer',
                      transition: 'transform 0.2s, box-shadow 0.2s'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{
                      width: '100%',
                      height: '200px',
                      background: 'var(--bg-light)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden'
                    }}>
                      {product.images && product.images[0] ? (
                        <img
                          src={product.images[0].image_url.startsWith('http') 
                            ? product.images[0].image_url 
                            : `http://localhost:3001${product.images[0].image_url}`}
                          alt={product.title}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                      ) : (
                        <span style={{ fontSize: '3rem', color: 'var(--text-light)' }}>📦</span>
                      )}
                    </div>
                    <div style={{ padding: '1rem' }}>
                      <h3 style={{
                        fontSize: '1rem',
                        fontWeight: 600,
                        marginBottom: '0.5rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {product.title}
                      </h3>
                      <p style={{
                        fontSize: '1.25rem',
                        fontWeight: 700,
                        color: 'var(--primary-color)'
                      }}>
                        {product.price} zł
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
