const razorpay = require('../utils/razorpay');
const crypto = require('crypto');

/**
 * @desc Create a new Razorpay order
 * @route POST /api/payment/create-order
 */
exports.createOrder = async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt } = req.body;

    // Strict Validation
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required (positive number)',
      });
    }

    const options = {
      amount: Math.round(amount * 100), // convert to paise
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
      payment_capture: 1 // Auto capture
    };

    const order = await razorpay.orders.create(options);

    if (!order) {
      throw new Error('Razorpay order creation returned null');
    }

    // SECURITY: Return the order details and the Key ID to ensure frontend sync
    // NEVER return the Secret Key
    res.status(201).json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: process.env.RAZORPAY_KEY_ID // Ensure frontend uses the same key as backend
    });
  } catch (error) {
    console.error('[RAZORPAY] Create Order Failed:', {
      message: error.message,
      statusCode: error.statusCode,
      metadata: error.error || error.metadata,
      amount: req.body.amount
    });
    res.status(500).json({
      success: false,
      message: 'Payment Initialization Failed',
      // Always expose error for debugging — remove once resolved
      error: error.message,
      code: error.statusCode || error.error?.code
    });
  }
};

/**
 * @desc Verify the Razorpay payment signature
 * @route POST /api/payment/verify-payment
 */
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing required payment verification parameters',
      });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    const generated_signature = crypto
      .createHmac('sha256', secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest('hex');

    if (generated_signature === razorpay_signature) {
      console.log(`[RAZORPAY] Payment Verified: ${razorpay_payment_id} for Order: ${razorpay_order_id}`);
      res.status(200).json({
        success: true,
        message: 'Payment verified successfully',
      });
    } else {
      console.warn(`[RAZORPAY] Invalid Signature: ${razorpay_order_id}`);
      res.status(400).json({
        success: false,
        message: 'Invalid payment signature. Potential tampering detected.',
      });
    }
  } catch (error) {
    console.error('[RAZORPAY] Verification Error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed',
    });
  }
};

/**
 * @desc Render the Razorpay Checkout HTML page for WebView
 * @route GET /api/payment/checkout/:orderId
 */
exports.renderCheckout = (req, res) => {
  const { orderId } = req.params;
  const { amount, name, email, contact, key } = req.query;

  const razorpayKeyId = key || process.env.RAZORPAY_KEY_ID;

  if (!razorpayKeyId) {
    return res.status(500).send('Razorpay configuration missing');
  }

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <title>Secure Checkout</title>
        <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
        <style>
          body { margin: 0; padding: 0; display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
          .loader { border: 3px solid #f3f3f3; border-top: 3px solid #3A8C3F; border-radius: 50%; width: 30px; height: 30px; animation: spin 1s linear infinite; }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          .text { color: #1e293b; margin-top: 20px; font-size: 14px; font-weight: 500; }
        </style>
      </head>
      <body>
        <div class="loader"></div>
        <div class="text">Securely connecting to Razorpay...</div>
        
        <script>
          const options = {
            "key": "${razorpayKeyId}",
            "amount": "${amount}",
            "currency": "INR",
            "name": "${name || 'JuicyApp'}",
            "description": "Premium Juice Order",
            "order_id": "${orderId}",
            "prefill": {
              "name": "${name || ''}",
              "email": "${email || ''}",
              "contact": "${contact || ''}"
            },
            "theme": { "color": "#3A8C3F" },
            "modal": {
              "ondismiss": function() {
                sendToApp({ status: 'cancelled' });
              },
              "escape": false,
              "backdropclose": false
            },
            "retry": { "enabled": true, "max_count": 3 }
          };
          
          function sendToApp(payload) {
            const message = JSON.stringify(payload);
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(message);
            }
            if (window.parent && window.parent !== window) {
              window.parent.postMessage(message, "*");
            }
          }

          try {
            const rzp = new Razorpay(options);
            
            rzp.on('payment.failed', function (response){
              sendToApp({ status: 'failure', message: response.error.description, data: response.error });
            });

            // Handle successful payment
            options.handler = function(response) {
              sendToApp({ status: 'success', data: response });
            };

            // Auto-open
            window.onload = function() {
              rzp.open();
            };
          } catch(e) {
            sendToApp({ status: 'failure', message: 'Razorpay SDK load failed' });
          }
        </script>
      </body>
    </html>
  `;
  res.send(html);
};
