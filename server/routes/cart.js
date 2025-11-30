// CART ROUTES - Zarządzanie koszykiem

const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { Product, ProductImage } = require('../models');

const router = express.Router();


// GET /api/cart
// Pobierz koszyk użytkownika

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { sequelize } = require('../models');
    
    // Pobierz koszyk z tabeli user_carts
    const [results] = await sequelize.query(`
      SELECT 
        p.id,
        p.title,
        p.price,
        p.stock_quantity,
        uc.quantity,
        pi.image_url
      FROM user_carts uc
      JOIN products p ON uc.product_id = p.id
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.display_order = 0
      WHERE uc.user_id = :userId
      ORDER BY uc.created_at DESC
    `, {
      replacements: { userId: req.user.id }
    });

    // Format dla frontendu
    const cart = results.map(item => ({
      id: item.id,
      title: item.title,
      price: parseFloat(item.price),
      quantity: item.quantity,
      stock_quantity: item.stock_quantity,
      image: item.image_url ? `http://localhost:3001${item.image_url}` : null
    }));

    res.json({ cart });
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ error: 'Nie udało się pobrać koszyka' });
  }
});


// POST /api/cart/sync
// Synchronizuj koszyk z localStorage

router.post('/sync', authMiddleware, async (req, res) => {
  try {
    const { cart } = req.body;
    const { sequelize } = require('../models');

    if (!Array.isArray(cart)) {
      return res.status(400).json({ error: 'Nieprawidłowy format koszyka' });
    }

    // Wyczyść obecny koszyk
    await sequelize.query(`
      DELETE FROM user_carts WHERE user_id = :userId
    `, {
      replacements: { userId: req.user.id }
    });

    // Dodaj nowe produkty
    for (const item of cart) {
      await sequelize.query(`
        INSERT INTO user_carts (user_id, product_id, quantity, created_at, updated_at)
        VALUES (:userId, :productId, :quantity, NOW(), NOW())
      `, {
        replacements: {
          userId: req.user.id,
          productId: item.id,
          quantity: item.quantity
        }
      });
    }

    res.json({ message: 'Koszyk zsynchronizowany' });
  } catch (error) {
    console.error('Sync cart error:', error);
    res.status(500).json({ error: 'Nie udało się zsynchronizować koszyka' });
  }
});


// PUT /api/cart/:productId
// Zaktualizuj ilość produktu w koszyku

router.put('/:productId', authMiddleware, async (req, res) => {
  try {
    const { quantity } = req.body;
    const { sequelize } = require('../models');

    if (quantity < 1) {
      // Usuń produkt jeśli ilość < 1
      await sequelize.query(`
        DELETE FROM user_carts 
        WHERE user_id = :userId AND product_id = :productId
      `, {
        replacements: { 
          userId: req.user.id,
          productId: req.params.productId 
        }
      });
    } else {
      // Zaktualizuj ilość
      await sequelize.query(`
        INSERT INTO user_carts (user_id, product_id, quantity, created_at, updated_at)
        VALUES (:userId, :productId, :quantity, NOW(), NOW())
        ON DUPLICATE KEY UPDATE quantity = :quantity, updated_at = NOW()
      `, {
        replacements: {
          userId: req.user.id,
          productId: req.params.productId,
          quantity
        }
      });
    }

    res.json({ message: 'Koszyk zaktualizowany' });
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({ error: 'Nie udało się zaktualizować koszyka' });
  }
});


// DELETE /api/cart/:productId
// Usuń produkt z koszyka

router.delete('/:productId', authMiddleware, async (req, res) => {
  try {
    const { sequelize } = require('../models');

    await sequelize.query(`
      DELETE FROM user_carts 
      WHERE user_id = :userId AND product_id = :productId
    `, {
      replacements: { 
        userId: req.user.id,
        productId: req.params.productId 
      }
    });

    res.json({ message: 'Produkt usunięty z koszyka' });
  } catch (error) {
    console.error('Delete from cart error:', error);
    res.status(500).json({ error: 'Nie udało się usunąć produktu' });
  }
});


// DELETE /api/cart
// Wyczyść cały koszyk

router.delete('/', authMiddleware, async (req, res) => {
  try {
    const { sequelize } = require('../models');

    await sequelize.query(`
      DELETE FROM user_carts WHERE user_id = :userId
    `, {
      replacements: { userId: req.user.id }
    });

    res.json({ message: 'Koszyk wyczyszczony' });
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ error: 'Nie udało się wyczyścić koszyka' });
  }
});

module.exports = router;
