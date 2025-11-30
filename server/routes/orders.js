// ============================================
// ORDER ROUTES - Zamówienia
// ============================================
const express = require('express');
const { Order, OrderItem, Product, User, ProductImage, Notification, Review } = require('../models');
const { authMiddleware } = require('../middleware/auth');
const { sendOrderConfirmationEmail } = require('../config/email');

const router = express.Router();

// ============================================
// POST /api/orders - Utwórz nowe zamówienie
// ============================================
router.post('/', authMiddleware, async (req, res) => {
  const transaction = await require('../config/database').transaction();
  
  try {
    console.log('=== CREATE ORDER REQUEST ===');
    console.log('User:', req.user?.id);
    console.log('Body:', JSON.stringify(req.body, null, 2));
    
    const {
      items, // [{ product_id, quantity }]
      shipping_name,
      shipping_email,
      shipping_phone,
      shipping_address,
      shipping_city,
      shipping_postal_code,
      shipping_country = 'Polska',
      notes
    } = req.body;

    // Walidacja
    if (!items || items.length === 0) {
      console.log('ERROR: Empty cart');
      return res.status(400).json({ error: 'Koszyk jest pusty' });
    }

    if (!shipping_name || !shipping_email || !shipping_address || !shipping_city || !shipping_postal_code) {
      console.log('ERROR: Missing shipping info');
      return res.status(400).json({ error: 'Wypełnij wszystkie pola adresu' });
    }

    // Pobierz produkty
    const productIds = items.map(item => item.product_id);
    console.log('Looking for products:', productIds);
    
    const products = await Product.findAll({
      where: { id: productIds, status: 'published' }
    });
    
    console.log('Found products:', products.length);

    if (products.length !== items.length) {
      await transaction.rollback();
      console.log('ERROR: Product count mismatch');
      return res.status(400).json({ error: 'Niektóre produkty są niedostępne' });
    }

    // Sprawdź dostępność
    for (const item of items) {
      const product = products.find(p => p.id === item.product_id);
      if (!product) {
        await transaction.rollback();
        return res.status(400).json({ error: `Produkt ${item.product_id} nie istnieje` });
      }
      if (product.stock_quantity < item.quantity) {
        await transaction.rollback();
        return res.status(400).json({ 
          error: `Produkt "${product.title}" ma tylko ${product.stock_quantity} sztuk w magazynie` 
        });
      }
    }

    // Oblicz total
    let totalAmount = 0;
    const orderItems = items.map(item => {
      const product = products.find(p => p.id === item.product_id);
      const subtotal = parseFloat(product.price) * item.quantity;
      totalAmount += subtotal;

      return {
        product_id: item.product_id,
        seller_id: product.user_id,
        quantity: item.quantity,
        price: product.price,
        subtotal
      };
    });

    // Generuj numer zamówienia
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Utwórz zamówienie
    const order = await Order.create({
      order_number: orderNumber,
      buyer_id: req.user.id,
      shipping_name,
      shipping_email,
      shipping_phone,
      shipping_address,
      shipping_city,
      shipping_postal_code,
      shipping_country,
      total_amount: totalAmount,
      payment_status: 'pending',
      status: 'pending',
      notes
    }, { transaction });

    // Utwórz pozycje zamówienia i zbierz unikalne seller_id
    const sellerIds = new Set();
    
    for (const item of orderItems) {
      await OrderItem.create({
        order_id: order.id,
        ...item
      }, { transaction });

      // Zaktualizuj stan magazynowy
      const product = products.find(p => p.id === item.product_id);
      product.stock_quantity -= item.quantity;
      
      // Jeśli stock = 0, archiwizuj produkt
      if (product.stock_quantity <= 0) {
        product.status = 'archived';
        console.log(`Product ${product.id} archived - out of stock`);
      }
      
      await product.save({ transaction });
      
      // Dodaj seller_id do zbioru
      sellerIds.add(item.seller_id);
    }

    // Utwórz powiadomienia dla sprzedawców
    for (const sellerId of sellerIds) {
      await Notification.create({
        user_id: sellerId,
        type: 'new_order',
        title: 'Nowe zamówienie!',
        message: `Otrzymałeś nowe zamówienie ${orderNumber}`,
        order_id: order.id
      }, { transaction });
    }

    await transaction.commit();

    // Pobierz pełne zamówienie z itemami
    const fullOrder = await Order.findOne({
      where: { id: order.id },
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              include: [
                {
                  model: ProductImage,
                  as: 'images',
                  where: { is_primary: true },
                  required: false,
                  attributes: ['image_url']
                }
              ]
            }
          ]
        }
      ]
    });

    console.log('Order created successfully:', fullOrder.id);

    // Wyślij email z potwierdzeniem zamówienia
    try {
      const emailData = {
        orderNumber,
        shipping_email,
        shipping_name,
        items: orderItems.map(item => {
          const product = products.find(p => p.id === item.product_id);
          return {
            product_name: product.title,
            quantity: item.quantity,
            price: item.price
          };
        }),
        total_amount: totalAmount,
        shipping_address,
        shipping_city,
        shipping_postal_code
      };
      
      await sendOrderConfirmationEmail(emailData);
    } catch (emailError) {
      console.error('Email sending failed, but order was created:', emailError);
      // Nie przerywamy procesu, email jest opcjonalny
    }

    res.status(201).json({ 
      message: 'Zamówienie utworzone pomyślnie',
      order: fullOrder 
    });

  } catch (error) {
    await transaction.rollback();
    console.error('=== CREATE ORDER ERROR ===');
    console.error('Error:', error);
    console.error('Stack:', error.stack);
    res.status(500).json({ error: 'Nie udało się utworzyć zamówienia', details: error.message });
  }
});

// ============================================
// GET /api/orders/my - Moje zamówienia
// ============================================
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { buyer_id: req.user.id },
      include: [
        {
          model: OrderItem,
          as: 'items',
          attributes: ['id', 'product_id', 'seller_id', 'quantity', 'price', 'subtotal'],
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'title', 'slug'],
              include: [
                {
                  model: ProductImage,
                  as: 'images',
                  where: { is_primary: true },
                  required: false,
                  attributes: ['image_url']
                }
              ]
            },
            {
              model: User,
              as: 'seller',
              attributes: ['id', 'username', 'full_name', 'avatar_url']
            }
          ]
        },
        {
          model: Review,
          as: 'reviews',
          required: false
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json({ orders });

  } catch (error) {
    console.error('Get my orders error:', error);
    res.status(500).json({ error: 'Nie udało się pobrać zamówień' });
  }
});

// ============================================
// GET /api/orders/sales/my - Zamówienia do wysyłki (dla sprzedawcy)
// ============================================
router.get('/sales/my', authMiddleware, async (req, res) => {
  try {
    // Znajdź wszystkie OrderItems gdzie seller_id = req.user.id
    const orderItems = await OrderItem.findAll({
      where: { seller_id: req.user.id },
      include: [
        {
          model: Order,
          as: 'order',
          include: [
            {
              model: User,
              as: 'buyer',
              attributes: ['username', 'email']
            }
          ]
        },
        {
          model: Product,
          as: 'product',
          include: [
            {
              model: ProductImage,
              as: 'images',
              where: { is_primary: true },
              required: false,
              attributes: ['image_url']
            }
          ]
        }
      ],
      order: [['created_at', 'DESC']]
    });

    // Grupuj po zamówieniach
    const ordersMap = new Map();
    orderItems.forEach(item => {
      const orderId = item.order.id;
      if (!ordersMap.has(orderId)) {
        ordersMap.set(orderId, {
          ...item.order.toJSON(),
          items: []
        });
      }
      ordersMap.get(orderId).items.push(item);
    });

    const orders = Array.from(ordersMap.values());

    res.json({ orders });

  } catch (error) {
    console.error('Get sales orders error:', error);
    res.status(500).json({ error: 'Nie udało się pobrać zamówień' });
  }
});

// ============================================
// GET /api/orders/:id - Szczegóły zamówienia
// ============================================
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const order = await Order.findOne({
      where: { 
        id: req.params.id,
        buyer_id: req.user.id 
      },
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              include: [
                {
                  model: ProductImage,
                  as: 'images',
                  where: { is_primary: true },
                  required: false,
                  attributes: ['image_url']
                },
                {
                  model: User,
                  as: 'seller',
                  attributes: ['username', 'email']
                }
              ]
            }
          ]
        }
      ]
    });

    if (!order) {
      return res.status(404).json({ error: 'Zamówienie nie znalezione' });
    }

    res.json({ order });

  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Nie udało się pobrać zamówienia' });
  }
});

// ============================================
// PUT /api/orders/:id/ship - Potwierdź wysyłkę (sprzedawca)
// ============================================
router.put('/:id/ship', authMiddleware, async (req, res) => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.id },
      include: [
        {
          model: OrderItem,
          as: 'items',
          where: { seller_id: req.user.id }
        }
      ]
    });

    if (!order) {
      return res.status(404).json({ error: 'Zamówienie nie znalezione' });
    }

    // Zmień status zamówienia
    order.status = 'shipped';
    await order.save();

    // Utwórz powiadomienie dla kupującego
    await Notification.create({
      user_id: order.buyer_id,
      type: 'order_shipped',
      title: 'Zamówienie wysłane!',
      message: `Twoje zamówienie ${order.order_number} zostało wysłane`,
      order_id: order.id
    });

    res.json({ 
      message: 'Zamówienie oznaczone jako wysłane',
      order 
    });

  } catch (error) {
    console.error('Ship order error:', error);
    res.status(500).json({ error: 'Nie udało się zaktualizować zamówienia' });
  }
});

// ============================================
// PUT /api/orders/:id/confirm-delivery - Potwierdź otrzymanie przesyłki
// ============================================
router.put('/:id/confirm-delivery', authMiddleware, async (req, res) => {
  try {
    const order = await Order.findOne({
      where: { 
        id: req.params.id,
        buyer_id: req.user.id,
        status: 'shipped'
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Zamówienie nie znalezione lub nie może być potwierdzone' });
    }

    order.status = 'delivered';
    await order.save();

    // Powiadom sprzedawców
    const orderItems = await OrderItem.findAll({
      where: { order_id: order.id },
      attributes: ['seller_id'],
      group: ['seller_id']
    });

    for (const item of orderItems) {
      await Notification.create({
        user_id: item.seller_id,
        type: 'order_delivered',
        title: 'Przesyłka dostarczona',
        message: `Kupujący potwierdził otrzymanie zamówienia ${order.order_number}`,
        order_id: order.id
      });
    }

    res.json({ 
      message: 'Potwierdzono otrzymanie przesyłki',
      order 
    });

  } catch (error) {
    console.error('Confirm delivery error:', error);
    res.status(500).json({ error: 'Nie udało się potwierdzić dostawy' });
  }
});

// ============================================
// POST /api/orders/:id/review - Dodaj ocenę sprzedawcy
// ============================================
router.post('/:id/review', authMiddleware, async (req, res) => {
  console.log('===== REVIEW ENDPOINT HIT =====');
  console.log('Request params:', req.params);
  console.log('Request body:', req.body);
  console.log('Request user:', req.user ? req.user.id : 'NO USER');
  
  try {
    const { seller_id, rating, comment } = req.body;

    console.log('Review request:', { order_id: req.params.id, seller_id, rating, buyer_id: req.user.id });

    // Walidacja
    if (!seller_id || !rating || rating < 1 || rating > 5) {
      console.log('Validation failed');
      return res.status(400).json({ error: 'Nieprawidłowe dane oceny' });
    }

    // Sprawdź czy zamówienie istnieje i należy do kupującego
    const order = await Order.findOne({
      where: { 
        id: req.params.id,
        buyer_id: req.user.id
      },
      include: [{
        model: OrderItem,
        as: 'items',
        where: { seller_id },
        required: false
      }]
    });

    console.log('Order found:', order ? 'yes' : 'no');
    if (order) {
      console.log('Order status:', order.status);
      console.log('Order items:', order.items?.length);
    }

    if (!order) {
      return res.status(404).json({ error: 'Zamówienie nie znalezione' });
    }

    if (!order.items || order.items.length === 0) {
      return res.status(400).json({ error: 'Nie kupowałeś produktów od tego sprzedawcy w tym zamówieniu' });
    }

    // Sprawdź czy ocena już istnieje
    const existingReview = await Review.findOne({
      where: { 
        order_id: order.id,
        seller_id,
        buyer_id: req.user.id
      }
    });

    if (existingReview) {
      return res.status(400).json({ error: 'Już wystawiłeś ocenę dla tego sprzedawcy' });
    }

    // Utwórz ocenę
    const review = await Review.create({
      order_id: order.id,
      seller_id,
      buyer_id: req.user.id,
      rating,
      comment: comment || null
    });

    console.log('Review created:', review.id);

    // Powiadom sprzedawcę
    await Notification.create({
      user_id: seller_id,
      type: 'new_review',
      title: 'Nowa ocena!',
      message: `Otrzymałeś ocenę ${rating}/5 gwiazdek`,
      order_id: order.id
    });

    res.status(201).json({ 
      message: 'Ocena dodana pomyślnie',
      review 
    });

  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({ error: 'Nie udało się dodać oceny' });
  }
});

// ============================================
// GET /api/orders/my-purchases - Pobierz zakupy użytkownika
// ============================================
router.get('/my-purchases', authMiddleware, async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { buyer_id: req.user.id },
      include: [
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              include: [{ model: ProductImage, limit: 1 }]
            },
            {
              model: User,
              as: 'seller',
              attributes: ['id', 'username', 'avatar_url']
            }
          ]
        }
      ],
      order: [['created_at', 'DESC']]
    });

    // Sprawdź czy zamówienie ma wystawioną opinię
    const ordersWithReviewStatus = await Promise.all(
      orders.map(async (order) => {
        const orderJson = order.toJSON();
        const review = await Review.findOne({
          where: {
            order_id: order.id,
            buyer_id: req.user.id
          }
        });
        orderJson.review_submitted = !!review;
        return orderJson;
      })
    );

    res.json({ orders: ordersWithReviewStatus });
  } catch (error) {
    console.error('Get purchases error:', error);
    res.status(500).json({ error: 'Nie udało się pobrać zakupów' });
  }
});

// ============================================
// GET /api/orders/admin/all - Wszystkie zamówienia (admin/moderator)
// ============================================
router.get('/admin/all', authMiddleware, async (req, res) => {
  try {
    // Sprawdź uprawnienia
    if (req.user.role !== 'admin' && !req.user.can_moderate_products) {
      return res.status(403).json({ error: 'Brak uprawnień' });
    }

    const orders = await Order.findAll({
      include: [
        {
          model: User,
          as: 'buyer',
          attributes: ['id', 'username', 'email', 'full_name']
        },
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'title', 'slug'],
              include: [
                {
                  model: ProductImage,
                  as: 'images',
                  where: { is_primary: true },
                  required: false,
                  attributes: ['image_url']
                }
              ]
            },
            {
              model: User,
              as: 'seller',
              attributes: ['id', 'username', 'full_name']
            }
          ]
        }
      ],
      order: [['created_at', 'DESC']]
    });

    res.json({ orders });

  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({ error: 'Nie udało się pobrać zamówień' });
  }
});

// ============================================
// PUT /api/orders/admin/:id/status - Zmień status zamówienia (admin/moderator)
// ============================================
router.put('/admin/:id/status', authMiddleware, async (req, res) => {
  try {
    // Sprawdź uprawnienia
    if (req.user.role !== 'admin' && !req.user.can_moderate_products) {
      return res.status(403).json({ error: 'Brak uprawnień' });
    }

    const { status, payment_status } = req.body;

    // Walidacja statusów
    const validOrderStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    const validPaymentStatuses = ['pending', 'paid', 'failed', 'refunded'];

    if (status && !validOrderStatuses.includes(status)) {
      return res.status(400).json({ error: 'Nieprawidłowy status zamówienia' });
    }

    if (payment_status && !validPaymentStatuses.includes(payment_status)) {
      return res.status(400).json({ error: 'Nieprawidłowy status płatności' });
    }

    const order = await Order.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'buyer',
          attributes: ['id', 'username', 'email']
        }
      ]
    });

    if (!order) {
      return res.status(404).json({ error: 'Zamówienie nie znalezione' });
    }

    const oldStatus = order.status;
    const oldPaymentStatus = order.payment_status;

    // Zaktualizuj statusy
    if (status) order.status = status;
    if (payment_status) order.payment_status = payment_status;
    
    await order.save();

    // Wyślij powiadomienie kupującemu o zmianie statusu
    if (status && status !== oldStatus) {
      const statusMessages = {
        'pending': 'w trakcie przetwarzania',
        'confirmed': 'zostało potwierdzone',
        'shipped': 'zostało wysłane',
        'delivered': 'zostało dostarczone',
        'cancelled': 'zostało anulowane'
      };

      await Notification.create({
        user_id: order.buyer_id,
        type: 'order_status_changed',
        title: 'Zmiana statusu zamówienia',
        message: `Twoje zamówienie ${order.order_number} ${statusMessages[status]}`,
        order_id: order.id
      });
    }

    res.json({ 
      message: 'Status zamówienia zaktualizowany',
      order 
    });

  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Nie udało się zaktualizować statusu' });
  }
});

module.exports = router;

