// REVIEW ROUTES - Oceny sprzedawców

const express = require('express');
const { Review, User, Order, OrderItem, Product } = require('../models');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();


// GET /api/reviews/seller/:userId - Pobierz oceny sprzedawcy

router.get('/seller/:userId', async (req, res) => {
  try {
    const reviews = await Review.findAll({
      where: { seller_id: req.params.userId },
      include: [
        {
          model: User,
          as: 'buyer',
          attributes: ['id', 'username', 'full_name', 'avatar_url']
        },
        {
          model: Order,
          as: 'order',
          attributes: ['order_number', 'created_at']
        }
      ],
      order: [['created_at', 'DESC']]
    });

    // Oblicz średnią ocenę
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = reviews.length > 0 ? (totalRating / reviews.length).toFixed(1) : 0;

    // Rozkład ocen
    const ratingDistribution = {
      5: reviews.filter(r => r.rating === 5).length,
      4: reviews.filter(r => r.rating === 4).length,
      3: reviews.filter(r => r.rating === 3).length,
      2: reviews.filter(r => r.rating === 2).length,
      1: reviews.filter(r => r.rating === 1).length
    };

    res.json({
      reviews,
      stats: {
        total: reviews.length,
        average: parseFloat(averageRating),
        distribution: ratingDistribution
      }
    });

  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ error: 'Nie udało się pobrać ocen' });
  }
});


// GET /api/reviews/product/:productId - Pobierz oceny produktu

router.get('/product/:productId', async (req, res) => {
  try {
    const { productId } = req.params;

    // Znajdź wszystkie zamówienia zawierające ten produkt
    const orderItems = await OrderItem.findAll({
      where: { product_id: productId },
      attributes: ['order_id', 'seller_id'],
      include: [
        {
          model: Order,
          as: 'order',
          attributes: ['id'],
          include: [
            {
              model: Review,
              as: 'reviews',
              required: true,
              include: [
                {
                  model: User,
                  as: 'buyer',
                  attributes: ['id', 'username', 'full_name', 'avatar_url']
                }
              ]
            }
          ]
        }
      ]
    });

    // Wyciągnij unikalne recenzje dla sprzedawcy tego produktu
    const reviews = [];
    const seenReviewIds = new Set();

    orderItems.forEach(item => {
      if (item.order?.reviews) {
        item.order.reviews.forEach(review => {
          // Dodaj tylko jeśli recenzja dotyczy sprzedawcy tego produktu
          if (review.seller_id === item.seller_id && !seenReviewIds.has(review.id)) {
            seenReviewIds.add(review.id);
            reviews.push({
              ...review.toJSON(),
              order_number: item.order.order_number
            });
          }
        });
      }
    });

    // Oblicz średnią ocenę
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = reviews.length > 0 ? (totalRating / reviews.length).toFixed(1) : 0;

    // Rozkład ocen
    const ratingDistribution = {
      5: reviews.filter(r => r.rating === 5).length,
      4: reviews.filter(r => r.rating === 4).length,
      3: reviews.filter(r => r.rating === 3).length,
      2: reviews.filter(r => r.rating === 2).length,
      1: reviews.filter(r => r.rating === 1).length
    };

    res.json({
      reviews,
      stats: {
        total: reviews.length,
        average: parseFloat(averageRating),
        distribution: ratingDistribution
      }
    });

  } catch (error) {
    console.error('Get product reviews error:', error);
    res.status(500).json({ error: 'Nie udało się pobrać ocen produktu' });
  }
});

module.exports = router;