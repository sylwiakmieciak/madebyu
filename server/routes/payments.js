// ============================================
// PAYMENT ROUTES - Płatności Stripe
// ============================================
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { authMiddleware } = require('../middleware/auth');
const { Order, OrderItem, Product, User } = require('../models');
const nodemailer = require('nodemailer');

const router = express.Router();

// Konfiguracja emaila
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// ============================================
// POST /api/payments/create-checkout-session
// Tworzy sesję płatności Stripe
// ============================================
router.post('/create-checkout-session', authMiddleware, async (req, res) => {
  try {
    const { order_id } = req.body;

    if (!order_id) {
      return res.status(400).json({ error: 'Brak ID zamówienia' });
    }

    // Pobierz zamówienie z produktami
    const order = await Order.findOne({
      where: { 
        id: order_id,
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
              attributes: ['id', 'title', 'price']
            }
          ]
        }
      ]
    });

    if (!order) {
      return res.status(404).json({ error: 'Zamówienie nie znalezione' });
    }

    if (order.payment_status === 'paid') {
      return res.status(400).json({ error: 'Zamówienie już opłacone' });
    }

    // Przygotuj produkty dla Stripe
    const lineItems = order.items.map(item => ({
      price_data: {
        currency: 'pln',
        product_data: {
          name: item.product.title,
          description: `Ilość: ${item.quantity}`
        },
        unit_amount: Math.round(parseFloat(item.price) * 100) // Stripe używa groszy
      },
      quantity: item.quantity
    }));

    // Utwórz sesję Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.APP_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL}/checkout?cancelled=true`,
      customer_email: order.shipping_email,
      metadata: {
        order_id: order.id.toString(),
        order_number: order.order_number
      }
    });

    // Zapisz ID sesji w zamówieniu
    await order.update({
      stripe_session_id: session.id
    });

    res.json({ 
      sessionId: session.id,
      url: session.url
    });

  } catch (error) {
    console.error('Create checkout session error:', error);
    res.status(500).json({ error: 'Błąd tworzenia sesji płatności' });
  }
});

// ============================================
// POST /api/payments/webhook
// Webhook Stripe - OPCJONALNY (tylko dla produkcji)
// ============================================
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  // Webhook działa tylko jeśli jest skonfigurowany STRIPE_WEBHOOK_SECRET
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(200).json({ received: true, message: 'Webhook disabled in dev mode' });
  }

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Obsługa różnych typów zdarzeń
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      await handleCheckoutSessionCompleted(session);
      break;

    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('PaymentIntent succeeded:', paymentIntent.id);
      break;

    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      await handlePaymentFailed(failedPayment);
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

// ============================================
// Pomocnicze funkcje
// ============================================

// Obsługa udanej płatności
async function handleCheckoutSessionCompleted(session) {
  try {
    const orderId = session.metadata.order_id;

    const order = await Order.findByPk(orderId, {
      include: [
        {
          model: User,
          as: 'buyer',
          attributes: ['email', 'username']
        },
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['title', 'price']
            }
          ]
        }
      ]
    });

    if (!order) {
      console.error('Order not found:', orderId);
      return;
    }

    // Aktualizuj status zamówienia
    await order.update({
      payment_status: 'paid',
      status: 'confirmed',
      stripe_payment_intent_id: session.payment_intent
    });

    // Wyślij email o płatności
    await sendPaymentConfirmationEmail(order);

  } catch (error) {
    console.error('Handle checkout session completed error:', error);
  }
}

// Obsługa nieudanej płatności
async function handlePaymentFailed(paymentIntent) {
  try {
    const order = await Order.findOne({
      where: { stripe_payment_intent_id: paymentIntent.id }
    });

    if (order) {
      await order.update({
        payment_status: 'failed'
      });
    }
  } catch (error) {
    console.error('Handle payment failed error:', error);
  }
}

// Wysłanie emaila o potwierdzeniu płatności
async function sendPaymentConfirmationEmail(order) {
  try {
    const itemsList = order.items.map(item => 
      `<li>${item.product.title} - ${item.quantity} szt. × ${item.price} zł = ${(item.quantity * parseFloat(item.price)).toFixed(2)} zł</li>`
    ).join('');

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: order.shipping_email,
      subject: `✅ Płatność potwierdzona - Zamówienie ${order.order_number}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4CAF50;">Płatność potwierdzona!</h2>
          
          <p>Twoja płatność została pomyślnie przetworzona.</p>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3>Szczegóły zamówienia</h3>
            <p><strong>Numer zamówienia:</strong> ${order.order_number}</p>
            <p><strong>Status płatności:</strong> <span style="color: #4CAF50;">Opłacone</span></p>
            <p><strong>Status zamówienia:</strong> Potwierdzone</p>
          </div>
          
          <h3>Produkty:</h3>
          <ul style="list-style: none; padding: 0;">
            ${itemsList}
          </ul>
          
          <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Kwota: ${order.total_amount} zł</h3>
          </div>
          
          <h3>Adres dostawy:</h3>
          <p>
            ${order.shipping_name}<br>
            ${order.shipping_address}<br>
            ${order.shipping_postal_code} ${order.shipping_city}<br>
            ${order.shipping_country}
          </p>
          
          <p style="color: #666; margin-top: 30px;">
            Możesz śledzić status swojego zamówienia w panelu użytkownika.
          </p>
          
          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            To jest automatyczna wiadomość. Prosimy nie odpowiadać na ten email.
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Payment confirmation email sent to:', order.shipping_email);

  } catch (error) {
    console.error('Send payment confirmation email error:', error);
  }
}

// ============================================
// GET /api/payments/verify-session/:sessionId
// Weryfikuje status sesji płatności
// ============================================
router.get('/verify-session/:sessionId', authMiddleware, async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.sessionId);
    
    if (session.payment_status === 'paid') {
      // Znajdź zamówienie
      const order = await Order.findOne({
        where: { stripe_session_id: session.id },
        include: [
          {
            model: User,
            as: 'buyer',
            attributes: ['email', 'username']
          },
          {
            model: OrderItem,
            as: 'items',
            include: [
              {
                model: Product,
                as: 'product',
                attributes: ['title', 'price']
              }
            ]
          }
        ]
      });

      if (order && order.payment_status !== 'paid') {
        // Aktualizuj status zamówienia
        await order.update({
          payment_status: 'paid',
          status: 'confirmed',
          stripe_payment_intent_id: session.payment_intent
        });

        // Wyślij email o płatności
        await sendPaymentConfirmationEmail(order);
      }

      res.json({
        success: true,
        order: order ? {
          id: order.id,
          order_number: order.order_number,
          status: order.status,
          payment_status: order.payment_status,
          total_amount: order.total_amount
        } : null
      });
    } else {
      res.json({
        success: false,
        status: session.payment_status
      });
    }
  } catch (error) {
    console.error('Verify session error:', error);
    res.status(500).json({ error: 'Błąd weryfikacji płatności' });
  }
});

module.exports = router;
