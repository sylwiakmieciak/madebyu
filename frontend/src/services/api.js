// ============================================
// API SERVICE - Centralne API dla całego frontendu
// ============================================
const API_URL = 'http://localhost:3001/api';

// Helper function to get auth token
const getToken = () => localStorage.getItem('token');

// Helper function to make API calls
const apiCall = async (endpoint, options = {}) => {
  const token = getToken();
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };
  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      console.error('Non-JSON response:', text);
      throw new Error('Server returned non-JSON response');
    }
    if (!response.ok) {
      throw new Error(data.error || data.message || 'Request failed');
    }

    return data;
  } catch (error) {
    console.error('API Error details:', {
      message: error.message,
      endpoint,
      method: config.method || 'GET'
    });
    throw error;
  }
};

// ============================================
// AUTH API
// ============================================
export const authAPI = {
  // Rejestracja
  register: async (userData) => {
    return apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  // Logowanie
  login: async (credentials) => {
    return apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  // Pobierz dane zalogowanego użytkownika
  getMe: async () => {
    return apiCall('/auth/me');
  },

  // Wylogowanie (frontend only - usuwamy token)
  logout: () => {
    localStorage.removeItem('token');
  },
};

// ============================================
// PRODUCTS API
// ============================================
export const productsAPI = {
  // Pobierz wszystkie produkty
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`/products${queryString ? `?${queryString}` : ''}`);
  },

  // Pobierz produkt po ID
  getById: async (id) => {
    return apiCall(`/products/${id}`);
  },

  // Dodaj nowy produkt
  create: async (productData) => {
    return apiCall('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  },

  // Edytuj produkt
  update: async (id, productData) => {
    return apiCall(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  },

  // Usuń produkt
  delete: async (id) => {
    return apiCall(`/products/${id}`, {
      method: 'DELETE',
    });
  },
};

// ============================================
// CATEGORIES API
// ============================================
export const categoriesAPI = {
  // Pobierz wszystkie kategorie
  getAll: async () => {
    return apiCall('/categories');
  },
};

// ============================================
// ORDERS API (do zrobienia później)
// ============================================
export const ordersAPI = {
  // Pobierz zamówienia użytkownika
  getMy: async () => {
    return apiCall('/orders/my');
  },

  // Stwórz nowe zamówienie
  create: async (orderData) => {
    return apiCall('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },
};

// ============================================
// GENERIC API METHODS
// ============================================
export const api = {
  get: async (endpoint, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiCall(`${endpoint}${queryString ? `?${queryString}` : ''}`);
  },
  
  post: async (endpoint, data) => {
    return apiCall(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  put: async (endpoint, data) => {
    return apiCall(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  
  delete: async (endpoint) => {
    return apiCall(endpoint, {
      method: 'DELETE',
    });
  },
};

export default {
  auth: authAPI,
  products: productsAPI,
  categories: categoriesAPI,
  orders: ordersAPI,
  ...api
};
