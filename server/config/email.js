const nodemailer = require('nodemailer');

// Konfiguracja transportera email
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Funkcja do wysyłania emaila o zamówieniu
const sendOrderConfirmationEmail = async (orderData) => {
  const {
    orderNumber,
    shipping_email,
    shipping_name,
    items,
    total_amount,
    shipping_address,
    shipping_city,
    shipping_postal_code
  } = orderData;

  // Tworzenie listy produktów
  const itemsList = items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">
        ${item.product_name}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">
        ${item.quantity}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
        ${item.price} zł
      </td>
    </tr>
  `).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #8b6f47; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
        .order-details { background-color: white; padding: 20px; margin: 20px 0; border-radius: 5px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .total { font-size: 1.2em; font-weight: bold; text-align: right; padding-top: 15px; border-top: 2px solid #8b6f47; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 0.9em; }
        .status-badge { display: inline-block; background-color: #fbbf24; color: #92400e; padding: 5px 15px; border-radius: 15px; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Dziękujemy za zamówienie!</h1>
        </div>
        <div class="content">
          <p>Witaj ${shipping_name},</p>
          <p>Otrzymaliśmy Twoje zamówienie <strong>${orderNumber}</strong> i obecnie oczekuje ono na płatność.</p>
          
          <div class="order-details">
            <h2 style="color: #8b6f47; margin-top: 0;">Szczegóły zamówienia</h2>
            <p><strong>Status:</strong> <span class="status-badge">Oczekuje na płatność</span></p>
            
            <h3>Zamówione produkty:</h3>
            <table>
              <thead>
                <tr style="background-color: #f3f4f6;">
                  <th style="padding: 10px; text-align: left;">Produkt</th>
                  <th style="padding: 10px; text-align: center;">Ilość</th>
                  <th style="padding: 10px; text-align: right;">Cena</th>
                </tr>
              </thead>
              <tbody>
                ${itemsList}
              </tbody>
            </table>
            <div class="total">
              Łącznie: ${total_amount} zł
            </div>
          </div>

          <div class="order-details">
            <h3 style="color: #8b6f47;">Adres dostawy:</h3>
            <p>
              ${shipping_name}<br>
              ${shipping_address}<br>
              ${shipping_postal_code} ${shipping_city}
            </p>
          </div>

          <p><strong>Co dalej?</strong></p>
          <ul>
            <li>Oczekujemy na potwierdzenie płatności</li>
            <li>Po otrzymaniu płatności sprzedawca przygotuje Twoje zamówienie</li>
            <li>Otrzymasz powiadomienie o wysyłce</li>
          </ul>

          <p>Jeśli masz jakiekolwiek pytania, skontaktuj się ze sprzedawcą lub z nami.</p>
        </div>
        <div class="footer">
          <p>Pozdrawiamy,<br><strong>Zespół MadeByU</strong></p>
          <p style="font-size: 0.8em; color: #999;">
            To jest automatyczna wiadomość, prosimy na nią nie odpowiadać.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"MadeByU" <${process.env.EMAIL_USER}>`,
    to: shipping_email,
    subject: `Potwierdzenie zamówienia ${orderNumber} - MadeByU`,
    html: htmlContent
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✓ Email wysłany do: ${shipping_email}`);
    return { success: true };
  } catch (error) {
    console.error('✗ Błąd wysyłania emaila:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  transporter,
  sendOrderConfirmationEmail
};
