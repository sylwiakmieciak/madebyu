import { useState, useEffect } from 'react';
import './CategoryTree.css';

export default function CategoryTree({ selectedId, onSelect }) {
  const [categories, setCategories] = useState([]);
  const [expandedIds, setExpandedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('http://localhost:3001/api/categories');
      if (!response.ok) {
        throw new Error('Failed to load categories');
      }
      const data = await response.json();
      setCategories(data.tree || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
      setError('Nie udalo sie zaladowac kategorii');
    } finally {
      setLoading(false);
    }
  };

  const setExpanded = (categoryId) => {
    setExpandedIds([categoryId]);
  };

  const clearExpanded = () => {
    setExpandedIds([]);
  };

  const handleSelect = (category) => {
    onSelect(category);
  };

  const renderCategory = (category, level = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedIds.includes(category.id);
    const isSelected = selectedId === category.id;

    return (
      <div key={category.id} className="category-tree-item" style={{ '--level': level }}>
        <div 
          className={`category-node ${isSelected ? 'selected' : ''} ${hasChildren ? 'has-children' : ''}`}
          onClick={() => handleSelect(category)}
          onMouseEnter={() => hasChildren && setExpanded(category.id)}
          onMouseLeave={() => hasChildren && clearExpanded()}
        >
          <div className="category-content">
            {hasChildren && (
              <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>
                ▶
              </span>
            )}
            <span className="category-name">{category.name}</span>
          </div>
          {isSelected && (
            <span className="selected-badge">✓</span>
          )}
        </div>
        
        {hasChildren && isExpanded && (
          <div className="category-children">
            {category.children.map(child => renderCategory(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="category-tree">
      {loading ? (
        <div className="category-loading">Ladowanie kategorii...</div>
      ) : error ? (
        <div className="category-error">{error}</div>
      ) : categories.length === 0 ? (
        <div className="category-empty">Brak kategorii</div>
      ) : (
        categories.map(category => renderCategory(category))
      )}
    </div>
  );
}
