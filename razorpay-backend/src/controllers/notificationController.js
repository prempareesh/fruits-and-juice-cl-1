const twilio = require('twilio');

// Initialize Twilio Client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;
const adminPhone = process.env.ADMIN_PHONE_NUMBER;
const whatsappAdminPhone = process.env.ADMIN_WHATSAPP_NUMBER || adminPhone;

let client;
if (accountSid && authToken) {
    client = twilio(accountSid, authToken);
}

exports.sendOrderNotification = async (req, res) => {
  const { orderData } = req.body;

  if (!orderData) {
    return res.status(400).json({ success: false, message: 'Order data missing' });
  }

  if (!client) {
    console.error('[Notification] Twilio client not initialized. Check env vars.');
    return res.status(500).json({ success: false, message: 'Twilio configuration missing on server' });
  }

  try {
    const { 
      id, 
      customerName, 
      customerPhone, 
      address, 
      landmark,
      latitude,
      longitude,
      items, 
      total, 
      paymentType,
      createdAt 
    } = orderData;

    // Build the exact message format requested by the user
    const message = `
=================================
🧃 NEW JUICE ORDER RECEIVED
=================================

Order ID: #${id.slice(0, 6).toUpperCase()}

Customer:
${customerName}

Phone:
${customerPhone}

Delivery Address:
${address}

Landmark:
${landmark || 'N/A'}

${latitude && longitude && latitude !== 0 ? `📍 Google Maps (Click to Navigate):
https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}` : '📍 Coordinates not available (Follow address above)'}

Ordered Items:
------------------------
${items.map((item, index) => `${index + 1}. ${item.name} x${item.quantity} — ₹${item.price}`).join('\n')}

Subtotal: ₹${total - 40}
Delivery Fee: ₹40
Total: ₹${total}

Payment Method:
${paymentType === 'cod' ? 'Cash on Delivery' : 'Online Payment'}

Order Time:
${new Date(createdAt).toLocaleString()}

=================================
`.trim();

    // Send SMS
    const smsResponse = await client.messages.create({
      body: message,
      from: twilioPhone,
      to: adminPhone
    });

    console.log(`[Notification] SMS sent: ${smsResponse.sid}`);

    // Send WhatsApp (if configured)
    let whatsappResponse = null;
    let customerWhatsappResponse = null;
    if (process.env.ENABLE_WHATSAPP === 'true') {
        whatsappResponse = await client.messages.create({
            body: message,
            from: `whatsapp:${twilioPhone}`,
            to: `whatsapp:${whatsappAdminPhone}`
        });
        console.log(`[Notification] Admin WhatsApp sent: ${whatsappResponse.sid}`);

        // Send to Customer
        if (customerPhone && customerPhone !== 'N/A') {
            try {
                let formattedCustomerPhone = customerPhone.replace(/\D/g, '');
                if (formattedCustomerPhone.length === 10) {
                    formattedCustomerPhone = `+91${formattedCustomerPhone}`;
                } else if (!customerPhone.startsWith('+')) {
                    formattedCustomerPhone = `+${formattedCustomerPhone}`;
                } else {
                    formattedCustomerPhone = customerPhone;
                }

                const customerMessage = `Hi ${customerName},\n\nYour order #${id.slice(0, 6).toUpperCase()} has been received and is being processed!\n\nTotal: ₹${total}\nPayment: ${paymentType === 'cod' ? 'Cash on Delivery' : 'Online Payment'}\n\nThank you for choosing Juicy App! 🧃`;

                customerWhatsappResponse = await client.messages.create({
                    body: customerMessage,
                    from: `whatsapp:${twilioPhone}`,
                    to: `whatsapp:${formattedCustomerPhone}`
                });
                console.log(`[Notification] Customer WhatsApp sent: ${customerWhatsappResponse.sid}`);
            } catch (err) {
                console.error('[Notification] Failed to send Customer WhatsApp:', err.message);
            }
        }
    }

    res.status(200).json({ 
        success: true, 
        message: 'Notifications sent successfully',
        smsSid: smsResponse.sid,
        whatsappSid: whatsappResponse ? whatsappResponse.sid : null
    });

  } catch (error) {
    console.error('[Notification] Twilio Error:', error);
    res.status(500).json({ 
        success: false, 
        message: 'Failed to send notification', 
        error: error.message 
    });
  }
};
