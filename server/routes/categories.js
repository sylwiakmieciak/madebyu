// ============================================
// CATEGORY ROUTES - Lista kategorii
// ============================================
const express = require('express');
const { Category } = require('../models');

const router = express.Router();

// ============================================
// GET /api/categories - Wszystkie kategorie
// ============================================
router.get('/', async (req, res) => {
  try {
    const categories = await Category.findAll({
      where: { is_active: true },
      attributes: ['id', 'name', 'slug', 'parent_id', 'display_order'],
      order: [['parent_id', 'ASC'], ['display_order', 'ASC']]
    });

    res.json({ categories });

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to get categories' });
  }
});

module.exports = router;
