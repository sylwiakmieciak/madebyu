// ============================================
// ORDER ROUTES - Zamówienia
// ============================================
const express = require('express');
const { Order, OrderItem, Product, User, ProductImage, Notification } = require('../models');
const { authMiddleware } = require('../middleware/auth');

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
            }
          ]
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

module.exports = router;
