import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CategoryBreadcrumb from '../components/CategoryBreadcrumb';
import SimpleImageUpload from '../components/SimpleImageUpload';
import RichTextEditor from '../components/RichTextEditor';
import '../dashboard.css';

export default function AddProduct({ user }) {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    stock_quantity: 1,
    images: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
  };

  const handleImagesChange = (images) => {
    setFormData(prev => ({ ...prev, images }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Walidacja
    if (!selectedCategory) {
      setError('Wybierz kategorie dla produktu');
      return;
    }

    if (formData.images.length === 0) {
      setError('Dodaj przynajmniej jedno zdjecie produktu');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');

      // Konwertuj pełne URLe na same ścieżki
      const imagePaths = formData.images.map(url => {
        if (url.startsWith('http://localhost:3001')) {
          return url.replace('http://localhost:3001', '');
        }
        return url;
      });

      const response = await fetch('http://localhost:3001/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          images: imagePaths,
          category_id: selectedCategory.id,
          price: parseFloat(formData.price),
          stock_quantity: parseInt(formData.stock_quantity)
        })
      });

      const data = await response.json();

      if (response.ok) {
        navigate('/dashboard');
      } else {
        setError(data.error || 'Nie udalo sie dodac produktu');
      }
    } catch (error) {
      console.error('Add product error:', error);
      setError('Blad polaczenia z serwerem');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="container" style={{ padding: '3rem 1rem', maxWidth: '900px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '2rem' }}>Dodaj nowy produkt</h1>

      {error && (
        <div style={{
          padding: '1rem',
          marginBottom: '1.5rem',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          color: '#991b1b'
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="form-group">
          <label htmlFor="title">Tytul *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            placeholder="Np. Recznie robiona miska ceramiczna"
          />
        </div>

        <div className="form-group">
          <label>Kategoria *</label>
          <CategoryBreadcrumb 
            selectedCategory={selectedCategory}
            onCategorySelect={handleCategorySelect} 
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Opis produktu</label>
          <RichTextEditor
            value={formData.description}
            onChange={handleChange}
            placeholder="Opisz swoj produkt - materialy, wymiary, sposob wykonania..."
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label htmlFor="price">Cena (PLN) *</label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              required
              min="0.01"
              step="0.01"
              placeholder="0.00"
            />
          </div>

          <div className="form-group">
            <label htmlFor="stock_quantity">Ilosc sztuk *</label>
            <input
              type="number"
              id="stock_quantity"
              name="stock_quantity"
              value={formData.stock_quantity}
              onChange={handleChange}
              required
              min="1"
              step="1"
            />
            <small style={{ color: 'var(--text-light)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              Produkt zostanie automatycznie zarchiwizowany gdy ilosc = 0
            </small>
          </div>
        </div>

        <div className="form-group">
          <label>Zdjecia produktu *</label>
          <SimpleImageUpload 
            selectedImages={formData.images} 
            onImagesChange={handleImagesChange}
            maxImages={5}
          />
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <button
            type="submit"
            disabled={loading}
            className="btn btn-full"
            style={{ flex: 1 }}
          >
            {loading ? 'Dodawanie...' : 'Dodaj produkt'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            style={{
              flex: 1,
              padding: '0.75rem',
              backgroundColor: 'transparent',
              border: '2px solid var(--border-color)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Anuluj
          </button>
        </div>
      </form>
    </div>
  );
}
