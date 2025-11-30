// NOTIFICATION ROUTES - Powiadomienia

const express = require('express');
const { Notification, Order } = require('../models');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();


// GET /api/notifications - Pobierz powiadomienia użytkownika

router.get('/', authMiddleware, async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: { user_id: req.user.id },
      include: [
        {
          model: Order,
          as: 'order',
          attributes: ['id', 'order_number', 'status', 'total_amount'],
          required: false
        }
      ],
      order: [['created_at', 'DESC']],
      limit: 50
    });

    res.json({ notifications });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Nie udało się pobrać powiadomień' });
  }
});


// PUT /api/notifications/:id/read - Oznacz jako przeczytane

router.put('/:id/read', authMiddleware, async (req, res) => {
  try {
    const notification = await Notification.findOne({
      where: { 
        id: req.params.id,
        user_id: req.user.id 
      }
    });

    if (!notification) {
      return res.status(404).json({ error: 'Powiadomienie nie znalezione' });
    }

    notification.is_read = true;
    notification.read_at = new Date();
    await notification.save();

    res.json({ 
      message: 'Powiadomienie oznaczone jako przeczytane',
      notification 
    });

  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ error: 'Nie udało się zaktualizować powiadomienia' });
  }
});


// PUT /api/notifications/read-all - Oznacz wszystkie jako przeczytane

router.put('/read-all', authMiddleware, async (req, res) => {
  try {
    await Notification.update(
      { 
        is_read: true,
        read_at: new Date()
      },
      { 
        where: { 
          user_id: req.user.id,
          is_read: false
        }
      }
    );

    res.json({ message: 'Wszystkie powiadomienia oznaczone jako przeczytane' });

  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ error: 'Nie udało się zaktualizować powiadomień' });
  }
});


// GET /api/notifications/unread-count - Liczba nieprzeczytanych

router.get('/unread-count', authMiddleware, async (req, res) => {
  try {
    const count = await Notification.count({
      where: { 
        user_id: req.user.id,
        is_read: false
      }
    });

    res.json({ count });

  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Nie udało się pobrać liczby powiadomień' });
  }
});

module.exports = router;
