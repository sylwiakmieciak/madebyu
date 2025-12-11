// MODERATION ROUTES - System moderacji

const express = require('express');
const { Product, User, Category, ProductImage, Notification } = require('../models');
const { authMiddleware } = require('../middleware/auth');
const { Op } = require('sequelize');

const router = express.Router();

// Middleware sprawdzający uprawnienia moderatora
const moderatorMiddleware = async (req, res, next) => {
  if (req.user.role === 'admin' || req.user.is_moderator) {
    next();
  } else {
    res.status(403).json({ error: 'Brak uprawnień moderatora' });
  }
};


// GET /api/moderation/products - Pobierz produkty do moderacji

router.get('/products', authMiddleware, moderatorMiddleware, async (req, res) => {
  try {
    const { status = 'pending' } = req.query;
    
    const where = { moderation_status: status };
    
    // Jeśli użytkownik jest moderatorem (nie adminem), pokaż tylko produkty z jego kategorii
    if (req.user.role !== 'admin' && req.user.moderation_categories && req.user.moderation_categories.length > 0) {
      where.category_id = { [Op.in]: req.user.moderation_categories };
    }
    
    const products = await Product.findAll({
      where,
      include: [
        {
          model: User,
          as: 'seller',
          attributes: ['id', 'username', 'email', 'full_name', 'avatar_url']
        },
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'slug']
        },
        {
          model: ProductImage,
          as: 'images',
          attributes: ['id', 'image_url', 'is_primary'],
          required: false
        },
        {
          model: User,
          as: 'moderator',
          attributes: ['id', 'username', 'full_name'],
          required: false
        }
      ],
      order: [['created_at', 'DESC']]
    });
    
    res.json({ products });
    
  } catch (error) {
    console.error('Get moderation products error:', error);
    res.status(500).json({ error: 'Nie udało się pobrać produktów do moderacji' });
  }
});


// PUT /api/moderation/products/:id/approve - Zaakceptuj produkt

router.put('/products/:id/approve', authMiddleware, moderatorMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await Product.findByPk(id, {
      include: [{ model: User, as: 'seller' }]
    });
    
    if (!product) {
      return res.status(404).json({ error: 'Produkt nie znaleziony' });
    }
    
    // Sprawdź czy moderator ma uprawnienia do tej kategorii
    if (req.user.role !== 'admin' && 
        req.user.moderation_categories && 
        !req.user.moderation_categories.includes(product.category_id)) {
      return res.status(403).json({ error: 'Brak uprawnień do moderacji tej kategorii' });
    }
    
    await product.update({
      moderation_status: 'approved',
      moderated_by: req.user.id,
      moderated_at: new Date(),
      rejection_reason: null,
      status: 'published' // Automatycznie publikuj zaakceptowane produkty
    });
    
    // Wyślij powiadomienie do sprzedawcy
    await Notification.create({
      user_id: product.user_id,
      type: 'product_approved',
      title: 'Produkt zaakceptowany',
      message: `Twój produkt "${product.title}" został zaakceptowany przez moderatora i jest teraz widoczny w sklepie.`,
      related_id: product.id,
      is_read: false
    });
    
    res.json({ message: 'Produkt zaakceptowany', product });
    
  } catch (error) {
    console.error('Approve product error:', error);
    res.status(500).json({ error: 'Nie udało się zaakceptować produktu' });
  }
});


// PUT /api/moderation/products/:id/reject - Odrzuć produkt

router.put('/products/:id/reject', authMiddleware, moderatorMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ error: 'Podaj powód odrzucenia' });
    }
    
    const product = await Product.findByPk(id, {
      include: [{ model: User, as: 'seller' }]
    });
    
    if (!product) {
      return res.status(404).json({ error: 'Produkt nie znaleziony' });
    }
    
    // Sprawdź czy moderator ma uprawnienia do tej kategorii
    if (req.user.role !== 'admin' && 
        req.user.moderation_categories && 
        !req.user.moderation_categories.includes(product.category_id)) {
      return res.status(403).json({ error: 'Brak uprawnień do moderacji tej kategorii' });
    }
    
    await product.update({
      moderation_status: 'rejected',
      moderated_by: req.user.id,
      moderated_at: new Date(),
      rejection_reason: reason,
      status: 'draft' // Cofnij do draftu
    });
    
    // Wyślij powiadomienie do sprzedawcy
    await Notification.create({
      user_id: product.user_id,
      type: 'product_rejected',
      title: 'Produkt odrzucony',
      message: `Twój produkt "${product.title}" został odrzucony przez moderatora. Powód: ${reason}`,
      related_id: product.id,
      is_read: false
    });
    
    res.json({ message: 'Produkt odrzucony', product });
    
  } catch (error) {
    console.error('Reject product error:', error);
    res.status(500).json({ error: 'Nie udało się odrzucić produktu' });
  }
});


// GET /api/moderation/stats - Statystyki moderacji

router.get('/stats', authMiddleware, moderatorMiddleware, async (req, res) => {
  try {
    const where = {};
    
    // Filtruj po kategoriach moderatora
    if (req.user.role !== 'admin' && req.user.moderation_categories && req.user.moderation_categories.length > 0) {
      where.category_id = { [Op.in]: req.user.moderation_categories };
    }
    
    const pending = await Product.count({ where: { ...where, moderation_status: 'pending' } });
    const approved = await Product.count({ where: { ...where, moderation_status: 'approved' } });
    const rejected = await Product.count({ where: { ...where, moderation_status: 'rejected' } });
    
    res.json({
      stats: {
        pending,
        approved,
        rejected,
        total: pending + approved + rejected
      }
    });
    
  } catch (error) {
    console.error('Get moderation stats error:', error);
    res.status(500).json({ error: 'Nie udało się pobrać statystyk' });
  }
});

module.exports = router;
