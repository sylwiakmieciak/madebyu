import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import '../style.css';

export default function Home() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const sliderRef = useRef(null);
  const autoPlayRef = useRef(null);

  useEffect(() => {
    loadCategories();
    loadFeaturedProducts();
  }, []);

  useEffect(() => {
    // Auto-play slider
    if (featuredProducts.length > 0) {
      autoPlayRef.current = setInterval(() => {
        nextSlide();
      }, 4000); // Change slide every 4 seconds

      return () => {
        if (autoPlayRef.current) {
          clearInterval(autoPlayRef.current);
        }
      };
    }
  }, [featuredProducts, currentSlide]);

  const loadCategories = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/categories');
      const data = await response.json();
      const mainCategories = data.tree.filter(cat => !cat.parent_id);
      
      const categoriesWithChildren = mainCategories.map(cat => ({
        ...cat,
        children: data.tree.filter(child => child.parent_id === cat.id)
      }));
      
      setCategories(categoriesWithChildren);
    } catch (error) {
      console.error('Błąd ładowania kategorii:', error);
    }
  };

  const loadFeaturedProducts = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/products/featured');
      const data = await response.json();
      console.log('Featured products loaded:', data.products);
      setFeaturedProducts(data.products || []);
    } catch (error) {
      console.error('Błąd ładowania wyróżnionych produktów:', error);
    }
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => 
      prev === featuredProducts.length - 1 ? 0 : prev + 1
    );
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => 
      prev === 0 ? featuredProducts.length - 1 : prev - 1
    );
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  const addToCart = (productId) => {
    console.log('Dodano do koszyka:', productId);
  };

  return (
    <main>
      {/* Wyróżniające się produkty - Slider */}
      {featuredProducts.length > 0 && (
        <section className="featured-products" style={{ paddingTop: '4rem', paddingBottom: '4rem' }}>
          <div className="container">
            <h2 style={{ textAlign: 'center', marginBottom: '3rem', fontSize: '2rem', fontWeight: 700 }}>
              ⭐ Wybór Redakcji
            </h2>
            
            <div style={{ position: 'relative', maxWidth: '1200px', margin: '0 auto' }}>
              {/* Slider Container */}
              <div style={{
                overflow: 'hidden',
                borderRadius: '16px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.15)'
              }}>
                <div 
                  ref={sliderRef}
                  style={{
                    display: 'flex',
                    transition: 'transform 0.5s ease-in-out',
                    transform: `translateX(-${currentSlide * 100}%)`
                  }}
                >
                  {featuredProducts.map(product => (
                    <div 
                      key={product.id}
                      style={{
                        minWidth: '100%',
                        display: 'grid',
                        gridTemplateColumns: window.innerWidth > 768 ? '1fr 1fr' : '1fr',
                        backgroundColor: 'white',
                        cursor: 'pointer'
                      }}
                      onClick={() => navigate(`/product/${product.id}`)}
                    >
                      {/* Product Image */}
                      <div style={{
                        position: 'relative',
                        height: '500px',
                        backgroundColor: 'var(--bg-light)',
                        overflow: 'hidden'
                      }}>
                        {product.images && product.images[0] && (
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
                        )}
                        <span style={{
                          position: 'absolute',
                          top: '20px',
                          left: '20px',
                          backgroundColor: '#fbbf24',
                          color: '#92400e',
                          padding: '0.5rem 1rem',
                          borderRadius: '8px',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                        }}>⭐ Wybór Redakcji</span>
                      </div>
                      
                      {/* Product Info */}
                      <div style={{
                        padding: '3rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        backgroundColor: 'white'
                      }}>
                        <h3 style={{
                          fontSize: '2rem',
                          fontWeight: 700,
                          marginBottom: '1rem',
                          color: 'var(--text-color)'
                        }}>
                          {product.title}
                        </h3>
                        <p style={{
                          fontSize: '2.5rem',
                          fontWeight: 700,
                          color: 'var(--primary-color)',
                          marginBottom: '1rem'
                        }}>
                          {product.price} zł
                        </p>
                        <p style={{
                          fontSize: '1rem',
                          color: 'var(--text-light)',
                          marginBottom: '2rem'
                        }}>
                          Sprzedawca: {product.seller?.username}
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/product/${product.id}`);
                          }}
                          style={{
                            padding: '1rem 2rem',
                            backgroundColor: 'var(--primary-color)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            alignSelf: 'flex-start'
                          }}
                          onMouseOver={(e) => e.target.style.backgroundColor = 'var(--primary-dark)'}
                          onMouseOut={(e) => e.target.style.backgroundColor = 'var(--primary-color)'}
                        >
                          Zobacz szczegóły →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Navigation Arrows */}
              {featuredProducts.length > 1 && (
                <>
                  <button
                    onClick={prevSlide}
                    style={{
                      position: 'absolute',
                      left: '20px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      border: 'none',
                      borderRadius: '50%',
                      width: '50px',
                      height: '50px',
                      fontSize: '1.5rem',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                      transition: 'all 0.3s ease',
                      zIndex: 10
                    }}
                    onMouseOver={(e) => {
                      e.target.style.backgroundColor = 'white';
                      e.target.style.transform = 'translateY(-50%) scale(1.1)';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
                      e.target.style.transform = 'translateY(-50%) scale(1)';
                    }}
                  >
                    ‹
                  </button>
                  <button
                    onClick={nextSlide}
                    style={{
                      position: 'absolute',
                      right: '20px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      border: 'none',
                      borderRadius: '50%',
                      width: '50px',
                      height: '50px',
                      fontSize: '1.5rem',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                      transition: 'all 0.3s ease',
                      zIndex: 10
                    }}
                    onMouseOver={(e) => {
                      e.target.style.backgroundColor = 'white';
                      e.target.style.transform = 'translateY(-50%) scale(1.1)';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
                      e.target.style.transform = 'translateY(-50%) scale(1)';
                    }}
                  >
                    ›
                  </button>
                </>
              )}

              {/* Dots Navigation */}
              {featuredProducts.length > 1 && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '10px',
                  marginTop: '2rem'
                }}>
                  {featuredProducts.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToSlide(index)}
                      style={{
                        width: currentSlide === index ? '40px' : '12px',
                        height: '12px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: currentSlide === index ? 'var(--primary-color)' : '#ddd',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Kategorie */}
      <section className="categories-section">
        <div className="container">
          <h2>Kategorie Produktów</h2>
          <div className="categories-grid">
            {categories.map(category => (
              <div key={category.id} className="category-card">
                <h3>{category.name}</h3>
                <ul style={{ listStyle: 'none', padding: 0, marginTop: '0.5rem' }}>
                  {category.children.slice(0, 4).map(child => (
                    <li key={child.id} style={{ 
                      fontSize: '0.9rem', 
                      color: 'var(--text-light)',
                      marginBottom: '0.25rem'
                    }}>
                      {child.name}
                    </li>
                  ))}
                </ul>
                <Link 
                  to={`/products?category=${category.id}`}
                  style={{
                    display: 'inline-block',
                    marginTop: '1rem',
                    color: 'var(--primary-color)',
                    fontWeight: 600,
                    textDecoration: 'none'
                  }}
                >
                  Zobacz wszystkie →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
