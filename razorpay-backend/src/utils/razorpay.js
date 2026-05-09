const Razorpay = require('razorpay');
require('dotenv').config();

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.error('⚠️  WARNING: RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is missing.');
  console.error('   Set these in the Render dashboard → Environment Variables.');
  // Do NOT process.exit(1) — that kills the whole server on Render
}

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

module.exports = razorpayInstance;
