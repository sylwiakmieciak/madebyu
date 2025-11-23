// ============================================
// PRODUCT ROUTES - Lista produktow, szczegoly
// ============================================
const express = require('express');
const { Product, ProductImage, User, Category } = require('../models');
const { authMiddleware, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// ============================================
// GET /api/products - Lista produktow
// ============================================
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { category, categories, search, limit = 12, offset = 0 } = req.query;
    const { Op } = require('sequelize');

    const where = { status: 'published' };
    
    // Dodaj wyszukiwanie po tytule i opisie
    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    // Jeśli są kategorie, znajdź wszystkie ID kategorii + podkategorii
    let categoryIds = null;
    if (categories) {
      const slugs = categories.split(',');
      const allCategories = await Category.findAll({ attributes: ['id', 'slug', 'parent_id'] });
      
      // Znajdź kategorie pasujące do slugów
      const matchedCategories = allCategories.filter(cat => slugs.includes(cat.slug));
      categoryIds = matchedCategories.map(cat => cat.id);
      
      // Dla każdej znalezionej kategorii, dodaj wszystkie jej podkategorie
      const getChildrenIds = (parentId) => {
        const children = allCategories.filter(cat => cat.parent_id === parentId);
        children.forEach(child => {
          if (!categoryIds.includes(child.id)) {
            categoryIds.push(child.id);
          }
          getChildrenIds(child.id); // rekurencja
        });
      };
      
      matchedCategories.forEach(cat => getChildrenIds(cat.id));
    } else if (category) {
      const allCategories = await Category.findAll({ attributes: ['id', 'slug', 'parent_id'] });
      const matchedCategory = allCategories.find(cat => cat.slug === category);
      
      if (matchedCategory) {
        categoryIds = [matchedCategory.id];
        
        const getChildrenIds = (parentId) => {
          const children = allCategories.filter(cat => cat.parent_id === parentId);
          children.forEach(child => {
            categoryIds.push(child.id);
            getChildrenIds(child.id);
          });
        };
        
        getChildrenIds(matchedCategory.id);
      }
    }

    // Dodaj filtr kategorii do where
    if (categoryIds && categoryIds.length > 0) {
      where.category_id = { [Op.in]: categoryIds };
    }

    const include = [
      {
        model: User,
        as: 'seller',
        attributes: ['username', 'avatar_url', 'bio']
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

    const products = await Product.findAll({
      where,
      include,
      attributes: ['id', 'title', 'slug', 'description', 'price', 'stock_quantity', 'status', 'is_featured', 'created_at'],
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
// GET /api/products/my - Produkty uzytkownika
// ============================================
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const products = await Product.findAll({
      where: { user_id: req.user.id },
      attributes: ['id', 'title', 'slug', 'description', 'price', 'stock_quantity', 'status', 'is_featured', 'created_at'],
      include: [
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
      ],
      order: [['created_at', 'DESC']]
    });

    res.json({ products });

  } catch (error) {
    console.error('Get my products error:', error);
    res.status(500).json({ error: 'Failed to get products' });
  }
});

// ============================================
// GET /api/products/featured - Get featured products
// ============================================
router.get('/featured', async (req, res) => {
  try {
    const products = await Product.findAll({
      where: { 
        status: 'published',
        is_featured: true 
      },
      include: [
        {
          model: User,
          as: 'seller',
          attributes: ['username', 'avatar_url', 'bio']
        },
        {
          model: Category,
          as: 'category',
          attributes: ['name', 'slug']
        },
        {
          model: ProductImage,
          as: 'images',
          attributes: ['image_url', 'is_primary'],
          required: false
        }
      ],
      order: [
        ['featured_at', 'DESC'],
        ['created_at', 'DESC']
      ],
      limit: 8
    });

    res.json({ products });

  } catch (error) {
    console.error('Get featured products error:', error);
    res.status(500).json({ error: 'Failed to get featured products' });
  }
});

// ============================================
// PUT /api/products/:id/featured - Toggle featured status (admin only)
// ============================================
router.put('/:id/featured', authMiddleware, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    const product = await Product.findByPk(id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Toggle featured status
    product.is_featured = !product.is_featured;
    product.featured_at = product.is_featured ? new Date() : null;
    await product.save();

    res.json({ 
      message: product.is_featured ? 'Product marked as featured' : 'Product unmarked as featured',
      product 
    });

  } catch (error) {
    console.error('Toggle featured error:', error);
    res.status(500).json({ error: 'Failed to update featured status' });
  }
});

// ============================================
// GET /api/products/:id - Szczegoly produktu
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
          attributes: ['username', 'avatar_url', 'bio']
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

    // NIE zwiększaj automatycznie licznika - użyj osobnego endpointu

    res.json({ product });

  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Failed to get product' });
  }
});

// ============================================
// POST /api/products/:id/view - Zwiększ licznik wyświetleń
// ============================================
router.post('/:id/view', async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findOne({
      where: { id, status: 'published' }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await product.increment('views_count');

    res.json({ success: true, views_count: product.views_count + 1 });

  } catch (error) {
    console.error('Update view count error:', error);
    res.status(500).json({ error: 'Failed to update view count' });
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

    if (price <= 0) {
      return res.status(400).json({ error: 'Price must be greater than 0' });
    }

    // Stworz slug
    const slug = title.toLowerCase()
      .replace(/ą/g, 'a').replace(/ć/g, 'c').replace(/ę/g, 'e')
      .replace(/ł/g, 'l').replace(/ń/g, 'n').replace(/ó/g, 'o')
      .replace(/ś/g, 's').replace(/ź|ż/g, 'z')
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-') + '-' + Date.now();

    // Dodaj produkt
    const product = await Product.create({
      user_id: req.user.id,
      category_id,
      title,
      slug,
      description: description || '',
      price: parseFloat(price),
      stock_quantity: parseInt(stock_quantity) || 1,
      status: 'published'
    });

    // Dodaj zdjecia jesli sa
    if (images && images.length > 0) {
      const imageData = images.map((url, index) => ({
        product_id: product.id,
        image_url: url,
        is_primary: index === 0,
        display_order: index
      }));
      await ProductImage.bulkCreate(imageData);
    }

    res.status(201).json({ message: 'Product created', product });

  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// ============================================
// PUT /api/products/:id - Edytuj produkt
// ============================================
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, price, category_id, stock_quantity } = req.body;

    const product = await Product.findOne({
      where: { id, user_id: req.user.id }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found or unauthorized' });
    }

    // Aktualizuj dane
    if (title) product.title = title;
    if (description !== undefined) product.description = description;
    if (price) product.price = parseFloat(price);
    if (category_id) product.category_id = category_id;
    if (stock_quantity !== undefined) {
      product.stock_quantity = parseInt(stock_quantity);
      
      // Automatyczna archiwizacja gdy stock = 0
      if (product.stock_quantity === 0 && product.status === 'published') {
        product.status = 'archived';
      } else if (product.stock_quantity > 0 && product.status === 'archived') {
        product.status = 'published';
      }
    }

    await product.save();

    res.json({ message: 'Product updated', product });

  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// ============================================
// PUT /api/products/:id/restore - Przywróć produkt z archiwum
// ============================================
router.put('/:id/restore', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { stock_quantity } = req.body;

    const product = await Product.findOne({
      where: { id, user_id: req.user.id, status: 'archived' }
    });

    if (!product) {
      return res.status(404).json({ error: 'Produkt nie znaleziony lub nie jest zarchiwizowany' });
    }

    // Walidacja nowej ilości
    if (!stock_quantity || stock_quantity < 1) {
      return res.status(400).json({ error: 'Podaj prawidłową ilość sztuk (minimum 1)' });
    }

    // Przywróć produkt
    product.status = 'published';
    product.stock_quantity = parseInt(stock_quantity);
    await product.save();

    res.json({ 
      message: 'Produkt przywrócony pomyślnie',
      product 
    });

  } catch (error) {
    console.error('Restore product error:', error);
    res.status(500).json({ error: 'Nie udało się przywrócić produktu' });
  }
});

// ============================================
// DELETE /api/products/:id - Usun produkt
// ============================================
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findOne({
      where: { id, user_id: req.user.id }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found or unauthorized' });
    }

    await product.destroy();

    res.json({ message: 'Product deleted' });

  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

module.exports = router;
