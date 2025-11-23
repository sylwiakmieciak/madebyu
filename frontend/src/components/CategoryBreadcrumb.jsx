import { useState, useEffect } from 'react';
import './CategoryBreadcrumb.css';

export default function CategoryBreadcrumb({ onCategorySelect, selectedCategory }) {
  const [allCategories, setAllCategories] = useState([]);
  const [currentLevel, setCurrentLevel] = useState([]);
  const [breadcrumb, setBreadcrumb] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/categories');
      const data = await response.json();
      
      console.log('Odpowiedź API:', data);
      
      // Użyj flat zamiast tree, aby mieć płaską listę wszystkich kategorii
      const flatCategories = data.flat || [];
      console.log('Płaska lista kategorii:', flatCategories);
      
      setAllCategories(flatCategories);
      const mainCategories = flatCategories.filter(cat => cat.parent_id === null || cat.parent_id === undefined);
      console.log('Główne kategorie:', mainCategories);
      setCurrentLevel(mainCategories);
      setLoading(false);
    } catch (error) {
      console.error('Błąd ładowania kategorii:', error);
      setLoading(false);
    }
  };

  const handleCategoryClick = (category) => {
    console.log('Kliknięto kategorię:', category);
    const children = allCategories.filter(cat => cat.parent_id === category.id);
    console.log('Znalezione podkategorie (parent_id=' + category.id + '):', children);
    
    if (children.length > 0) {
      setCurrentLevel(children);
      setBreadcrumb([...breadcrumb, category]);
    } else {
      console.log('Wybrano końcową kategorię:', category);
      onCategorySelect(category);
    }
  };

  const handleBreadcrumbClick = (index) => {
    console.log('Kliknięto breadcrumb na index:', index);
    if (index === -1) {
      const mainCategories = allCategories.filter(cat => cat.parent_id === null || cat.parent_id === undefined);
      console.log('Powrót do głównych kategorii:', mainCategories);
      setCurrentLevel(mainCategories);
      setBreadcrumb([]);
    } else {
      const category = breadcrumb[index];
      console.log('Powrót do kategorii:', category);
      const children = allCategories.filter(cat => cat.parent_id === category.id);
      console.log('Podkategorie tej kategorii:', children);
      setCurrentLevel(children);
      setBreadcrumb(breadcrumb.slice(0, index + 1));
    }
  };

  const handleChangeCategory = () => {
    onCategorySelect(null);
    const mainCategories = allCategories.filter(cat => cat.parent_id === null || cat.parent_id === undefined);
    setCurrentLevel(mainCategories);
    setBreadcrumb([]);
  };

  if (loading) {
    return <div className="category-loading">Ładowanie kategorii...</div>;
  }

  if (selectedCategory) {
    return (
      <div className="category-selected">
        <div className="selected-info">
          <span className="selected-label">Wybrano kategorię:</span>
          <span className="selected-name">{selectedCategory.name}</span>
        </div>
        <button 
          type="button"
          className="change-category-btn"
          onClick={handleChangeCategory}
        >
          Zmień
        </button>
      </div>
    );
  }

  return (
    <div className="category-breadcrumb">
      {/* Breadcrumb nawigacja */}
      <div className="breadcrumb-path">
        <span 
          className={breadcrumb.length === 0 ? "breadcrumb-item" : "breadcrumb-item clickable"}
          onClick={() => breadcrumb.length > 0 && handleBreadcrumbClick(-1)}
        >
          Kategorie
        </span>
        {breadcrumb.map((cat, index) => (
          <span key={cat.id}>
            <span className="breadcrumb-separator">→</span>
            <span 
              className="breadcrumb-item clickable"
              onClick={() => handleBreadcrumbClick(index)}
            >
              {cat.name}
            </span>
          </span>
        ))}
      </div>

      {/* Lista kategorii */}
      <div className="categories-grid">
        {currentLevel.length === 0 ? (
          <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#999' }}>
            Brak kategorii do wyświetlenia
          </p>
        ) : (
          currentLevel.map((category) => {
            const hasChildren = allCategories.filter(cat => cat.parent_id === category.id).length > 0;
            return (
              <div
                key={category.id}
                className={`category-tile ${hasChildren ? 'has-children' : 'is-final'}`}
                onClick={() => handleCategoryClick(category)}
              >
                <div className="category-name">{category.name}</div>
                {hasChildren && <span className="arrow-icon">→</span>}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
