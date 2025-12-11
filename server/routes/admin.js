// ADMIN ROUTES - Zarządzanie systemem

const express = require('express');
const { User, Category } = require('../models');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Middleware sprawdzający uprawnienia admina
const adminMiddleware = (req, res, next) => {
  if (req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Brak uprawnień administratora' });
  }
};


// GET /api/admin/users - Pobierz listę użytkowników

router.get('/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: [
        'id', 'username', 'email', 'full_name', 'role', 
        'is_moderator', 'moderation_categories', 
        'can_moderate_products', 'can_moderate_comments', 'can_manage_themes',
        'created_at'
      ],
      order: [['created_at', 'DESC']]
    });
    
    res.json({ users });
    
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Nie udało się pobrać użytkowników' });
  }
});


// PUT /api/admin/users/:id/moderator - Ustaw/usuń uprawnienia moderatora

router.put('/users/:id/moderator', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { is_moderator, moderation_categories } = req.body;
    
    const user = await User.findByPk(id);
    
    if (!user) {
      return res.status(404).json({ error: 'Użytkownik nie znaleziony' });
    }
    
    if (user.role === 'admin') {
      return res.status(400).json({ error: 'Nie można zmieniać uprawnień administratora' });
    }
    
    await user.update({
      is_moderator: is_moderator,
      moderation_categories: moderation_categories || []
    });
    
    res.json({ 
      message: is_moderator ? 'Nadano uprawnienia moderatora' : 'Odebrano uprawnienia moderatora', 
      user 
    });
    
  } catch (error) {
    console.error('Update moderator error:', error);
    res.status(500).json({ error: 'Nie udało się zaktualizować uprawnień' });
  }
});


// PUT /api/admin/users/:id/permissions - Zarządzaj uprawnieniami użytkownika

router.put('/users/:id/permissions', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { can_moderate_products, can_moderate_comments, can_manage_themes, moderation_categories } = req.body;
    
    const user = await User.findByPk(id);
    
    if (!user) {
      return res.status(404).json({ error: 'Użytkownik nie znaleziony' });
    }
    
    if (user.role === 'admin') {
      return res.status(400).json({ error: 'Nie można zmieniać uprawnień administratora' });
    }
    
    await user.update({
      can_moderate_products: can_moderate_products || false,
      can_moderate_comments: can_moderate_comments || false,
      can_manage_themes: can_manage_themes || false,
      moderation_categories: moderation_categories || []
    });
    
    res.json({ 
      message: 'Uprawnienia zaktualizowane', 
      user 
    });
    
  } catch (error) {
    console.error('Update permissions error:', error);
    res.status(500).json({ error: 'Nie udało się zaktualizować uprawnień' });
  }
});


// GET /api/admin/categories - Pobierz wszystkie kategorie (dla wyboru moderacji)

router.get('/categories', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const categories = await Category.findAll({
      attributes: ['id', 'name', 'slug', 'parent_id'],
      order: [['name', 'ASC']]
    });
    
    res.json({ categories });
    
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Nie udało się pobrać kategorii' });
  }
});

module.exports = router;
