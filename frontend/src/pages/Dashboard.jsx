import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import '../dashboard.css';

// Sortable Item Component
function SortableProduct({ product }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: product.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="featured-product-item"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'grab' }}>
        <div style={{ fontSize: '1.5rem', color: '#999' }}>⋮⋮</div>
        {product.images?.[0] && (
          <img
            src={product.images[0].image_url.startsWith('http') 
              ? product.images[0].image_url 
              : `http://localhost:3001${product.images[0].image_url}`}
            alt={product.title}
            style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }}
          />
        )}
        <div style={{ flex: 1 }}>
          <h4 style={{ margin: 0 }}>{product.title}</h4>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-light)' }}>
            {product.price} zł • {product.seller?.username}
          </p>
        </div>
      </div>
    </div>
  );
}

// Categories Management Component
function CategoriesManagement() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parent_id: null,
    icon: '',
    display_order: 0,
    is_active: true
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/categories/admin/all', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setCategories(data.categories || []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading categories:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    try {
      const url = editingCategory 
        ? `http://localhost:3001/api/categories/${editingCategory.id}`
        : 'http://localhost:3001/api/categories';
      
      const response = await fetch(url, {
        method: editingCategory ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert(editingCategory ? 'Kategoria zaktualizowana!' : 'Kategoria dodana!');
        setShowAddModal(false);
        setEditingCategory(null);
        setFormData({
          name: '',
          description: '',
          parent_id: null,
          icon: '',
          display_order: 0,
          is_active: true
        });
        loadCategories();
      } else {
        const data = await response.json();
        alert(data.error || 'Błąd podczas zapisywania kategorii');
      }
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Błąd podczas zapisywania kategorii');
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      parent_id: category.parent_id,
      icon: category.icon || '',
      display_order: category.display_order,
      is_active: category.is_active
    });
    setShowAddModal(true);
  };

  const handleAddSubcategory = (parentId) => {
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      parent_id: parentId,
      icon: '',
      display_order: 0,
      is_active: true
    });
    setShowAddModal(true);
  };

  const handleDelete = async (categoryId) => {
    if (!confirm('Czy na pewno chcesz usunąć tę kategorię?')) return;

    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`http://localhost:3001/api/categories/${categoryId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        alert('Kategoria usunięta!');
        loadCategories();
      } else {
        const data = await response.json();
        alert(data.error || 'Błąd podczas usuwania kategorii');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Błąd podczas usuwania kategorii');
    }
  };

  const toggleExpand = (categoryId) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const getSubcategories = (parentId) => {
    return categories.filter(cat => cat.parent_id === parentId);
  };

  const getCategoryPath = (categoryId) => {
    const path = [];
    let current = categories.find(c => c.id === categoryId);
    while (current) {
      path.unshift(current);
      current = categories.find(c => c.id === current.parent_id);
    }
    return path;
  };

  const getAllAvailableParents = (excludeId = null) => {
    // Funkcja sprawdzająca czy kategoria jest potomkiem danej kategorii
    const isDescendant = (categoryId, potentialAncestorId) => {
      let current = categories.find(c => c.id === categoryId);
      while (current && current.parent_id) {
        if (current.parent_id === potentialAncestorId) return true;
        current = categories.find(c => c.id === current.parent_id);
      }
      return false;
    };

    return categories.filter(cat => {
      if (excludeId && (cat.id === excludeId || isDescendant(cat.id, excludeId))) {
        return false;
      }
      return true;
    });
  };

  const renderCategoryTree = (parentId = null, level = 0) => {
    const cats = getSubcategories(parentId);
    if (cats.length === 0) return null;

    return cats.map(cat => {
      const hasChildren = getSubcategories(cat.id).length > 0;
      const isExpanded = expandedCategories.has(cat.id);
      const indent = level * 2;

      return (
        <div key={cat.id} style={{ marginBottom: '0.5rem' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.75rem 1rem',
            paddingLeft: `${1 + indent}rem`,
            backgroundColor: level === 0 ? 'var(--bg-cream)' : '#f9fafb',
            borderRadius: '8px',
            borderLeft: level > 0 ? `3px solid var(--primary-color)` : 'none',
            marginLeft: level > 0 ? `${indent}rem` : '0'
          }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {hasChildren && (
                <button
                  onClick={() => toggleExpand(cat.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    padding: '0',
                    color: 'var(--text-dark)',
                    width: '20px',
                    textAlign: 'center'
                  }}
                >
                  {isExpanded ? '▼' : '▶'}
                </button>
              )}
              {!hasChildren && <span style={{ width: '20px' }}></span>}
              
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ 
                    fontWeight: level === 0 ? 600 : 500,
                    fontSize: level === 0 ? '1.1rem' : '1rem'
                  }}>
                    {cat.name}
                  </span>
                  {!cat.is_active && (
                    <span style={{
                      padding: '0.2rem 0.4rem',
                      fontSize: '0.7rem',
                      backgroundColor: '#ef4444',
                      color: 'white',
                      borderRadius: '4px'
                    }}>
                      Nieaktywna
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
              <button
                onClick={() => handleAddSubcategory(cat.id)}
                className="btn"
                style={{ 
                  padding: '0.4rem 0.8rem', 
                  fontSize: '0.85rem',
                  backgroundColor: '#10b981'
                }}
              >
                + Podkategoria
              </button>
              <button
                onClick={() => handleEdit(cat)}
                className="btn"
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
              >
                Edytuj
              </button>
              <button
                onClick={() => handleDelete(cat.id)}
                className="btn"
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', backgroundColor: '#ef4444' }}
              >
                Usuń
              </button>
            </div>
          </div>
          
          {hasChildren && isExpanded && (
            <div style={{ marginTop: '0.5rem' }}>
              {renderCategoryTree(cat.id, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '3rem' }}>Ładowanie...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Zarządzanie Kategoriami</h2>
        <button
          onClick={() => {
            setEditingCategory(null);
            setFormData({
              name: '',
              description: '',
              parent_id: null,
              icon: '',
              display_order: 0,
              is_active: true
            });
            setShowAddModal(true);
          }}
          className="btn"
        >
          + Dodaj kategorię główną
        </button>
      </div>

      {/* Categories Tree */}
      <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        {categories.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-light)' }}>
            Brak kategorii. Dodaj pierwszą kategorię!
          </div>
        ) : (
          renderCategoryTree()
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h3 style={{ marginTop: 0, fontSize: '1.5rem', fontWeight: 700 }}>
              {editingCategory ? 'Edytuj kategorię' : 'Dodaj nową kategorię'}
            </h3>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                  Nazwa *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border-light)',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                  Kategoria nadrzędna
                </label>
                <select
                  value={formData.parent_id || ''}
                  onChange={(e) => setFormData({ ...formData, parent_id: e.target.value ? parseInt(e.target.value) : null })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border-light)',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                >
                  <option value="">Brak (kategoria główna)</option>
                  {getAllAvailableParents(editingCategory?.id).map(cat => {
                    const path = getCategoryPath(cat.id);
                    const breadcrumb = path.map(p => p.name).join(' > ');
                    return (
                      <option key={cat.id} value={cat.id}>
                        {breadcrumb}
                      </option>
                    );
                  })}
                </select>
                <small style={{ display: 'block', marginTop: '0.25rem', color: 'var(--text-light)', fontSize: '0.85rem' }}>
                  Wybierz kategorię, w której ma się znajdować ta kategoria
                </small>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>
                  Kolejność wyświetlania
                </label>
                <input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid var(--border-light)',
                    borderRadius: '8px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <span style={{ fontWeight: 500 }}>Kategoria aktywna</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingCategory(null);
                  }}
                  className="btn"
                  style={{ backgroundColor: '#9ca3af', color: 'white' }}
                >
                  Anuluj
                </button>
                <button type="submit" className="btn">
                  {editingCategory ? 'Zapisz zmiany' : 'Dodaj kategorię'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Dashboard({ user, refreshUser }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [themes, setThemes] = useState([]);
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [products, setProducts] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [newTheme, setNewTheme] = useState({
    name: '',
    primary_color: '#8b6f47',
    secondary_color: '#a0826d',
    accent_color: '#c9a882'
  });
  const [profileData, setProfileData] = useState({
    username: user?.username || '',
    full_name: user?.full_name || '',
    bio: user?.bio || '',
    avatar_url: user?.avatar_url || '',
    greeting: user?.greeting || 'Witaj na moim profilu! 👋'
  });
  const [profileMessage, setProfileMessage] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  
  // Moderation states
  const [moderationProducts, setModerationProducts] = useState([]);
  const [moderationStatus, setModerationStatus] = useState('pending');
  const [moderationStats, setModerationStats] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedProductForRejection, setSelectedProductForRejection] = useState(null);
  
  // Admin states
  const [allUsers, setAllUsers] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [moderatorCategories, setModeratorCategories] = useState([]);
  
  // Purchases states
  const [purchases, setPurchases] = useState([]);
  const [selectedOrderForReview, setSelectedOrderForReview] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Comments moderation states
  const [pendingComments, setPendingComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  
  // Featured products sort state
  const [featuredSortBy, setFeaturedSortBy] = useState(() => {
    return localStorage.getItem('featuredSortBy') || 'manual';
  });

  useEffect(() => {
    if (user?.role === 'admin') {
      localStorage.setItem('featuredSortBy', featuredSortBy);
      loadFeaturedProducts(featuredSortBy);
    }
  }, [featuredSortBy]);

  useEffect(() => {
    if (user) {
      loadThemes();
      loadUserTheme();
      loadMyProducts();
      loadArchivedProducts();
      loadPurchases();
      if (user.role === 'admin') {
        loadFeaturedProducts();
        loadAllProducts();
        loadAllUsers();
        loadAllCategories();
        loadPendingComments();
        loadModerationStats();
        loadModerationProducts();
      } else {
        // Load specific resources based on permissions
        if (user.can_moderate_products) {
          loadModerationStats();
          loadModerationProducts();
        }
        if (user.can_moderate_comments) {
          loadPendingComments();
        }
      }
    }
  }, [user]);

  useEffect(() => {
    // Zastosuj kolory aktualnego motywu po załadowaniu
    if (selectedTheme) {
      applyTheme(selectedTheme);
    }
  }, [selectedTheme]);

  const loadThemes = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/themes');
      const data = await response.json();
      setThemes(data.themes);
    } catch (error) {
      console.error('Failed to load themes:', error);
    }
  };

  const loadUserTheme = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/themes/my', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setSelectedTheme(data.theme);
    } catch (error) {
      console.error('Failed to load user theme:', error);
    }
  };

  const loadMyProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/products/my', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  const [archivedProducts, setArchivedProducts] = useState([]);
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [productToRestore, setProductToRestore] = useState(null);
  const [newStock, setNewStock] = useState('');

  const loadArchivedProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/products/my', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setArchivedProducts((data.products || []).filter(p => p.status === 'archived'));
    } catch (error) {
      console.error('Failed to load archived products:', error);
    }
  };

  const loadFeaturedProducts = async (sortBy = featuredSortBy) => {
    try {
      const response = await fetch(`http://localhost:3001/api/products/featured?sortBy=${sortBy}`);
      const data = await response.json();
      setFeaturedProducts(data.products || []);
    } catch (error) {
      console.error('Failed to load featured products:', error);
    }
  };

  const loadAllProducts = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/products?status=published');
      const data = await response.json();
      setAllProducts(data.products || []);
    } catch (error) {
      console.error('Failed to load all products:', error);
    }
  };

  const loadModerationStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/moderation/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setModerationStats(data);
    } catch (error) {
      console.error('Failed to load moderation stats:', error);
    }
  };

  const loadModerationProducts = async (status = 'pending') => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/moderation/products?status=${status}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setModerationProducts(data.products || []);
    } catch (error) {
      console.error('Failed to load moderation products:', error);
    }
  };

  const loadAllUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setAllUsers(data.users || []);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const loadAllCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/admin/categories', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setAllCategories(data.categories || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadPendingComments = async () => {
    setLoadingComments(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/comments/admin/pending', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setPendingComments(data.comments || []);
    } catch (error) {
      console.error('Failed to load pending comments:', error);
      alert('Błąd podczas ładowania komentarzy');
    } finally {
      setLoadingComments(false);
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
        alert('Komentarz został zatwierdzony');
        loadPendingComments();
      } else {
        const data = await response.json();
        alert(data.message || 'Błąd podczas zatwierdzania komentarza');
      }
    } catch (error) {
      console.error('Failed to approve comment:', error);
      alert('Wystąpił błąd podczas zatwierdzania komentarza');
    }
  };

  const handleRejectComment = async (commentId) => {
    if (!confirm('Czy na pewno chcesz odrzucić i usunąć ten komentarz?')) {
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
        alert('Komentarz został odrzucony');
        loadPendingComments();
      } else {
        const data = await response.json();
        alert(data.message || 'Błąd podczas odrzucania komentarza');
      }
    } catch (error) {
      console.error('Failed to reject comment:', error);
      alert('Wystąpił błąd podczas odrzucania komentarza');
    }
  };

  const handleApproveProduct = async (productId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/moderation/products/${productId}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        alert('Produkt został zaakceptowany');
        loadModerationProducts(moderationStatus);
        loadModerationStats();
      } else {
        const data = await response.json();
        alert(data.message || 'Błąd podczas akceptacji produktu');
      }
    } catch (error) {
      console.error('Failed to approve product:', error);
      alert('Błąd podczas akceptacji produktu');
    }
  };

  const handleRejectProduct = async () => {
    if (!rejectionReason.trim()) {
      alert('Podaj powód odrzucenia');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/moderation/products/${selectedProductForRejection}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: rejectionReason })
      });
      if (response.ok) {
        alert('Produkt został odrzucony');
        setSelectedProductForRejection(null);
        setRejectionReason('');
        loadModerationProducts(moderationStatus);
        loadModerationStats();
      } else {
        const data = await response.json();
        alert(data.message || 'Błąd podczas odrzucania produktu');
      }
    } catch (error) {
      console.error('Failed to reject product:', error);
      alert('Błąd podczas odrzucania produktu');
    }
  };

  const toggleUserModerator = async (userId, currentStatus, categories = []) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/admin/users/${userId}/moderator`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          is_moderator: !currentStatus,
          moderation_categories: !currentStatus ? categories : []
        })
      });
      if (response.ok) {
        alert('Status moderatora został zmieniony');
        loadAllUsers();
      } else {
        const data = await response.json();
        alert(data.message || 'Błąd podczas zmiany statusu moderatora');
      }
    } catch (error) {
      console.error('Failed to toggle moderator:', error);
      alert('Błąd podczas zmiany statusu moderatora');
    }
  };

  const updateModeratorCategories = async (userId, categories) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/admin/users/${userId}/moderator`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          is_moderator: true,
          moderation_categories: categories
        })
      });
      if (response.ok) {
        alert('Kategorie moderacji zostały zaktualizowane');
        loadAllUsers();
      } else {
        const data = await response.json();
        alert(data.message || 'Błąd podczas aktualizacji kategorii');
      }
    } catch (error) {
      console.error('Failed to update categories:', error);
      alert('Błąd podczas aktualizacji kategorii');
    }
  };

  const loadPurchases = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/orders/my-purchases', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok) {
        setPurchases(data.orders || []);
      }
    } catch (error) {
      console.error('Failed to load purchases:', error);
    }
  };

  const handleSubmitReview = async () => {
    if (!selectedOrderForReview) return;

    setIsSubmittingReview(true);
    try {
      const token = localStorage.getItem('token');
      
      const reviewResponse = await fetch('http://localhost:3001/api/reviews', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          order_id: selectedOrderForReview.id,
          seller_id: selectedOrderForReview.items[0].seller_id,
          rating: reviewRating,
          comment: reviewComment.trim() || null
        })
      });

      if (!reviewResponse.ok) {
        const data = await reviewResponse.json();
        throw new Error(data.message || 'Błąd podczas dodawania opinii');
      }

      alert('Dziękujemy za opinię o sprzedawcy!');
      setSelectedOrderForReview(null);
      setReviewRating(5);
      setReviewComment('');
      loadPurchases();
    } catch (error) {
      console.error('Failed to submit review:', error);
      alert(error.message || 'Wystąpił błąd');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleRestoreClick = (product) => {
    setProductToRestore(product);
    setNewStock('');
    setRestoreModalOpen(true);
  };

  const handleRestoreProduct = async () => {
    if (!newStock || parseInt(newStock) < 1) {
      alert('Podaj prawidłową ilość sztuk (minimum 1)');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/products/${productToRestore.id}/restore`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ stock_quantity: parseInt(newStock) })
      });

      if (response.ok) {
        alert('Produkt przywrócony pomyślnie!');
        setRestoreModalOpen(false);
        setProductToRestore(null);
        setNewStock('');
        loadMyProducts();
        loadArchivedProducts();
      } else {
        const data = await response.json();
        alert(data.error || 'Nie udało się przywrócić produktu');
      }
    } catch (error) {
      console.error('Failed to restore product:', error);
      alert('Wystąpił błąd połączenia');
    }
  };

  const handleDeleteProduct = async (productId, productTitle) => {
    if (!confirm(`Czy na pewno chcesz usunąć produkt "${productTitle}"?\n\nTa operacja jest nieodwracalna.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/products/${productId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        alert('Produkt został usunięty');
        loadMyProducts();
        loadArchivedProducts();
      } else {
        const data = await response.json();
        alert(data.error || 'Nie udało się usunąć produktu');
      }
    } catch (error) {
      console.error('Failed to delete product:', error);
      alert('Wystąpił błąd połączenia');
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = featuredProducts.findIndex(p => p.id === active.id);
      const newIndex = featuredProducts.findIndex(p => p.id === over.id);
      
      const newOrder = arrayMove(featuredProducts, oldIndex, newIndex);
      setFeaturedProducts(newOrder);

      // Zapisz nową kolejność na serwerze
      try {
        const token = localStorage.getItem('token');
        await fetch('http://localhost:3001/api/products/featured/reorder', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            productIds: newOrder.map(p => p.id)
          })
        });
      } catch (error) {
        console.error('Failed to reorder products:', error);
      }
    }
  };

  const toggleProductFeatured = async (productId, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/products/${productId}/featured`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ is_featured: !currentStatus })
      });

      if (response.ok) {
        loadFeaturedProducts();
        loadAllProducts();
      }
    } catch (error) {
      console.error('Failed to toggle featured:', error);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const toggleFeatured = async (productId, e) => {
    e.stopPropagation(); // Prevent navigation to product page
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/products/${productId}/featured`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        // Reload products to get updated featured status
        loadMyProducts();
      } else {
        const data = await response.json();
        alert(data.error || 'Nie udało się zmienić statusu');
      }
    } catch (error) {
      console.error('Failed to toggle featured:', error);
      alert('Wystąpił błąd');
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setProfileMessage('Plik jest za duży. Maksymalny rozmiar to 5MB.');
        return;
      }
      
      setAvatarFile(file);
      
      // Podgląd
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const updateProfile = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      
      // Jeśli jest nowe zdjęcie, najpierw je wyślij
      let newAvatarUrl = profileData.avatar_url;
      if (avatarFile) {
        const formData = new FormData();
        formData.append('avatar', avatarFile);
        
        const uploadResponse = await fetch('http://localhost:3001/api/auth/upload-avatar', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: formData
        });
        
        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          newAvatarUrl = uploadData.avatar_url;
        } else {
          setProfileMessage('Nie udało się przesłać zdjęcia');
          return;
        }
      }
      
      // Aktualizuj profil
      const response = await fetch('http://localhost:3001/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...profileData,
          avatar_url: newAvatarUrl
        })
      });
      
      const data = await response.json();
      if (response.ok) {
        setProfileMessage('Profil zaktualizowany pomyślnie!');
        setTimeout(() => setProfileMessage(''), 3000);
        setIsEditMode(false);
        setAvatarFile(null);
        setAvatarPreview(null);
        // Odśwież dane użytkownika
        window.location.reload();
      } else {
        setProfileMessage(data.error || 'Błąd aktualizacji profilu');
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      setProfileMessage('Błąd połączenia z serwerem');
    }
  };

  const selectTheme = async (themeId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/themes/select', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ theme_id: themeId })
      });

      if (response.ok) {
        await loadUserTheme();
        // Zastosuj kolory na żywo
        const theme = themes.find(t => t.id === themeId);
        if (theme) {
          applyTheme(theme);
        }
      }
    } catch (error) {
      console.error('Failed to select theme:', error);
    }
  };

  const applyTheme = (theme) => {
    const root = document.documentElement;
    
    // Sprawdź czy to motyw świąteczny i wyślij event
    const isChristmas = theme.name?.toLowerCase().includes('świąteczny') || 
                       theme.name?.toLowerCase().includes('christmas');
    window.dispatchEvent(new CustomEvent('themeChanged', { 
      detail: { isChristmas } 
    }));
    
    // Bazowe 3 kolory
    root.style.setProperty('--primary-color', theme.primary_color);
    root.style.setProperty('--secondary-color', theme.secondary_color);
    root.style.setProperty('--accent-color', theme.accent_color);
    
    // Wyliczone kolory ciemniejsze/jaśniejsze
    root.style.setProperty('--primary-dark', adjustColor(theme.primary_color, -20));
    root.style.setProperty('--primary-light', adjustColor(theme.primary_color, 40));
    root.style.setProperty('--secondary-dark', adjustColor(theme.secondary_color, -15));
    root.style.setProperty('--accent-light', adjustColor(theme.accent_color, 30));
    
    // Tła
    root.style.setProperty('--bg-cream', adjustColor(theme.accent_color, 70, 0.3)); // Bardzo jasny accent
    root.style.setProperty('--bg-light', adjustColor(theme.accent_color, 85, 0.2)); // Jeszcze jaśniejszy
    
    // Teksty
    root.style.setProperty('--text-color', adjustColor(theme.primary_color, -40));
    root.style.setProperty('--text-light', adjustColor(theme.secondary_color, 0));
    
    // Obramowania
    root.style.setProperty('--border-color', adjustColor(theme.accent_color, 20));
    
    // Kolor sukcesu (dla kategorii finalnych) - wyliczony z primary
    root.style.setProperty('--success-color', adjustColor(theme.primary_color, 0, 1.2)); // Lekko bardziej żywy
    
    // Cienie
    const shadowColor = hexToRgb(theme.primary_color);
    root.style.setProperty('--shadow-soft', `rgba(${shadowColor.r}, ${shadowColor.g}, ${shadowColor.b}, 0.08)`);
    
    // Gradienty
    root.style.setProperty('--theme-gradient-primary', `linear-gradient(135deg, ${theme.primary_color}, ${adjustColor(theme.primary_color, -20)})`);
    
    // Wymuś repaint przez toggle klasy
    document.body.classList.remove('theme-update');
    void document.body.offsetHeight; // Force reflow
    document.body.classList.add('theme-update');
  };

  // Funkcje pomocnicze do modyfikacji kolorów
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  };

  const rgbToHex = (r, g, b) => {
    return "#" + [r, g, b].map(x => {
      const hex = Math.max(0, Math.min(255, Math.round(x))).toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    }).join('');
  };

  const adjustColor = (hex, amount, saturationFactor = 1) => {
    const rgb = hexToRgb(hex);
    
    // Regulacja jasności
    let r = rgb.r + amount;
    let g = rgb.g + amount;
    let b = rgb.b + amount;
    
    // Regulacja saturacji (dla tła)
    if (saturationFactor < 1) {
      const gray = (r + g + b) / 3;
      r = gray + (r - gray) * saturationFactor;
      g = gray + (g - gray) * saturationFactor;
      b = gray + (b - gray) * saturationFactor;
    }
    
    return rgbToHex(r, g, b);
  };

  const createTheme = async (e) => {
    e.preventDefault();
    console.log('=== CREATE THEME (Frontend) ===');
    console.log('Theme data:', newTheme);
    
    try {
      const token = localStorage.getItem('token');
      console.log('Token exists:', !!token);
      
      const response = await fetch('http://localhost:3001/api/themes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newTheme)
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (response.ok) {
        console.log('[OK] Theme created successfully');
        await loadThemes();
        setNewTheme({
          name: '',
          primary_color: '#8b6f47',
          secondary_color: '#a0826d',
          accent_color: '#c9a882'
        });
      } else {
        console.error('[ERROR] Failed:', data);
      }
    } catch (error) {
      console.error('[ERROR] Create theme error:', error);
    }
  };

  const setDefaultTheme = async (themeId) => {
    console.log('=== SET DEFAULT THEME (Frontend) ===');
    console.log('Theme ID:', themeId);
    
    try {
      const token = localStorage.getItem('token');
      console.log('Token exists:', !!token);
      
      const response = await fetch(`http://localhost:3001/api/themes/${themeId}/default`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (response.ok) {
        console.log('[OK] Default theme set successfully');
        
        // Przeladuj liste motywow (zaktualizuje badge "Domyslny")
        await loadThemes();
        
        // NIE zmieniaj motywu uzytkownika - pozostaw jego osobisty wybor
        // Admin ma swoj wybrany motyw, zmiana domyslnego nie powinna go dotyczyc
        
      } else {
        console.error('[ERROR] Failed:', data);
      }
    } catch (error) {
      console.error('[ERROR] Set default theme error:', error);
    }
  };

  const deleteTheme = async (themeId) => {
    if (!confirm('Czy na pewno chcesz usunąć ten motyw?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/themes/${themeId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        await loadThemes();
      }
    } catch (error) {
      console.error('Failed to delete theme:', error);
    }
  };
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p>Musisz być zalogowany aby zobaczyć dashboard</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '3rem 1rem' }}>
      {/* Main Section Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '1rem', 
        marginBottom: '2rem',
        borderBottom: '2px solid var(--border-color)',
        paddingBottom: '1rem'
      }}>
        <button
          onClick={() => setActiveTab('overview')}
          style={{
            padding: '0.75rem 2rem',
            fontSize: '1.1rem',
            fontWeight: 700,
            background: activeTab === 'overview' || activeTab === 'profile' || activeTab === 'archive' || activeTab === 'purchases' || activeTab === 'theme' ? 'var(--primary-color)' : 'transparent',
            color: activeTab === 'overview' || activeTab === 'profile' || activeTab === 'archive' || activeTab === 'purchases' || activeTab === 'theme' ? 'white' : 'var(--text-dark)',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Moje Konto
        </button>
        {(user.role === 'admin' || user.can_moderate_products || user.can_moderate_comments || user.can_manage_themes) && (
          <button
            onClick={() => {
              // Ustaw pierwszą dostępną zakładkę zaplecza
              if (user.role === 'admin' || user.can_manage_themes) {
                setActiveTab('admin');
              } else if (user.can_moderate_products) {
                setActiveTab('moderation');
              } else if (user.can_moderate_comments) {
                setActiveTab('comments');
              }
            }}
            style={{
              padding: '0.75rem 2rem',
              fontSize: '1.1rem',
              fontWeight: 700,
              background: activeTab === 'admin' || activeTab === 'moderation' || activeTab === 'comments' || activeTab === 'featured' || activeTab === 'users' || activeTab === 'categories' ? 'var(--primary-color)' : 'transparent',
              color: activeTab === 'admin' || activeTab === 'moderation' || activeTab === 'comments' || activeTab === 'featured' || activeTab === 'users' || activeTab === 'categories' ? 'white' : 'var(--text-dark)',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Zaplecze
          </button>
        )}
      </div>

      {/* Sub-tabs for "Moje Konto" */}
      {(activeTab === 'overview' || activeTab === 'profile' || activeTab === 'archive' || activeTab === 'purchases' || activeTab === 'theme') && (
        <div className="dashboard-tabs" style={{ marginBottom: '2rem' }}>
          <button
            onClick={() => setActiveTab('overview')}
            className={`dashboard-tab ${activeTab === 'overview' ? 'active' : ''}`}
          >
            Przegląd
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`dashboard-tab ${activeTab === 'profile' ? 'active' : ''}`}
          >
            Moje dane
          </button>
          <button
            onClick={() => setActiveTab('archive')}
            className={`dashboard-tab ${activeTab === 'archive' ? 'active' : ''}`}
          >
            Archiwum ({archivedProducts.length})
          </button>
          <button
            onClick={() => setActiveTab('purchases')}
            className={`dashboard-tab ${activeTab === 'purchases' ? 'active' : ''}`}
          >
            Moje zakupy
          </button>
          <button
            onClick={() => setActiveTab('theme')}
            className={`dashboard-tab ${activeTab === 'theme' ? 'active' : ''}`}
          >
            Wybór Motywu
          </button>
        </div>
      )}

      {/* Sub-tabs for "Zaplecze" (Admin only) */}
      {(user.role === 'admin' || user.can_moderate_products || user.can_moderate_comments || user.can_manage_themes) && (activeTab === 'admin' || activeTab === 'moderation' || activeTab === 'comments' || activeTab === 'featured' || activeTab === 'users' || activeTab === 'categories') && (
        <div className="dashboard-tabs" style={{ marginBottom: '2rem' }}>
          {(user.role === 'admin' || user.can_manage_themes) && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`dashboard-tab ${activeTab === 'admin' ? 'active' : ''}`}
            >
              Motywy
            </button>
          )}
          {(user.role === 'admin' || user.can_moderate_products) && (
            <button
              onClick={() => setActiveTab('moderation')}
              className={`dashboard-tab ${activeTab === 'moderation' ? 'active' : ''}`}
            >
              Ogłoszenia {moderationStats?.pending > 0 && `(${moderationStats.pending})`}
            </button>
          )}
          {(user.role === 'admin' || user.can_moderate_comments) && (
            <button
              onClick={() => setActiveTab('comments')}
              className={`dashboard-tab ${activeTab === 'comments' ? 'active' : ''}`}
            >
              Komentarze {pendingComments.length > 0 && `(${pendingComments.length})`}
            </button>
          )}
          {user.role === 'admin' && (
            <>
              <button
                onClick={() => setActiveTab('categories')}
                className={`dashboard-tab ${activeTab === 'categories' ? 'active' : ''}`}
              >
                Kategorie
              </button>
              <button
                onClick={() => setActiveTab('featured')}
                className={`dashboard-tab ${activeTab === 'featured' ? 'active' : ''}`}
              >
                Wybór Redakcji
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`dashboard-tab ${activeTab === 'users' ? 'active' : ''}`}
              >
                Użytkownicy
              </button>
            </>
          )}
        </div>
      )}

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div>
          <div className="stats-grid" style={{ marginBottom: '2rem' }}>
            <div className="stat-card">
              <h3>Moje produkty</h3>
              <p style={{ fontSize: '2rem', fontWeight: 700 }}>{products.length}</p>
            </div>
            <div className="stat-card">
              <h3>Opublikowane</h3>
              <p style={{ fontSize: '2rem', fontWeight: 700 }}>
                {products.filter(p => p.status === 'published').length}
              </p>
            </div>
            <div className="stat-card">
              <h3>Zarchiwizowane</h3>
              <p style={{ fontSize: '2rem', fontWeight: 700 }}>
                {products.filter(p => p.status === 'archived').length}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Twoje produkty</h2>
            <Link
              to="/add-product"
              className="btn"
              style={{ textDecoration: 'none' }}
            >
              + Dodaj produkt
            </Link>
          </div>

          {products.length === 0 ? (
            <div style={{
              padding: '3rem',
              textAlign: 'center',
              backgroundColor: 'var(--bg-cream)',
              borderRadius: '8px'
            }}>
              <p style={{ marginBottom: '1rem', color: 'var(--text-light)' }}>
                Nie masz jeszcze zadnych produktow
              </p>
              <Link to="/add-product" className="btn">
                Dodaj pierwszy produkt
              </Link>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1.5rem'
            }}>
              {products.map(product => (
                <div
                  key={product.id}
                  style={{
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                  }}
                  onClick={() => navigate(`/product/${product.id}`)}
                  onMouseOver={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 16px var(--shadow-soft)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {product.images && product.images[0] && (
                    <div style={{
                      width: '100%',
                      height: '200px',
                      backgroundColor: 'var(--bg-cream)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <img
                        src={product.images[0].image_url.startsWith('http') 
                          ? product.images[0].image_url 
                          : `http://localhost:3001${product.images[0].image_url}`}
                        alt={product.title}
                        style={{
                          maxWidth: '100%',
                          maxHeight: '100%',
                          objectFit: 'cover'
                        }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = '<span style="color: var(--text-light)">Brak zdjecia</span>';
                        }}
                      />
                    </div>
                  )}
                  <div style={{ padding: '1rem' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                      {product.title}
                    </h3>
                    <p style={{ color: 'var(--text-light)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                      {product.category.name}
                    </p>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.75rem'
                    }}>
                      <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary-color)' }}>
                        {product.price} PLN
                      </span>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '4px',
                        fontSize: '0.875rem',
                        backgroundColor: product.status === 'published' ? '#d1fae5' : '#fee2e2',
                        color: product.status === 'published' ? '#065f46' : '#991b1b'
                      }}>
                        {product.status === 'published' ? 'Opublikowane' : 'Archiwum'}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>
                      Dostepne: {product.stock_quantity} szt.
                    </p>
                    
                    <div style={{ 
                      marginTop: '1rem',
                      display: 'flex',
                      gap: '0.5rem'
                    }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProduct(product.id, product.title);
                        }}
                        style={{
                          flex: 1,
                          padding: '0.5rem',
                          backgroundColor: '#fee2e2',
                          border: '2px solid #fecaca',
                          borderRadius: '6px',
                          color: '#991b1b',
                          fontWeight: 600,
                          fontSize: '0.875rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = '#fecaca';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = '#fee2e2';
                        }}
                      >
                        Usuń
                      </button>
                    </div>

                    {user.role === 'admin' && (
                      <button
                        type="button"
                        onClick={(e) => toggleFeatured(product.id, e)}
                        style={{
                          marginTop: '0.75rem',
                          width: '100%',
                          padding: '0.5rem',
                          backgroundColor: product.is_featured ? '#fbbf24' : 'var(--bg-cream)',
                          border: product.is_featured ? '2px solid #f59e0b' : '2px solid var(--border-color)',
                          borderRadius: '6px',
                          color: product.is_featured ? '#92400e' : 'var(--text-primary)',
                          fontWeight: 600,
                          fontSize: '0.875rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem'
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
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '2rem' 
          }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 700, margin: 0 }}>Moje dane</h2>
            {!isEditMode && (
              <button
                onClick={() => setIsEditMode(true)}
                className="btn"
                style={{
                  padding: '0.75rem 1.5rem',
                  fontSize: '1rem'
                }}
              >
                Edytuj profil
              </button>
            )}
          </div>
          
          {profileMessage && (
            <div style={{
              padding: '1rem',
              marginBottom: '1.5rem',
              borderRadius: '8px',
              backgroundColor: profileMessage.includes('pomyślnie') ? '#d4edda' : '#f8d7da',
              color: profileMessage.includes('pomyślnie') ? '#155724' : '#721c24',
              border: `1px solid ${profileMessage.includes('pomyślnie') ? '#c3e6cb' : '#f5c6cb'}`
            }}>
              {profileMessage}
            </div>
          )}

          <div style={{
            maxWidth: '800px',
            margin: '0 auto',
            backgroundColor: 'white',
            padding: '3rem',
            borderRadius: '16px',
            border: '1px solid var(--border-color)',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15), 0 4px 16px rgba(0, 0, 0, 0.1)'
          }}>
            {/* Avatar Section - z oceną i powitaniem obok */}
            <div style={{ 
              display: 'flex',
              gap: '2.5rem',
              marginBottom: '3rem',
              paddingBottom: '2.5rem',
              borderBottom: '1px solid var(--border-color)',
              alignItems: 'start'
            }}>
              {/* Avatar */}
              <div style={{ flexShrink: 0, textAlign: 'center' }}>
                {avatarPreview || profileData.avatar_url || user?.avatar_url ? (
                  <img 
                    src={avatarPreview || profileData.avatar_url || user?.avatar_url} 
                    alt="Profil" 
                    style={{
                      width: '180px',
                      height: '180px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '4px solid var(--primary-color)',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)'
                    }}
                  />
                ) : (
                  <div style={{
                    width: '180px',
                    height: '180px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--primary-color), var(--accent-color))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '5rem',
                    color: 'white',
                    fontWeight: 700,
                    border: '4px solid var(--primary-color)',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)'
                  }}>
                    {user?.username?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
                
                {isEditMode && (
                  <div style={{ marginTop: '1.5rem' }}>
                    <label 
                      htmlFor="avatar-upload"
                      style={{ 
                        display: 'inline-block',
                        padding: '0.75rem 1.5rem',
                        backgroundColor: 'var(--primary-color)',
                        color: 'white',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 600,
                        transition: 'all 0.2s',
                        border: '2px solid var(--primary-color)'
                      }}
                      onMouseOver={(e) => e.target.style.backgroundColor = 'var(--primary-dark)'}
                      onMouseOut={(e) => e.target.style.backgroundColor = 'var(--primary-color)'}
                    >
                      📷 Wybierz zdjęcie
                    </label>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      style={{ display: 'none' }}
                    />
                    {avatarFile && (
                      <p style={{ 
                        marginTop: '0.5rem', 
                        fontSize: '0.9rem', 
                        color: 'var(--success-color)',
                        fontWeight: 500
                      }}>
                        ✓ {avatarFile.name}
                      </p>
                    )}
                    <p style={{ 
                      marginTop: '0.5rem', 
                      fontSize: '0.85rem', 
                      color: 'var(--text-light)' 
                    }}>
                      Maksymalny rozmiar: 5MB
                    </p>
                  </div>
                )}
              </div>

              {/* Ocena i Powitanie obok */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Ocena */}
                <div style={{
                  padding: '1.25rem',
                  backgroundColor: 'var(--bg-cream)',
                  borderRadius: '10px',
                  border: '1px solid var(--accent-color)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-light)' }}>
                      Ocena
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.8rem' }}>★★★★★</span>
                    <div>
                      <span style={{ fontSize: '1.5rem', color: 'var(--text-color)', fontWeight: 700 }}>
                        5.0
                      </span>
                      <span style={{ fontSize: '0.9rem', color: 'var(--text-light)', marginLeft: '0.5rem' }}>
                        (brak ocen)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Powitanie */}
                {isEditMode ? (
                  <div style={{
                    padding: '1.25rem',
                    backgroundColor: 'var(--bg-light)',
                    borderRadius: '10px'
                  }}>
                    <label style={{ 
                      display: 'block',
                      marginBottom: '0.75rem',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      color: 'var(--text-light)'
                    }}>
                      Powitanie
                    </label>
                    <textarea
                      value={profileData.greeting}
                      onChange={(e) => setProfileData({...profileData, greeting: e.target.value})}
                      rows="3"
                      placeholder="Witaj na moim profilu! 👋"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid var(--border-color)',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        fontFamily: 'inherit',
                        resize: 'vertical'
                      }}
                    />
                  </div>
                ) : (
                  <div style={{
                    padding: '1.5rem',
                    backgroundColor: 'var(--bg-light)',
                    borderRadius: '10px',
                    fontSize: '1.1rem',
                    color: 'var(--text-color)',
                    fontStyle: 'italic',
                    lineHeight: '1.6'
                  }}>
                    {user?.greeting || 'Witaj na moim profilu! 👋'}
                  </div>
                )}
              </div>
            </div>

            {isEditMode ? (
              /* TRYB EDYCJI */
              <form onSubmit={updateProfile}>
                {/* Email (tylko do odczytu) */}
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: '180px 1fr',
                  gap: '1.5rem',
                  alignItems: 'center',
                  marginBottom: '1.5rem',
                  padding: '1.25rem',
                  backgroundColor: 'var(--bg-light)',
                  borderRadius: '10px'
                }}>
                  <label style={{ fontWeight: 600, color: 'var(--text-color)', fontSize: '0.95rem' }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    style={{
                      padding: '0.75rem',
                      border: '2px solid var(--border-color)',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      backgroundColor: 'var(--bg-cream)',
                      color: 'var(--text-light)',
                      cursor: 'not-allowed'
                    }}
                  />
                </div>

                {/* Username */}
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: '180px 1fr',
                  gap: '1.5rem',
                  alignItems: 'center',
                  marginBottom: '1.5rem',
                  padding: '1.25rem',
                  backgroundColor: 'var(--bg-light)',
                  borderRadius: '10px'
                }}>
                  <label style={{ fontWeight: 600, color: 'var(--text-color)', fontSize: '0.95rem' }}>
                    Login *
                  </label>
                  <div>
                    <input
                      type="text"
                      value={profileData.username}
                      onChange={(e) => setProfileData({...profileData, username: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '2px solid var(--primary-color)',
                        borderRadius: '8px',
                        fontSize: '1rem'
                      }}
                      required
                    />
                    <small style={{ color: 'var(--text-light)', fontSize: '0.85rem', display: 'block', marginTop: '0.25rem' }}>
                      Wyświetlana jako sprzedawca
                    </small>
                  </div>
                </div>

                {/* Full Name */}
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: '180px 1fr',
                  gap: '1.5rem',
                  alignItems: 'center',
                  marginBottom: '1.5rem',
                  padding: '1.25rem',
                  backgroundColor: 'var(--bg-light)',
                  borderRadius: '10px'
                }}>
                  <label style={{ fontWeight: 600, color: 'var(--text-color)', fontSize: '0.95rem' }}>
                    Nazwa użytkownika
                  </label>
                  <input
                    type="text"
                    value={profileData.full_name}
                    onChange={(e) => setProfileData({...profileData, full_name: e.target.value})}
                    placeholder="Opcjonalne"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid var(--border-color)',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                  />
                </div>

                {/* Bio */}
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: '180px 1fr',
                  gap: '1.5rem',
                  alignItems: 'start',
                  marginBottom: '2rem',
                  padding: '1.25rem',
                  backgroundColor: 'var(--bg-light)',
                  borderRadius: '10px'
                }}>
                  <label style={{ fontWeight: 600, color: 'var(--text-color)', paddingTop: '0.75rem', fontSize: '0.95rem' }}>
                    Opis
                  </label>
                  <textarea
                    value={profileData.bio}
                    onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                    rows="4"
                    placeholder="Opowiedz coś o sobie i swoich produktach..."
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid var(--border-color)',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      fontFamily: 'inherit',
                      resize: 'vertical'
                    }}
                  />
                </div>

                {/* Buttons */}
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditMode(false);
                      setAvatarFile(null);
                      setAvatarPreview(null);
                      setProfileData({
                        username: user?.username || '',
                        full_name: user?.full_name || '',
                        bio: user?.bio || '',
                        avatar_url: user?.avatar_url || '',
                        greeting: user?.greeting || 'Witaj na moim profilu! 👋'
                      });
                    }}
                    style={{
                      padding: '0.75rem 1.5rem',
                      fontSize: '1rem',
                      fontWeight: 600,
                      border: '2px solid var(--border-color)',
                      borderRadius: '8px',
                      backgroundColor: 'white',
                      color: 'var(--text-color)',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    Anuluj
                  </button>
                  <button
                    type="submit"
                    className="btn"
                    style={{
                      padding: '0.75rem 2rem',
                      fontSize: '1rem',
                      fontWeight: 600
                    }}
                  >
                    💾 Zapisz zmiany
                  </button>
                </div>
              </form>
            ) : (
              /* TRYB WYŚWIETLANIA */
              <div>
                {/* Email */}
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: '180px 1fr',
                  gap: '1.5rem',
                  alignItems: 'center',
                  marginBottom: '1.5rem',
                  padding: '1.25rem',
                  backgroundColor: 'var(--bg-light)',
                  borderRadius: '10px',
                  transition: 'all 0.2s'
                }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-light)', fontSize: '0.9rem' }}>
                    Email
                  </span>
                  <span style={{ fontSize: '1.1rem', color: 'var(--text-color)', fontWeight: 500 }}>
                    {user?.email}
                  </span>
                </div>

                {/* Username */}
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: '180px 1fr',
                  gap: '1.5rem',
                  alignItems: 'center',
                  marginBottom: '1.5rem',
                  padding: '1.25rem',
                  backgroundColor: 'var(--bg-light)',
                  borderRadius: '10px',
                  transition: 'all 0.2s'
                }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-light)', fontSize: '0.9rem' }}>
                    Login
                  </span>
                  <span style={{ fontSize: '1.1rem', color: 'var(--text-color)', fontWeight: 500 }}>
                    {user?.username}
                  </span>
                </div>

                {/* Full Name */}
                {user?.full_name && (
                  <div style={{ 
                    display: 'grid',
                    gridTemplateColumns: '180px 1fr',
                    gap: '1.5rem',
                    alignItems: 'center',
                    marginBottom: '1.5rem',
                    padding: '1.25rem',
                    backgroundColor: 'var(--bg-light)',
                    borderRadius: '10px',
                    transition: 'all 0.2s'
                  }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-light)', fontSize: '0.9rem' }}>
                      Nazwa użytkownika
                    </span>
                    <span style={{ fontSize: '1.1rem', color: 'var(--text-color)', fontWeight: 500 }}>
                      {user?.full_name}
                    </span>
                  </div>
                )}

                {/* Bio */}
                {user?.bio && (
                  <div style={{ 
                    display: 'grid',
                    gridTemplateColumns: '180px 1fr',
                    gap: '1.5rem',
                    alignItems: 'start',
                    marginBottom: '1.5rem',
                    padding: '1.25rem',
                    backgroundColor: 'var(--bg-light)',
                    borderRadius: '10px',
                    transition: 'all 0.2s'
                  }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-light)', fontSize: '0.9rem' }}>
                      Opis
                    </span>
                    <span style={{ fontSize: '1rem', color: 'var(--text-color)', lineHeight: '1.6' }}>
                      {user?.bio}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Archive Tab */}
      {activeTab === 'archive' && (
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '1.5rem' }}>
            Zarchiwizowane produkty ({archivedProducts.length})
          </h2>

          {archivedProducts.length === 0 ? (
            <div style={{
              padding: '3rem',
              textAlign: 'center',
              backgroundColor: 'var(--bg-cream)',
              borderRadius: '8px'
            }}>
              <p style={{ color: 'var(--text-light)' }}>
                Nie masz żadnych zarchiwizowanych produktów
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '1.5rem'
            }}>
              {archivedProducts.map(product => (
                <div
                  key={product.id}
                  style={{
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    backgroundColor: 'white'
                  }}
                >
                  {product.images && product.images[0] && (
                    <div style={{
                      width: '100%',
                      height: '200px',
                      backgroundColor: 'var(--bg-cream)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <img
                        src={product.images[0].image_url.startsWith('http') 
                          ? product.images[0].image_url 
                          : `http://localhost:3001${product.images[0].image_url}`}
                        alt={product.title}
                        style={{
                          maxWidth: '100%',
                          maxHeight: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    </div>
                  )}
                  <div style={{ padding: '1rem' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                      {product.title}
                    </h3>
                    <p style={{ color: 'var(--text-light)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                      {product.category.name}
                    </p>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '1rem'
                    }}>
                      <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary-color)' }}>
                        {product.price} PLN
                      </span>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '4px',
                        fontSize: '0.875rem',
                        backgroundColor: '#fee2e2',
                        color: '#991b1b'
                      }}>
                        Wyprzedane
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleRestoreClick(product)}
                        className="btn"
                        style={{
                          flex: 1,
                          padding: '0.75rem',
                          fontSize: '0.95rem',
                          fontWeight: 600
                        }}
                      >
                        Przywróć
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id, product.title)}
                        style={{
                          padding: '0.75rem',
                          backgroundColor: '#fee2e2',
                          border: '2px solid #fecaca',
                          borderRadius: '8px',
                          color: '#991b1b',
                          fontWeight: 600,
                          fontSize: '0.95rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.backgroundColor = '#fecaca';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.backgroundColor = '#fee2e2';
                        }}
                      >
                        Usuń
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Restore Modal */}
          {restoreModalOpen && (
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
                  Przywróć produkt
                </h3>
                <p style={{ marginBottom: '0.5rem', fontWeight: 600 }}>
                  {productToRestore?.title}
                </p>
                <p style={{ marginBottom: '1.5rem', color: 'var(--text-light)', fontSize: '0.9rem' }}>
                  Wprowadź nową dostępną ilość sztuk, aby przywrócić produkt do sprzedaży
                </p>
                
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                    Dostępna ilość sztuk
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newStock}
                    onChange={(e) => setNewStock(e.target.value)}
                    placeholder="Wprowadź ilość..."
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid var(--border-color)',
                      borderRadius: '8px',
                      fontSize: '1rem'
                    }}
                    autoFocus
                  />
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button
                    onClick={handleRestoreProduct}
                    className="btn"
                    style={{ flex: 1, padding: '0.75rem' }}
                  >
                    Przywróć
                  </button>
                  <button
                    onClick={() => {
                      setRestoreModalOpen(false);
                      setProductToRestore(null);
                      setNewStock('');
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
      )}

      {/* Theme Selection Tab */}
      {activeTab === 'theme' && (
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '1.5rem' }}>Wybierz Motyw</h2>
          {selectedTheme && (
            <div className="theme-current">
              <p style={{ fontWeight: 600, marginBottom: '0.75rem' }}>Aktualny motyw: {selectedTheme.name}</p>
              <div className="theme-colors">
                <div 
                  className="theme-color-box"
                  style={{ backgroundColor: selectedTheme.primary_color }}
                  title="Primary"
                ></div>
                <div 
                  className="theme-color-box"
                  style={{ backgroundColor: selectedTheme.secondary_color }}
                  title="Secondary"
                ></div>
                <div 
                  className="theme-color-box"
                  style={{ backgroundColor: selectedTheme.accent_color }}
                  title="Accent"
                ></div>
              </div>
            </div>
          )}

          <div className="theme-grid">
            {themes.map(theme => (
              <div key={theme.id} className="theme-card">
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h3 className="theme-name">{theme.name}</h3>
                  {theme.is_default && <span className="theme-badge">Domyślny</span>}
                </div>
                
                <div className="theme-colors">
                  <div 
                    className="theme-color-box"
                    style={{ backgroundColor: theme.primary_color }}
                  ></div>
                  <div 
                    className="theme-color-box"
                    style={{ backgroundColor: theme.secondary_color }}
                  ></div>
                  <div 
                    className="theme-color-box"
                    style={{ backgroundColor: theme.accent_color }}
                  ></div>
                </div>

                <button
                  onClick={() => selectTheme(theme.id)}
                  className="btn btn-full"
                  disabled={selectedTheme?.id === theme.id}
                  style={{ marginTop: '1rem' }}
                >
                  {selectedTheme?.id === theme.id ? 'Wybrany' : 'Wybierz'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comments Moderation Tab */}
      {activeTab === 'comments' && (user.role === 'admin' || user.can_moderate_comments) && (
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '1.5rem' }}>
            Moderacja Komentarzy
            {pendingComments.length > 0 && (
              <span style={{ 
                marginLeft: '1rem', 
                fontSize: '1rem', 
                color: '#ef4444',
                background: '#fee2e2',
                padding: '0.25rem 0.75rem',
                borderRadius: '999px'
              }}>
                {pendingComments.length} oczekujących
              </span>
            )}
          </h2>

          {loadingComments ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <p>Ładowanie komentarzy...</p>
            </div>
          ) : pendingComments.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '3rem', 
              background: '#f9fafb',
              borderRadius: '12px',
              border: '2px dashed #d1d5db'
            }}>
              <p style={{ fontSize: '1.1rem', color: '#6b7280' }}>
                ✓ Brak komentarzy do moderacji
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {pendingComments.map((comment) => (
                <div 
                  key={comment.id}
                  style={{
                    background: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>
                          {comment.product?.title || 'Produkt usunięty'}
                        </h3>
                        <span style={{
                          background: '#fef3c7',
                          color: '#92400e',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}>
                          OCZEKUJE
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', color: '#6b7280' }}>
                        <span>👤 {comment.User?.username || 'Nieznany'}</span>
                        <span>•</span>
                        <span>{new Date(comment.created_at).toLocaleString('pl-PL')}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{
                    background: '#f9fafb',
                    padding: '1rem',
                    borderRadius: '8px',
                    marginBottom: '1rem',
                    border: '1px solid #e5e7eb'
                  }}>
                    <p style={{ margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                      {comment.comment}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => handleRejectComment(comment.id)}
                      style={{
                        padding: '0.5rem 1rem',
                        background: '#fee2e2',
                        color: '#dc2626',
                        border: '1px solid #fecaca',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '0.9rem'
                      }}
                      onMouseOver={(e) => {
                        e.target.style.background = '#fecaca';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.background = '#fee2e2';
                      }}
                    >
                      ✕ Odrzuć
                    </button>
                    <button
                      onClick={() => handleApproveComment(comment.id)}
                      style={{
                        padding: '0.5rem 1.5rem',
                        background: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '0.9rem'
                      }}
                      onMouseOver={(e) => {
                        e.target.style.background = '#059669';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.background = '#10b981';
                      }}
                    >
                      ✓ Zatwierdź
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Motywy Tab (Admin or users with permission) */}
      {activeTab === 'admin' && (user.role === 'admin' || user.can_manage_themes) && (
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '1.5rem' }}>Zarządzanie Motywami</h2>

          {/* Create Theme Form */}
          <div className="form-section">
            <h3>Stwórz Nowy Motyw</h3>
            <form onSubmit={createTheme}>
              <div className="form-group">
                <label>Nazwa motywu</label>
                <input
                  type="text"
                  value={newTheme.name}
                  onChange={e => setNewTheme({...newTheme, name: e.target.value})}
                  required
                />
              </div>

              <div className="color-inputs">
                <div className="form-group">
                  <label>Kolor Główny</label>
                  <input
                    type="color"
                    value={newTheme.primary_color}
                    onChange={e => setNewTheme({...newTheme, primary_color: e.target.value})}
                  />
                  <input
                    type="text"
                    value={newTheme.primary_color}
                    onChange={e => setNewTheme({...newTheme, primary_color: e.target.value})}
                    style={{ marginTop: '0.5rem' }}
                  />
                </div>

                <div className="form-group">
                  <label>Kolor Drugorzędny</label>
                  <input
                    type="color"
                    value={newTheme.secondary_color}
                    onChange={e => setNewTheme({...newTheme, secondary_color: e.target.value})}
                  />
                  <input
                    type="text"
                    value={newTheme.secondary_color}
                    onChange={e => setNewTheme({...newTheme, secondary_color: e.target.value})}
                    style={{ marginTop: '0.5rem' }}
                  />
                </div>

                <div className="form-group">
                  <label>Kolor Akcentu</label>
                  <input
                    type="color"
                    value={newTheme.accent_color}
                    onChange={e => setNewTheme({...newTheme, accent_color: e.target.value})}
                  />
                  <input
                    type="text"
                    value={newTheme.accent_color}
                    onChange={e => setNewTheme({...newTheme, accent_color: e.target.value})}
                    style={{ marginTop: '0.5rem' }}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-full" style={{ marginTop: '1.5rem' }}>
                Stwórz Motyw
              </button>
            </form>
          </div>

          {/* Theme List */}
          <div className="theme-list">
            <h3 style={{ marginBottom: '1.5rem' }}>Wszystkie Motywy</h3>
            {themes.map(theme => (
              <div key={theme.id} className="theme-list-item">
                <div className="theme-info">
                  <div className="theme-colors">
                    <div 
                      className="theme-color-box"
                      style={{ backgroundColor: theme.primary_color }}
                    ></div>
                    <div 
                      className="theme-color-box"
                      style={{ backgroundColor: theme.secondary_color }}
                    ></div>
                    <div 
                      className="theme-color-box"
                      style={{ backgroundColor: theme.accent_color }}
                    ></div>
                  </div>
                  <div>
                    <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{theme.name}</p>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-light)' }}>{theme.slug}</p>
                  </div>
                  {theme.is_default && (
                    <span className="theme-badge">Domyślny</span>
                  )}
                </div>

                <div className="theme-actions">
                  {!theme.is_default && (
                    <>
                      <button
                        onClick={() => setDefaultTheme(theme.id)}
                        className="btn-success"
                      >
                        Ustaw jako domyślny
                      </button>
                      <button
                        onClick={() => deleteTheme(theme.id)}
                        className="btn-danger"
                      >
                        Usuń
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Featured Products Tab */}
      {activeTab === 'featured' && user.role === 'admin' && (
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '1.5rem' }}>
            Zarządzanie Wyborem Redakcji
          </h2>

          {/* Sort options */}
          <div style={{ 
            marginBottom: '2rem', 
            padding: '1.5rem', 
            backgroundColor: 'white', 
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 600 }}>
              Kolejność wyświetlania w sliderze
            </h3>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                padding: '0.75rem 1.25rem',
                backgroundColor: featuredSortBy === 'manual' ? 'var(--primary-color)' : 'var(--bg-cream)',
                color: featuredSortBy === 'manual' ? 'white' : 'var(--text-dark)',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: featuredSortBy === 'manual' ? 600 : 400,
                transition: 'all 0.2s'
              }}>
                <input
                  type="radio"
                  name="sortBy"
                  value="manual"
                  checked={featuredSortBy === 'manual'}
                  onChange={(e) => setFeaturedSortBy(e.target.value)}
                  style={{ cursor: 'pointer' }}
                />
                <span>Ręczna kolejność (przeciągnij)</span>
              </label>
              
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                padding: '0.75rem 1.25rem',
                backgroundColor: featuredSortBy === 'created_at' ? 'var(--primary-color)' : 'var(--bg-cream)',
                color: featuredSortBy === 'created_at' ? 'white' : 'var(--text-dark)',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: featuredSortBy === 'created_at' ? 600 : 400,
                transition: 'all 0.2s'
              }}>
                <input
                  type="radio"
                  name="sortBy"
                  value="created_at"
                  checked={featuredSortBy === 'created_at'}
                  onChange={(e) => setFeaturedSortBy(e.target.value)}
                  style={{ cursor: 'pointer' }}
                />
                <span>Data dodania produktu</span>
              </label>
              
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                padding: '0.75rem 1.25rem',
                backgroundColor: featuredSortBy === 'featured_at' ? 'var(--primary-color)' : 'var(--bg-cream)',
                color: featuredSortBy === 'featured_at' ? 'white' : 'var(--text-dark)',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: featuredSortBy === 'featured_at' ? 600 : 400,
                transition: 'all 0.2s'
              }}>
                <input
                  type="radio"
                  name="sortBy"
                  value="featured_at"
                  checked={featuredSortBy === 'featured_at'}
                  onChange={(e) => setFeaturedSortBy(e.target.value)}
                  style={{ cursor: 'pointer' }}
                />
                <span>Data dodania do wyboru redakcji</span>
              </label>
              
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                padding: '0.75rem 1.25rem',
                backgroundColor: featuredSortBy === 'views_count' ? 'var(--primary-color)' : 'var(--bg-cream)',
                color: featuredSortBy === 'views_count' ? 'white' : 'var(--text-dark)',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: featuredSortBy === 'views_count' ? 600 : 400,
                transition: 'all 0.2s'
              }}>
                <input
                  type="radio"
                  name="sortBy"
                  value="views_count"
                  checked={featuredSortBy === 'views_count'}
                  onChange={(e) => setFeaturedSortBy(e.target.value)}
                  style={{ cursor: 'pointer' }}
                />
                <span>Liczba wyświetleń</span>
              </label>
            </div>
            <p style={{ 
              marginTop: '1rem', 
              fontSize: '0.9rem', 
              color: 'var(--text-light)' 
            }}>
              {featuredSortBy === 'manual' 
                ? 'Przeciągnij produkty poniżej, aby ręcznie ustawić kolejność wyświetlania'
                : 'Produkty są sortowane automatycznie. Przeciąganie jest wyłączone.'}
            </p>
          </div>

          {/* Aktualny wybór redakcji z drag-and-drop */}
          <div className="form-section" style={{ marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>
              Aktualne produkty w sliderze ({featuredProducts.length})
            </h3>
            {featuredSortBy === 'manual' && (
              <p style={{ color: 'var(--text-light)', marginBottom: '1.5rem' }}>
                Przeciągnij produkty aby zmienić kolejność wyświetlania w sliderze
              </p>
            )}

            {featuredProducts.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)' }}>
                Brak produktów w wyborze redakcji
              </p>
            ) : featuredSortBy === 'manual' ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={featuredProducts.map(p => p.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {featuredProducts.map((product) => (
                      <div key={product.id} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <SortableProduct product={product} />
                        <button
                          onClick={() => toggleProductFeatured(product.id, true)}
                          style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: '#e53e3e',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.9rem'
                          }}
                        >
                          Usuń
                        </button>
                      </div>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {featuredProducts.map((product, index) => (
                  <div 
                    key={product.id} 
                    style={{ 
                      display: 'flex', 
                      gap: '1rem', 
                      alignItems: 'center',
                      padding: '1rem',
                      backgroundColor: 'white',
                      borderRadius: '8px',
                      border: '2px solid var(--border-light)'
                    }}
                  >
                    <div style={{ 
                      fontSize: '1.2rem', 
                      fontWeight: 700, 
                      color: 'var(--text-light)',
                      minWidth: '30px',
                      textAlign: 'center'
                    }}>
                      #{index + 1}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                      {product.images?.[0] && (
                        <img
                          src={product.images[0].image_url.startsWith('http') 
                            ? product.images[0].image_url 
                            : `http://localhost:3001${product.images[0].image_url}`}
                          alt={product.title}
                          style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }}
                        />
                      )}
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: 0 }}>{product.title}</h4>
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', color: 'var(--text-light)' }}>
                          {product.price} zł • {product.seller?.username}
                          {featuredSortBy === 'views_count' && ` • ${product.views_count || 0} wyświetleń`}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleProductFeatured(product.id, true)}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#e53e3e',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                      }}
                    >
                      Usuń
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Lista wszystkich produktów do dodania */}
          <div className="form-section">
            <h3 style={{ marginBottom: '1rem' }}>
              Dodaj produkt do wyboru redakcji
            </h3>
            <p style={{ color: 'var(--text-light)', marginBottom: '1.5rem' }}>
              Opublikowane produkty, które nie są w wyborze redakcji
            </p>

            <div style={{ display: 'grid', gap: '1rem' }}>
              {allProducts
                .filter(p => !featuredProducts.some(fp => fp.id === p.id))
                .map(product => (
                  <div
                    key={product.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '1rem',
                      backgroundColor: 'var(--bg-light)',
                      borderRadius: '8px'
                    }}
                  >
                    {product.images?.[0] && (
                      <img
                        src={product.images[0].image_url.startsWith('http') 
                          ? product.images[0].image_url 
                          : `http://localhost:3001${product.images[0].image_url}`}
                        alt={product.title}
                        style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }}
                      />
                    )}
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: 0 }}>{product.title}</h4>
                      <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-light)' }}>
                        {product.price} zł • {product.seller?.username}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleProductFeatured(product.id, false)}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: 'var(--primary-color)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                      }}
                    >
                      Dodaj do wyboru
                    </button>
                  </div>
                ))}
              {allProducts.filter(p => !featuredProducts.some(fp => fp.id === p.id)).length === 0 && (
                <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)' }}>
                  Wszystkie opublikowane produkty są już w wyborze redakcji
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Ogłoszenia Tab */}
      {activeTab === 'moderation' && (user.role === 'admin' || user.can_moderate_products) && (
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '1.5rem' }}>
            Moderacja Ogłoszeń
          </h2>

          {/* Statistics */}
          {moderationStats && (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '1rem', 
              marginBottom: '2rem' 
            }}>
              <div className="stat-card">
                <h3>Oczekujące</h3>
                <p style={{ fontSize: '2rem', fontWeight: 700, color: '#f59e0b' }}>
                  {moderationStats.pending || 0}
                </p>
              </div>
              <div className="stat-card">
                <h3>Zaakceptowane</h3>
                <p style={{ fontSize: '2rem', fontWeight: 700, color: '#10b981' }}>
                  {moderationStats.approved || 0}
                </p>
              </div>
              <div className="stat-card">
                <h3>Odrzucone</h3>
                <p style={{ fontSize: '2rem', fontWeight: 700, color: '#ef4444' }}>
                  {moderationStats.rejected || 0}
                </p>
              </div>
              <div className="stat-card">
                <h3>Razem</h3>
                <p style={{ fontSize: '2rem', fontWeight: 700 }}>
                  {moderationStats.total || 0}
                </p>
              </div>
            </div>
          )}

          {/* Filter buttons */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <button
              onClick={() => { setModerationStatus('pending'); loadModerationProducts('pending'); }}
              className="btn"
              style={{
                backgroundColor: moderationStatus === 'pending' ? 'var(--accent-purple)' : 'var(--bg-cream)',
                color: moderationStatus === 'pending' ? 'white' : 'var(--text-dark)'
              }}
            >
              Oczekujące
            </button>
            <button
              onClick={() => { setModerationStatus('approved'); loadModerationProducts('approved'); }}
              className="btn"
              style={{
                backgroundColor: moderationStatus === 'approved' ? 'var(--accent-purple)' : 'var(--bg-cream)',
                color: moderationStatus === 'approved' ? 'white' : 'var(--text-dark)'
              }}
            >
              Zaakceptowane
            </button>
            <button
              onClick={() => { setModerationStatus('rejected'); loadModerationProducts('rejected'); }}
              className="btn"
              style={{
                backgroundColor: moderationStatus === 'rejected' ? 'var(--accent-purple)' : 'var(--bg-cream)',
                color: moderationStatus === 'rejected' ? 'white' : 'var(--text-dark)'
              }}
            >
              Odrzucone
            </button>
          </div>

          {/* Products List */}
          {moderationProducts.length === 0 ? (
            <div style={{
              padding: '3rem',
              textAlign: 'center',
              backgroundColor: 'var(--bg-cream)',
              borderRadius: '8px'
            }}>
              <p style={{ color: 'var(--text-light)' }}>
                Brak produktów do wyświetlenia
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {moderationProducts.map(product => (
                <div
                  key={product.id}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  {product.ProductImages && product.ProductImages[0] && (
                    <img
                      src={`http://localhost:3001${product.ProductImages[0].image_url}`}
                      alt={product.title}
                      style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                    />
                  )}
                  <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{product.title}</h3>
                    <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                      Kategoria: {product.Category?.name || 'Brak'}
                    </p>
                    <p style={{ color: 'var(--text-light)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                      Sprzedawca: {product.User?.username || 'Nieznany'}
                    </p>
                    <p style={{ fontWeight: 700, fontSize: '1.2rem', marginBottom: '0.5rem' }}>
                      {product.price} zł
                    </p>
                    <p style={{ color: 'var(--text-light)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                      Dodano: {new Date(product.created_at).toLocaleDateString('pl-PL')}
                    </p>

                    {product.moderation_status === 'rejected' && product.rejection_reason && (
                      <div style={{
                        backgroundColor: '#fee',
                        padding: '0.75rem',
                        borderRadius: '4px',
                        marginBottom: '1rem',
                        fontSize: '0.9rem'
                      }}>
                        <strong>Powód odrzucenia:</strong>
                        <p style={{ marginTop: '0.25rem' }}>{product.rejection_reason}</p>
                      </div>
                    )}

                    {moderationStatus === 'pending' && (
                      <div style={{ marginTop: 'auto', display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => handleApproveProduct(product.id)}
                          style={{
                            flex: 1,
                            padding: '0.75rem',
                            backgroundColor: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 600
                          }}
                        >
                          Zaakceptuj
                        </button>
                        <button
                          onClick={() => setSelectedProductForRejection(product.id)}
                          style={{
                            flex: 1,
                            padding: '0.75rem',
                            backgroundColor: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 600
                          }}
                        >
                          Odrzuć
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Rejection Modal */}
          {selectedProductForRejection && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000
            }}>
              <div style={{
                backgroundColor: 'white',
                padding: '2rem',
                borderRadius: '8px',
                maxWidth: '500px',
                width: '90%'
              }}>
                <h3 style={{ marginBottom: '1rem' }}>Podaj powód odrzucenia</h3>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Wyjaśnij sprzedawcy dlaczego produkt został odrzucony..."
                  style={{
                    width: '100%',
                    minHeight: '120px',
                    padding: '0.75rem',
                    border: '1px solid var(--border-light)',
                    borderRadius: '6px',
                    fontSize: '0.95rem',
                    marginBottom: '1rem',
                    resize: 'vertical'
                  }}
                />
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => { setSelectedProductForRejection(null); setRejectionReason(''); }}
                    className="btn"
                    style={{ backgroundColor: 'var(--bg-cream)', color: 'var(--text-dark)' }}
                  >
                    Anuluj
                  </button>
                  <button
                    onClick={handleRejectProduct}
                    className="btn"
                    style={{ backgroundColor: '#ef4444', color: 'white' }}
                  >
                    Odrzuć produkt
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Categories Management Tab */}
      {activeTab === 'categories' && user.role === 'admin' && (
        <CategoriesManagement />
      )}

      {/* Users Management Tab */}
      {activeTab === 'users' && user.role === 'admin' && (
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '1.5rem' }}>
            Zarządzanie Użytkownikami
          </h2>

          {allUsers.length === 0 ? (
            <div style={{
              padding: '3rem',
              textAlign: 'center',
              backgroundColor: 'var(--bg-cream)',
              borderRadius: '8px'
            }}>
              <p style={{ color: 'var(--text-light)' }}>Brak użytkowników</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                backgroundColor: 'white',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-cream)' }}>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Użytkownik</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Email</th>
                    <th style={{ padding: '1rem', textAlign: 'left' }}>Rola</th>
                    <th style={{ padding: '1rem', textAlign: 'center' }}>Ogłoszenia</th>
                    <th style={{ padding: '1rem', textAlign: 'center' }}>Komentarze</th>
                    <th style={{ padding: '1rem', textAlign: 'center' }}>Motywy</th>
                    <th style={{ padding: '1rem', textAlign: 'center' }}>Akcje</th>
                  </tr>
                </thead>
                <tbody>
                  {allUsers.map((u, idx) => (
                    <tr key={u.id} style={{ borderTop: idx > 0 ? '1px solid var(--border-light)' : 'none' }}>
                      <td style={{ padding: '1rem' }}>{u.username}</td>
                      <td style={{ padding: '1rem', fontSize: '0.9rem' }}>{u.email}</td>
                      <td style={{ padding: '1rem' }}>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '12px',
                          fontSize: '0.85rem',
                          backgroundColor: u.role === 'admin' ? '#8b5cf6' : '#e0e7ff',
                          color: u.role === 'admin' ? 'white' : '#4c1d95'
                        }}>
                          {u.role === 'admin' ? 'Admin' : 'User'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        {u.role === 'admin' || u.can_moderate_products ? '✓' : '—'}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        {u.role === 'admin' || u.can_moderate_comments ? '✓' : '—'}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        {u.role === 'admin' || u.can_manage_themes ? '✓' : '—'}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                            }}
                            className="btn"
                            style={{
                              padding: '0.5rem 1rem',
                              fontSize: '0.85rem',
                              backgroundColor: 'var(--accent-purple)',
                              color: 'white'
                            }}
                          >
                            Uprawnienia
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Edit User Modal */}
          {selectedUser && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000
            }}>
              <div style={{
                backgroundColor: 'white',
                padding: '2rem',
                borderRadius: '8px',
                maxWidth: '600px',
                width: '90%',
                maxHeight: '80vh',
                overflowY: 'auto'
              }}>
                <h3 style={{ marginBottom: '1.5rem' }}>
                  Zarządzanie uprawnieniami: <strong>{selectedUser.username}</strong>
                </h3>

                <div style={{ marginBottom: '1.5rem' }}>
                  <p style={{ marginBottom: '1rem', color: 'var(--text-light)', fontSize: '0.95rem' }}>
                    Wybierz uprawnienia dla użytkownika. Użytkownik zobaczy odpowiednie zakładki w swoim panelu.
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <label style={{ 
                      display: 'flex', 
                      alignItems: 'start', 
                      gap: '0.75rem',
                      padding: '1rem',
                      border: '2px solid var(--border-light)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--primary-color)'}
                    onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-light)'}
                    >
                      <input
                        type="checkbox"
                        checked={selectedUser.can_moderate_products}
                        onChange={(e) => {
                          setSelectedUser({...selectedUser, can_moderate_products: e.target.checked});
                        }}
                        style={{ marginTop: '0.25rem' }}
                      />
                      <div>
                        <span style={{ fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>
                          📋 Moderacja Ogłoszeń
                        </span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>
                          Zatwierdzanie i odrzucanie ogłoszeń produktów
                        </span>
                      </div>
                    </label>

                    <label style={{ 
                      display: 'flex', 
                      alignItems: 'start', 
                      gap: '0.75rem',
                      padding: '1rem',
                      border: '2px solid var(--border-light)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--primary-color)'}
                    onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-light)'}
                    >
                      <input
                        type="checkbox"
                        checked={selectedUser.can_moderate_comments}
                        onChange={(e) => {
                          setSelectedUser({...selectedUser, can_moderate_comments: e.target.checked});
                        }}
                        style={{ marginTop: '0.25rem' }}
                      />
                      <div>
                        <span style={{ fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>
                          💬 Moderacja Komentarzy
                        </span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>
                          Zatwierdzanie i odrzucanie komentarzy do produktów
                        </span>
                      </div>
                    </label>

                    <label style={{ 
                      display: 'flex', 
                      alignItems: 'start', 
                      gap: '0.75rem',
                      padding: '1rem',
                      border: '2px solid var(--border-light)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--primary-color)'}
                    onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-light)'}
                    >
                      <input
                        type="checkbox"
                        checked={selectedUser.can_manage_themes}
                        onChange={(e) => {
                          setSelectedUser({...selectedUser, can_manage_themes: e.target.checked});
                        }}
                        style={{ marginTop: '0.25rem' }}
                      />
                      <div>
                        <span style={{ fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>
                          🎨 Zarządzanie Motywami
                        </span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>
                          Tworzenie nowych motywów i ustawianie domyślnego
                        </span>
                      </div>
                    </label>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => { setSelectedUser(null); }}
                    className="btn"
                    style={{ backgroundColor: 'var(--bg-cream)', color: 'var(--text-dark)' }}
                  >
                    Anuluj
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        const token = localStorage.getItem('token');
                        const response = await fetch(`http://localhost:3001/api/admin/users/${selectedUser.id}/permissions`, {
                          method: 'PUT',
                          headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                          },
                          body: JSON.stringify({
                            can_moderate_products: selectedUser.can_moderate_products,
                            can_moderate_comments: selectedUser.can_moderate_comments,
                            can_manage_themes: selectedUser.can_manage_themes
                          })
                        });

                        if (response.ok) {
                          alert('Uprawnienia zaktualizowane');
                          loadAllUsers();
                          setSelectedUser(null);
                          
                          // Jeśli edytujemy uprawnienia zalogowanego użytkownika, odśwież dane
                          if (refreshUser && selectedUser.id === user.id) {
                            await refreshUser();
                          }
                        } else {
                          const data = await response.json();
                          alert(data.error || 'Błąd podczas aktualizacji');
                        }
                      } catch (error) {
                        console.error('Failed to update permissions:', error);
                        alert('Wystąpił błąd');
                      }
                    }}
                    className="btn"
                    style={{ backgroundColor: 'var(--accent-purple)', color: 'white' }}
                  >
                    Zapisz zmiany
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Purchases Tab */}
      {activeTab === 'purchases' && (
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '1.5rem' }}>
            Moje zakupy
          </h2>

          {purchases.length === 0 ? (
            <div style={{
              padding: '3rem',
              textAlign: 'center',
              backgroundColor: 'var(--bg-cream)',
              borderRadius: '8px'
            }}>
              <p style={{ color: 'var(--text-light)' }}>Nie masz jeszcze żadnych zakupów</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {purchases.map(order => (
                <div
                  key={order.id}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    padding: '1.5rem',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                        Zamówienie #{order.id}
                      </h3>
                      <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>
                        Data: {new Date(order.created_at).toLocaleDateString('pl-PL')} • 
                        Status: <span style={{ 
                          fontWeight: 600,
                          color: order.status === 'completed' ? '#10b981' : '#f59e0b'
                        }}>
                          {order.status === 'completed' ? 'Zrealizowane' : 'W trakcie'}
                        </span>
                      </p>
                    </div>
                    <p style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                      {order.total_price} zł
                    </p>
                  </div>

                  {order.items && order.items.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {order.items.map(item => (
                        <div 
                          key={item.id}
                          style={{
                            display: 'flex',
                            gap: '1rem',
                            padding: '1rem',
                            backgroundColor: 'var(--bg-light)',
                            borderRadius: '6px'
                          }}
                        >
                          {item.Product?.ProductImages?.[0] && (
                            <img
                              src={`http://localhost:3001${item.Product.ProductImages[0].image_url}`}
                              alt={item.Product.title}
                              style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '6px' }}
                            />
                          )}
                          <div style={{ flex: 1 }}>
                            <h4 style={{ marginBottom: '0.25rem' }}>{item.Product?.title}</h4>
                            <p style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>
                              Sprzedawca: {item.seller?.username}
                            </p>
                            <p style={{ fontWeight: 600, marginTop: '0.5rem' }}>
                              {item.price} zł × {item.quantity}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {order.status === 'completed' && !order.review_submitted && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                      <button
                        onClick={() => {
                          setSelectedOrderForReview(order);
                          setReviewRating(5);
                          setReviewComment('');
                        }}
                        className="btn"
                        style={{
                          flex: 1,
                          backgroundColor: '#10b981',
                          color: 'white'
                        }}
                      >
                        ⭐ Oceń sprzedawcę
                      </button>
                    </div>
                  )}

                  {order.review_submitted && (
                    <div style={{
                      marginTop: '1rem',
                      padding: '0.75rem',
                      backgroundColor: '#d1fae5',
                      borderRadius: '6px',
                      color: '#065f46',
                      textAlign: 'center'
                    }}>
                      ✓ Dziękujemy za opinię!
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Review Modal */}
          {selectedOrderForReview && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000
            }}>
              <div style={{
                backgroundColor: 'white',
                padding: '2rem',
                borderRadius: '8px',
                maxWidth: '600px',
                width: '90%',
                maxHeight: '80vh',
                overflowY: 'auto'
              }}>
                <h3 style={{ marginBottom: '1.5rem' }}>
                  Oceń zamówienie #{selectedOrderForReview.id}
                </h3>

                {/* Ocena sprzedawcy */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.5rem' }}>
                    Ocena sprzedawcy *
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                    {[1, 2, 3, 4, 5].map(rating => (
                      <button
                        key={rating}
                        onClick={() => setReviewRating(rating)}
                        style={{
                          fontSize: '2rem',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: rating <= reviewRating ? '#fbbf24' : '#d1d5db'
                        }}
                      >
                        ⭐
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Opcjonalnie: Opisz swoje doświadczenie ze sprzedawcą..."
                    style={{
                      width: '100%',
                      minHeight: '100px',
                      padding: '0.75rem',
                      border: '1px solid var(--border-light)',
                      borderRadius: '6px',
                      fontSize: '0.95rem',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => {
                      setSelectedOrderForReview(null);
                      setReviewRating(5);
                      setReviewComment('');
                    }}
                    className="btn"
                    style={{ backgroundColor: 'var(--bg-cream)', color: 'var(--text-dark)' }}
                    disabled={isSubmittingReview}
                  >
                    Anuluj
                  </button>
                  <button
                    onClick={handleSubmitReview}
                    className="btn"
                    style={{ backgroundColor: '#10b981', color: 'white' }}
                    disabled={isSubmittingReview}
                  >
                    {isSubmittingReview ? 'Wysyłanie...' : 'Wyślij opinię'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
