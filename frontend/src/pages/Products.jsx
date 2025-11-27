import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import '../style.css';

export default function Products({ user }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    const categoryParam = searchParams.get('category');
    const searchParam = searchParams.get('search');
    
    if (categoryParam) {
      setSelectedCategory(parseInt(categoryParam));
    } else {
      setSelectedCategory(null);
    }
    
    if (searchParam) {
      setSearchQuery(searchParam);
    } else {
      setSearchQuery('');
    }
  }, [searchParams]);

  useEffect(() => {
    loadProducts();
  }, [searchQuery, selectedCategory]);

  const loadCategories = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/categories');
      const data = await response.json();
      setCategories(data.tree || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      
      // Buduj URL z parametrami wyszukiwania
      let url = 'http://localhost:3001/api/products';
      const params = new URLSearchParams();
      
      if (searchQuery) {
        params.append('search', searchQuery);
      }
      
      if (selectedCategory) {
        const category = categories.find(c => c.id === selectedCategory);
        if (category) {
          // Zbierz slug głównej kategorii
          const slugs = [category.slug];
          
          // Dodaj slugi wszystkich podkategorii (rekurencyjnie)
          const getChildSlugs = (parentId) => {
            const children = categories.filter(c => c.parent_id === parentId);
            children.forEach(child => {
              slugs.push(child.slug);
              getChildSlugs(child.id); // rekurencja dla zagnieżdżonych
            });
          };
          
          getChildSlugs(category.id);
          params.append('categories', slugs.join(','));
        }
      }
      
      if (params.toString()) {
        url += '?' + params.toString();
      }
      
      const response = await fetch(url);
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId);
    setSearchQuery(''); // Wyczyść wyszukiwanie przy zmianie kategorii
    setCurrentPage(1); // Reset strony
    if (categoryId) {
      setSearchParams({ category: categoryId });
    } else {
      setSearchParams({});
    }
  };

  const filteredProducts = products;
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  return (
    <div className="container" style={{ padding: '3rem 1rem' }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '1rem' }}>
        {searchQuery ? `Wyniki wyszukiwania: "${searchQuery}"` : 'Wszystkie Produkty'}
      </h1>
      
      {searchQuery && (
        <div style={{ 
          marginBottom: '2rem',
          padding: '1rem',
          backgroundColor: 'var(--bg-light)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <p style={{ margin: 0, color: 'var(--text-color)' }}>
            Znaleziono <strong>{filteredProducts.length}</strong> {filteredProducts.length === 1 ? 'produkt' : 'produktów'}
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSearchParams({});
            }}
            style={{
              padding: '0.5rem 1rem',
              background: 'var(--primary-color)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Wyczyść wyszukiwanie
          </button>
        </div>
      )}

      {/* Filtry kategorii */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Kategorie:</h3>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => handleCategoryChange(null)}
            style={{
              padding: '0.5rem 1rem',
              background: !selectedCategory ? 'var(--primary-color)' : 'white',
              color: !selectedCategory ? 'white' : 'var(--primary-color)',
              border: '2px solid var(--primary-color)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600,
              transition: 'all 0.2s'
            }}
          >
            Wszystkie
          </button>
          {categories.filter(cat => !cat.parent_id).map(cat => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              style={{
                padding: '0.5rem 1rem',
                background: selectedCategory === cat.id ? 'var(--primary-color)' : 'white',
                color: selectedCategory === cat.id ? 'white' : 'var(--primary-color)',
                border: '2px solid var(--primary-color)',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600,
                transition: 'all 0.2s'
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Lista produktów */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Ładowanie produktów...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Brak produktów w tej kategorii</p>
        </div>
      ) : (
        <>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: '1.5rem',
            marginBottom: '3rem'
          }}>
            {currentProducts.map(product => (
              <div 
                key={product.id}
                className="product-card"
                onClick={() => navigate(`/product/${product.id}`)}
              >
                <div className="product-image">
                  {product.images && product.images[0] && (
                    <img 
                      src={product.images[0].image_url.startsWith('http') 
                        ? product.images[0].image_url 
                        : `http://localhost:3001${product.images[0].image_url}`}
                      alt={product.title}
                    />
                  )}
                </div>
                <div className="product-info">
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                    {product.title}
                  </h3>
                  <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                    {product.category?.name}
                  </p>
                  <p style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary-color)' }}>
                    {product.price} zł
                  </p>
                  <p style={{ 
                    fontSize: '0.85rem', 
                    color: product.stock_quantity > 0 ? '#4caf50' : '#f44336',
                    marginTop: '0.5rem'
                  }}>  
                    {product.stock_quantity > 0 ? `Dostępne: ${product.stock_quantity} szt.` : 'Brak w magazynie'}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Paginacja */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '0.5rem',
              marginTop: '2rem',
              paddingBottom: '2rem'
            }}>
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: currentPage === 1 ? '#e5e7eb' : 'var(--primary-color)',
                  color: currentPage === 1 ? '#9ca3af' : 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontWeight: 600
                }}
              >
                ← Poprzednia
              </button>

              <div style={{ display: 'flex', gap: '0.25rem' }}>
                {[...Array(totalPages)].map((_, index) => {
                  const pageNum = index + 1;
                  // Pokaż tylko 5 stron na raz
                  if (
                    pageNum === 1 || 
                    pageNum === totalPages || 
                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        style={{
                          padding: '0.5rem 0.75rem',
                          backgroundColor: currentPage === pageNum ? 'var(--primary-color)' : 'white',
                          color: currentPage === pageNum ? 'white' : 'var(--primary-color)',
                          border: '2px solid var(--primary-color)',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontWeight: 600,
                          minWidth: '40px'
                        }}
                      >
                        {pageNum}
                      </button>
                    );
                  } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                    return <span key={pageNum} style={{ padding: '0.5rem' }}>...</span>;
                  }
                  return null;
                })}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: currentPage === totalPages ? '#e5e7eb' : 'var(--primary-color)',
                  color: currentPage === totalPages ? '#9ca3af' : 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  fontWeight: 600
                }}
              >
                Następna →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
