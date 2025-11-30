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
  const [comments, setComments] = useState([]);
  const viewCountedRef = useRef(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentText, setEditingCommentText] = useState('');

  useEffect(() => {
    viewCountedRef.current = false; // Resetuj przy zmianie ID
    loadProduct();
    loadComments();
  }, [id]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = {};
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`http://localhost:3001/api/products/${id}`, {
        headers
      });
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
  const loadComments = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = {};
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(`http://localhost:3001/api/comments/product/${id}`, {
        headers
      });
      const data = await response.json();
      
      if (response.ok) {
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error('Failed to load comments:', error);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm('Czy na pewno chcesz usunąć ten komentarz?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        loadComments();
      } else {
        const data = await response.json();
        alert(data.message || 'Nie udało się usunąć komentarza');
      }
    } catch (error) {
      console.error('Failed to delete comment:', error);
      alert('Wystąpił błąd');
    }
  };

  const handleEditComment = async (commentId) => {
    if (!editingCommentText.trim()) {
      alert('Komentarz nie może być pusty');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ comment: editingCommentText })
      });

      const data = await response.json();

      if (response.ok) {
        setEditingCommentId(null);
        setEditingCommentText('');
        loadComments();
      } else {
        alert(data.message || 'Nie udało się zaktualizować komentarza');
      }
    } catch (error) {
      console.error('Failed to edit comment:', error);
      alert('Wystąpił błąd');
    }
  };

  const handleApproveComment = async (commentId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/comments/admin/${commentId}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        alert('Komentarz zatwierdzony!');
        loadComments();
      } else {
        const data = await response.json();
        alert(data.message || 'Błąd podczas zatwierdzania');
      }
    } catch (error) {
      console.error('Failed to approve comment:', error);
      alert('Wystąpił błąd');
    }
  };

  const handleRejectComment = async (commentId) => {
    if (!confirm('Czy na pewno chcesz odrzucić ten komentarz?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/comments/admin/${commentId}/reject`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        alert('Komentarz odrzucony!');
        loadComments();
      } else {
        const data = await response.json();
        alert(data.message || 'Błąd podczas odrzucania');
      }
    } catch (error) {
      console.error('Failed to reject comment:', error);
      alert('Wystąpił błąd');
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

  const handleAddToCart = async () => {
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
    window.dispatchEvent(new Event('cartUpdated'));

    // Synchronizuj z backendem jeśli zalogowany
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const productToAdd = cart.find(item => item.id === product.id);
        await fetch(`http://localhost:3001/api/cart/${product.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ quantity: productToAdd.quantity })
        });
      } catch (error) {
        console.error('Add to cart backend error:', error);
      }
    }
    
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
      {/* Breadcrumb + Moderacja buttons */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem',
          fontSize: '0.9rem',
          color: 'var(--text-light)'
        }}>
          {new URLSearchParams(window.location.search).get('from') === 'moderation' ? (
            <span 
              onClick={() => {
                navigate('/dashboard');
                setTimeout(() => {
                  const moderationTab = document.querySelector('[data-tab="moderation"]');
                  if (moderationTab) moderationTab.click();
                }, 100);
              }} 
              style={{ 
                cursor: 'pointer', 
                color: 'var(--primary-color)', 
                fontWeight: 700,
                fontSize: '1.1rem',
                padding: '0.5rem 1rem',
                backgroundColor: 'var(--primary-light)',
                borderRadius: '6px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--primary-color)'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'var(--primary-light)'}
            >
              ← Powrót do moderacji
            </span>
          ) : (
            <>
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
            </>
          )}
        </div>

        {user && (user.role === 'admin' || user.can_moderate_products) && product.status !== 'published' && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={async () => {
                try {
                  const token = localStorage.getItem('token');
                  const response = await fetch(`http://localhost:3001/api/moderation/products/${product.id}/approve`, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${token}` }
                  });
                  if (response.ok) {
                    alert('Produkt zaakceptowany!');
                    navigate('/dashboard?tab=moderation');
                  }
                } catch (error) {
                  console.error('Error:', error);
                  alert('Błąd podczas akceptacji');
                }
              }}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              ✓ Zaakceptuj
            </button>
            <button
              onClick={() => {
                const reason = prompt('Podaj powód odrzucenia:');
                if (reason) {
                  (async () => {
                    try {
                      const token = localStorage.getItem('token');
                      const response = await fetch(`http://localhost:3001/api/moderation/products/${product.id}/reject`, {
                        method: 'PUT',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({ reason })
                      });
                      if (response.ok) {
                        alert('Produkt odrzucony!');
                        navigate('/dashboard?tab=moderation');
                      }
                    } catch (error) {
                      console.error('Error:', error);
                      alert('Błąd podczas odrzucania');
                    }
                  })();
                }
              }}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              ✗ Odrzuć
            </button>
          </div>
        )}
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

          <p style={{ 
            fontSize: '1rem', 
            color: 'var(--text-light)',
            marginBottom: '1.5rem'
          }}>
            Kategoria: <span style={{ color: 'var(--primary-color)' }}>{product.category?.name || product.Category?.name || 'Nieznana'}</span>
          </p>

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
              {product.is_featured ? 'Wybór redakcji' : 'Dodaj do wyborów redakcji'}
            </button>
          )}

          {/* Informacje o sprzedawcy */}
          {(product.seller || product.User) && (
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                {(product.seller?.avatar_url || product.User?.avatar_url) ? (
                  <img
                    src={product.seller?.avatar_url || product.User?.avatar_url}
                    alt={product.seller?.username || product.User?.username}
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
                <div style={{ flex: 1 }}>
                  <p style={{ 
                    fontSize: '1.1rem', 
                    fontWeight: 600,
                    color: 'var(--text-color)'
                  }}>
                    {product.seller?.username || product.User?.username}
                  </p>
                  {(product.seller?.bio || product.User?.bio) && (
                    <p style={{
                      fontSize: '0.9rem',
                      color: 'var(--text-light)',
                      marginTop: '0.25rem'
                    }}>
                      {product.seller?.bio || product.User?.bio}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => navigate(`/user/${product.seller?.id || product.User?.id}`)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'var(--primary-color)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'var(--primary-dark)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'var(--primary-color)'}
              >
                Zobacz profil sprzedawcy
              </button>
            </div>
          )}

          {/* Wyświetlenia */}
          <p style={{ 
            fontSize: '0.9rem', 
            color: 'var(--text-light)',
            marginTop: '1rem'
          }}>
            Wyświetlenia: {product.views_count || 0}
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
          <div 
            style={{ 
              fontSize: '1.05rem', 
              lineHeight: 1.8,
              color: 'var(--text-color)'
            }}
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
        </div>
      )}
      {/* Sekcja komentarzy produktu */}
      <div style={{ 
        marginTop: '4rem', 
        padding: '2rem', 
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
      }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '1.5rem' }}>
          Komentarze ({comments.length})
        </h2>

        <div style={{
          padding: '1.5rem',
          backgroundColor: 'var(--bg-light)',
          borderRadius: '8px',
          textAlign: 'center',
          marginBottom: '2rem'
        }}>
          <p style={{ margin: 0, color: 'var(--text-light)' }}>
            Możesz dodać komentarz po zakupie tego produktu
          </p>
        </div>

        {/* Lista komentarzy */}
        {comments.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-light)', padding: '2rem' }}>
            Brak komentarzy. Bądź pierwszy!
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {comments.map(comment => (
              <div 
                key={comment.id}
                style={{
                  padding: '1.5rem',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  position: 'relative',
                  backgroundColor: !comment.approved ? '#fef3c7' : 'white',
                  opacity: !comment.approved ? 0.9 : 1
                }}
              >
                {!comment.approved && (
                  <div style={{
                    position: 'absolute',
                    top: '0.75rem',
                    right: '0.75rem',
                    padding: '0.25rem 0.75rem',
                    backgroundColor: '#f59e0b',
                    color: 'white',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: 600
                  }}>
                    Oczekuje na moderację
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                  <img
                    src={comment.User?.avatar_url || 'https://via.placeholder.com/40'}
                    alt={comment.User?.full_name || comment.User?.username}
                    style={{ 
                      width: '40px', 
                      height: '40px', 
                      borderRadius: '50%',
                      objectFit: 'cover'
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>
                      {comment.User?.full_name || comment.User?.username}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>
                      {new Date(comment.created_at).toLocaleDateString('pl-PL', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                  {user && (
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {/* Przyciski moderacji dla adminów/moderatorów */}
                      {!comment.approved && (user.role === 'admin' || user.can_moderate_comments) && (
                        <>
                          <button
                            onClick={() => handleApproveComment(comment.id)}
                            style={{
                              padding: '0.5rem 1rem',
                              backgroundColor: '#10b981',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '0.875rem',
                              cursor: 'pointer',
                              fontWeight: 600
                            }}
                          >
                            ✓ Akceptuj
                          </button>
                          <button
                            onClick={() => handleRejectComment(comment.id)}
                            style={{
                              padding: '0.5rem 1rem',
                              backgroundColor: '#f59e0b',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              fontSize: '0.875rem',
                              cursor: 'pointer',
                              fontWeight: 600
                            }}
                          >
                            ✗ Odrzuć
                          </button>
                        </>
                      )}
                      
                      {/* Przyciski edycji/usuwania */}
                      {user.id === comment.user_id && !comment.approved && (
                        <button
                          onClick={() => {
                            setEditingCommentId(comment.id);
                            setEditingCommentText(comment.comment);
                          }}
                          style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '0.875rem',
                            cursor: 'pointer'
                          }}
                        >
                          Edytuj
                        </button>
                      )}
                      {(user.id === comment.user_id || user.role === 'admin') && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '0.875rem',
                            cursor: 'pointer'
                          }}
                        >
                          Usuń
                        </button>
                      )}
                    </div>
                  )}
                </div>
                {editingCommentId === comment.id ? (
                  <div style={{ marginTop: '1rem' }}>
                    <textarea
                      value={editingCommentText}
                      onChange={(e) => setEditingCommentText(e.target.value)}
                      style={{
                        width: '100%',
                        minHeight: '100px',
                        padding: '0.75rem',
                        border: '1px solid var(--border-color)',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        fontFamily: 'inherit',
                        resize: 'vertical',
                        marginBottom: '0.5rem'
                      }}
                    />
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleEditComment(comment.id)}
                        style={{
                          padding: '0.5rem 1rem',
                          backgroundColor: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '0.875rem',
                          cursor: 'pointer'
                        }}
                      >
                        Zapisz
                      </button>
                      <button
                        onClick={() => {
                          setEditingCommentId(null);
                          setEditingCommentText('');
                        }}
                        style={{
                          padding: '0.5rem 1rem',
                          backgroundColor: '#6b7280',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '0.875rem',
                          cursor: 'pointer'
                        }}
                      >
                        Anuluj
                      </button>
                    </div>
                  </div>
                ) : (
                  <p style={{ margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                    {comment.comment}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

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
