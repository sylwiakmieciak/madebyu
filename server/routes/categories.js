// ============================================
// CATEGORY ROUTES - Lista kategorii
// ============================================
const express = require('express');
const { Category } = require('../models');
const { authMiddleware, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// ============================================
// GET /api/categories - Wszystkie kategorie (drzewo)
// ============================================
router.get('/', async (req, res) => {
  try {
    const categories = await Category.findAll({
      where: { is_active: true },
      attributes: ['id', 'name', 'slug', 'parent_id', 'display_order', 'icon', 'description'],
      order: [['parent_id', 'ASC'], ['display_order', 'ASC']]
    });

    // Przeksztalc do struktury drzewa
    const categoryMap = {};
    const tree = [];

    categories.forEach(cat => {
      categoryMap[cat.id] = { ...cat.toJSON(), children: [] };
    });

    categories.forEach(cat => {
      if (cat.parent_id === null) {
        tree.push(categoryMap[cat.id]);
      } else if (categoryMap[cat.parent_id]) {
        categoryMap[cat.parent_id].children.push(categoryMap[cat.id]);
      }
    });

    res.json({ tree, flat: categories });

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to get categories' });
  }
});

// ============================================
// GET /api/categories/:id - Szczegoly kategorii
// ============================================
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id, {
      attributes: ['id', 'name', 'slug', 'description', 'parent_id', 'icon']
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Pobierz podkategorie
    const children = await Category.findAll({
      where: { parent_id: category.id, is_active: true },
      attributes: ['id', 'name', 'slug'],
      order: [['display_order', 'ASC']]
    });

    res.json({ category: { ...category.toJSON(), children } });

  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ error: 'Failed to get category' });
  }
});

// ============================================
// POST /api/categories - Dodaj kategorie (ADMIN)
// ============================================
router.post('/', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { name, parent_id, description, icon } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const slug = name.toLowerCase()
      .replace(/ą/g, 'a').replace(/ć/g, 'c').replace(/ę/g, 'e')
      .replace(/ł/g, 'l').replace(/ń/g, 'n').replace(/ó/g, 'o')
      .replace(/ś/g, 's').replace(/ź|ż/g, 'z')
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');

    const category = await Category.create({
      name,
      slug,
      description,
      parent_id: parent_id || null,
      icon,
      display_order: 0
    });

    res.status(201).json({ message: 'Category created', category });

  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

module.exports = router;
