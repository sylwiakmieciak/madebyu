// CATEGORY ROUTES - Lista kategorii

const express = require('express');
const { Category } = require('../models');
const { authMiddleware, requireAdmin } = require('../middleware/auth');

const router = express.Router();


// GET /api/categories - Wszystkie kategorie (drzewo)

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


// GET /api/categories/admin/all - Wszystkie kategorie dla admina

router.get('/admin/all', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const categories = await Category.findAll({
      attributes: ['id', 'name', 'slug', 'parent_id', 'display_order', 'icon', 'description', 'is_active', 'created_at'],
      order: [['parent_id', 'ASC'], ['display_order', 'ASC'], ['name', 'ASC']]
    });

    res.json({ categories });

  } catch (error) {
    console.error('Get admin categories error:', error);
    res.status(500).json({ error: 'Failed to get categories' });
  }
});


// GET /api/categories/:id - Szczegoly kategorii

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


// POST /api/categories - Dodaj kategorie (ADMIN)

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


// PUT /api/categories/:id - Edytuj kategorie (ADMIN)

router.put('/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { name, parent_id, description, icon, display_order, is_active } = req.body;

    const category = await Category.findByPk(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Sprawdź czy nie próbujemy ustawić kategorii jako własnej podkategorii
    if (parent_id && parseInt(parent_id) === parseInt(req.params.id)) {
      return res.status(400).json({ error: 'Category cannot be its own parent' });
    }

    // Generuj nowy slug jeśli zmienia się nazwa
    let slug = category.slug;
    if (name && name !== category.name) {
      slug = name.toLowerCase()
        .replace(/ą/g, 'a').replace(/ć/g, 'c').replace(/ę/g, 'e')
        .replace(/ł/g, 'l').replace(/ń/g, 'n').replace(/ó/g, 'o')
        .replace(/ś/g, 's').replace(/ź|ż/g, 'z')
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-');
    }

    await category.update({
      name: name || category.name,
      slug,
      description: description !== undefined ? description : category.description,
      parent_id: parent_id !== undefined ? parent_id : category.parent_id,
      icon: icon !== undefined ? icon : category.icon,
      display_order: display_order !== undefined ? display_order : category.display_order,
      is_active: is_active !== undefined ? is_active : category.is_active
    });

    res.json({ message: 'Category updated', category });

  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});


// DELETE /api/categories/:id - Usuń kategorie (ADMIN)

router.delete('/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Sprawdź czy kategoria ma podkategorie
    const childrenCount = await Category.count({
      where: { parent_id: req.params.id }
    });

    if (childrenCount > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete category with subcategories. Delete subcategories first.' 
      });
    }

    // Sprawdź czy są produkty w tej kategorii
    const { Product } = require('../models');
    const productsCount = await Product.count({
      where: { category_id: req.params.id }
    });

    if (productsCount > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete category with products. Move or delete products first.' 
      });
    }

    await category.destroy();
    res.json({ message: 'Category deleted' });

  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

module.exports = router;
