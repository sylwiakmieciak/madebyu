import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import '../style.css';

export default function Home() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slidesPerView, setSlidesPerView] = useState(3);
  const sliderRef = useRef(null);
  const autoPlayRef = useRef(null);

  useEffect(() => {
    loadCategories();
    loadFeaturedProducts();
    updateSlidesPerView();
    window.addEventListener('resize', updateSlidesPerView);
    return () => window.removeEventListener('resize', updateSlidesPerView);
  }, []);

  useEffect(() => {
    // Auto-play slider - powoli przesuwaj w lewo
    if (featuredProducts.length > 0) {
      autoPlayRef.current = setInterval(() => {
        nextSlide();
      }, 3000); // Zmiana co 3 sekundy

      return () => {
        if (autoPlayRef.current) {
          clearInterval(autoPlayRef.current);
        }
      };
    }
  }, [featuredProducts, currentSlide, slidesPerView]);

  const updateSlidesPerView = () => {
    const width = window.innerWidth;
    if (width < 768) {
      setSlidesPerView(1);
    } else if (width < 1200) {
      setSlidesPerView(2);
    } else {
      setSlidesPerView(3);
    }
  };

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
      console.log('Featured products length:', data.products?.length);
      setFeaturedProducts(data.products || []);
    } catch (error) {
      console.error('Błąd ładowania wyróżnionych produktów:', error);
      setFeaturedProducts([]);
    }
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => {
      const maxSlide = Math.max(0, featuredProducts.length - slidesPerView);
      return prev >= maxSlide ? 0 : prev + 1;
    });
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => {
      const maxSlide = Math.max(0, featuredProducts.length - slidesPerView);
      return prev <= 0 ? maxSlide : prev - 1;
    });
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
              Wybór Redakcji
            </h2>
            
            <div style={{ position: 'relative', maxWidth: '1400px', margin: '0 auto', overflow: 'hidden' }}>
              {/* Slider Container */}
              <div 
                ref={sliderRef}
                style={{
                  display: 'flex',
                  transition: 'transform 0.8s ease-in-out',
                  transform: `translateX(-${currentSlide * (100 / slidesPerView)}%)`,
                  gap: '1.5rem'
                }}
              >
                {featuredProducts.map(product => (
                  <div 
                    key={product.id}
                    style={{
                      minWidth: `calc(${100 / slidesPerView}% - ${(slidesPerView - 1) * 1.5 / slidesPerView}rem)`,
                      backgroundColor: 'white',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      cursor: 'pointer',
                      transition: 'transform 0.3s ease, box-shadow 0.3s ease'
                    }}
                    onClick={() => navigate(`/product/${product.id}`)}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-8px)';
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                    }}
                  >
                    {/* Product Image */}
                    <div style={{
                      position: 'relative',
                      height: '350px',
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
                        top: '15px',
                        left: '15px',
                        backgroundColor: '#fbbf24',
                        color: '#92400e',
                        padding: '0.4rem 0.8rem',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                      }}>Wybór Redakcji</span>
                    </div>
                    
                    {/* Product Info - Pod zdjęciem */}
                    <div style={{
                      padding: '1.5rem',
                      backgroundColor: 'white'
                    }}>
                      <h3 style={{
                        fontSize: '1.25rem',
                        fontWeight: 700,
                        marginBottom: '0.75rem',
                        color: 'var(--text-color)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {product.title}
                      </h3>
                      <p style={{
                        fontSize: '1.75rem',
                        fontWeight: 700,
                        color: 'var(--primary-color)',
                        marginBottom: '0.5rem'
                      }}>
                        {product.price} zł
                      </p>
                      <p style={{
                        fontSize: '0.875rem',
                        color: 'var(--text-light)',
                        marginBottom: '1rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        Sprzedawca: {product.seller?.username}
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/product/${product.id}`);
                        }}
                        style={{
                          width: '100%',
                          padding: '0.75rem 1.5rem',
                          backgroundColor: 'var(--primary-color)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '0.95rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.3s ease'
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
              {featuredProducts.length > slidesPerView && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '10px',
                  marginTop: '2rem'
                }}>
                  {Array.from({ length: Math.ceil(featuredProducts.length - slidesPerView + 1) }).map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
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
          <div 
            className="categories-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(8, 1fr)',
              gap: '1.5rem',
              marginTop: '3rem'
            }}
          >
            {categories.slice(0, 16).map(category => (
              <Link
                key={category.id}
                to={`/products?category=${category.id}`}
                className="category-card"
                style={{
                  textDecoration: 'none',
                  color: 'inherit',
                  padding: '1.5rem 1rem',
                  textAlign: 'center'
                }}
              >
                <h3 style={{ margin: 0 }}>{category.name}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
