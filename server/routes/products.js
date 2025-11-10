// ============================================
// PRODUCT ROUTES - Lista produktów, szczegóły
// ============================================
const express = require('express');
const { Product, ProductImage, User, Category } = require('../models');
const { authMiddleware, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// ============================================
// GET /api/products - Lista produktów
// ============================================
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { category, limit = 12, offset = 0 } = req.query;

    const where = { status: 'published' };
    const include = [
      {
        model: User,
        as: 'seller',
        attributes: ['username', 'avatar_url']
      },
      {
        model: Category,
        as: 'category',
        attributes: ['name', 'slug']
      },
      {
        model: ProductImage,
        as: 'images',
        where: { is_primary: true },
        required: false,
        attributes: ['image_url']
      }
    ];

    // Filter by category if provided
    if (category) {
      include[1].where = { slug: category };
    }

    const products = await Product.findAll({
      where,
      include,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    res.json({ products });

  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Failed to get products' });
  }
});

// ============================================
// GET /api/products/:id - Szczegóły produktu
// ============================================
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findOne({
      where: { id, status: 'published' },
      include: [
        {
          model: User,
          as: 'seller',
          attributes: ['username', 'avatar_url']
        },
        {
          model: Category,
          as: 'category',
          attributes: ['name', 'slug']
        },
        {
          model: ProductImage,
          as: 'images',
          attributes: ['id', 'image_url', 'is_primary'],
          order: [['display_order', 'ASC']]
        }
      ]
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Zwiększ licznik wyświetleń
    await product.increment('views_count');

    res.json({ product });

  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Failed to get product' });
  }
});

// ============================================
// POST /api/products - Dodaj produkt (wymaga auth)
// ============================================
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, description, price, category_id, stock_quantity, images } = req.body;

    if (!title || !price || !category_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Stwórz slug
    const slug = title.toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-') + '-' + Date.now();

    // Dodaj produkt
    const product = await Product.create({
      user_id: req.user.id,
      category_id,
      title,
      slug,
      description,
      price,
      stock_quantity: stock_quantity || 0,
      status: 'published'
    });

    // Dodaj zdjęcia jeśli są
    if (images && images.length > 0) {
      const imageData = images.map((url, index) => ({
        product_id: product.id,
        image_url: url,
        is_primary: index === 0,
        display_order: index
      }));
      await ProductImage.bulkCreate(imageData);
    }

    res.status(201).json({ message: 'Product created', productId: product.id });

  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

module.exports = router;
