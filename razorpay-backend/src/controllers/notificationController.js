const twilio = require('twilio');

// Initialize Twilio Client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;          // For SMS
const adminPhone = process.env.ADMIN_PHONE_NUMBER;
const whatsappAdminPhone = process.env.ADMIN_WHATSAPP_NUMBER || adminPhone;

// WhatsApp MUST use the Twilio Sandbox number unless you have WhatsApp Business API approved.
// Sandbox: whatsapp:+14155238886
// If you have an approved number set TWILIO_WHATSAPP_FROM in env, otherwise sandbox is used.
const whatsappFrom = process.env.TWILIO_WHATSAPP_FROM
  ? `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`
  : 'whatsapp:+14155238886';  // Twilio Sandbox number

let client;
if (accountSid && authToken) {
    try {
        client = twilio(accountSid, authToken);
        console.log('[Notification] Twilio client initialized successfully.');
    } catch (e) {
        console.error('[Notification] Twilio initialization error:', e.message);
    }
} else {
    console.warn('[Notification] Twilio credentials missing: SID:', !!accountSid, 'Token:', !!authToken);
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
🧾 *NEW ORDER RECEIPT*
---------------------------------
🆔 *Order ID:* #${id.slice(0, 8).toUpperCase()}
⏰ *Time:* ${new Date(createdAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
---------------------------------

👤 *CUSTOMER DETAILS:*
• *Name:* ${customerName}
• *Phone:* ${customerPhone}

📍 *DELIVERY LOCATION:*
• *Address:* ${address}
• *Landmark:* ${landmark || 'Not specified'}

🛒 *ORDERED ITEMS:*
${items.map((item, index) => `• ${item.name} (${item.quantity}x) - ₹${item.price}`).join('\n')}

💰 *FINANCIAL SUMMARY:*
• *Subtotal:* ₹${total}
• *Delivery Fee:* FREE
• *TOTAL AMOUNT:* ₹${total}

💳 *PAYMENT METHOD:*
• ${paymentType === 'cod' ? 'Cash on Delivery' : 'Online Payment'}

${latitude && longitude && latitude !== 0 ? `🗺️ *NAVIGATE:*
https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}` : ''}
---------------------------------
`.trim();

    // 1. SEND SMS (Wrapped in try-catch)
    let smsResponse = null;
    try {
      smsResponse = await client.messages.create({
        body: message,
        from: twilioPhone,
        to: adminPhone
      });
      console.log(`[Notification] SMS sent: ${smsResponse.sid}`);
    } catch (err) {
      console.error('[Notification] SMS Failed:', err.message);
    }

    // 2. SEND WHATSAPP (Wrapped in try-catch)
    let whatsappResponse = null;
    let customerWhatsappResponse = null;
    if (process.env.ENABLE_WHATSAPP === 'true') {
        // Send to Admin
        if (whatsappAdminPhone) {
            try {
                let adminRaw = whatsappAdminPhone ? whatsappAdminPhone.toString() : '';
                let adminFormatted = adminRaw.replace(/\D/g, '');
                
                if (adminFormatted.length === 10) {
                    adminFormatted = `+91${adminFormatted}`;
                } else if (adminRaw && !adminRaw.startsWith('+')) {
                    adminFormatted = `+${adminFormatted}`;
                } else {
                    adminFormatted = adminRaw;
                }

                if (adminFormatted) {
                  const toAdmin = `whatsapp:${adminFormatted}`;
                  console.log(`[Twilio] ATTEMPTING ADMIN WHATSAPP -> To: ${toAdmin}, From: ${whatsappFrom}`);

                  whatsappResponse = await client.messages.create({
                      body: message,
                      from: whatsappFrom,
                      to: toAdmin
                  });
                  console.log(`[Twilio] SUCCESS! Admin WhatsApp SID: ${whatsappResponse.sid}`);
                }
            } catch (err) {
                console.error('[Twilio] ERROR sending to admin:', err.message);
            }
        }

        // Send to Customer
        if (customerPhone && customerPhone !== 'N/A') {
            try {
                let rawPhone = customerPhone.toString();
                let formattedCustomerPhone = rawPhone.replace(/\D/g, '');
                
                if (formattedCustomerPhone.length === 10) {
                    formattedCustomerPhone = `+91${formattedCustomerPhone}`;
                } else if (!rawPhone.startsWith('+')) {
                    formattedCustomerPhone = `+${formattedCustomerPhone}`;
                } else {
                    formattedCustomerPhone = rawPhone;
                }

                const toCustomer = `whatsapp:${formattedCustomerPhone}`;
                const customerMessage = `Hi ${customerName},\n\nYour order #${id.slice(0, 6).toUpperCase()} has been received and is being processed!\n\nTotal: ₹${total}\nPayment: ${paymentType === 'cod' ? 'Cash on Delivery' : 'Online Payment'}\n\nThank you for choosing Juicy App! 🧃`;

                customerWhatsappResponse = await client.messages.create({
                    body: customerMessage,
                    from: whatsappFrom,
                    to: toCustomer
                });
                console.log(`[Twilio] SUCCESS! Customer WhatsApp SID: ${customerWhatsappResponse.sid}`);
            } catch (err) {
                console.error('[Twilio] ERROR sending to customer:', err.message);
            }
        }
    }

    res.status(200).json({ 
        success: true, 
        message: 'Notification processing complete',
        smsSent: !!smsResponse,
        whatsappSent: !!whatsappResponse,
        customerWhatsappSent: !!customerWhatsappResponse
    });

  } catch (error) {
    console.error('[Notification] Global Error:', error);
    res.status(500).json({ 
        success: false, 
        message: 'Internal server error during notification', 
        error: error.message 
    });
  }
};
