const express = require('express');
const router = express.Router();
const {isLoggedIn} = require('../middlewares/user');

const {
    sendRazorpayKey, sendStripeKey, captureStripePayment, captureRazorpayPayment, 
} = require('../controllers/paymentController');

router.route('/stripekey').get(sendStripeKey);
router.route('/razorpaykey').get(sendRazorpayKey);

router.route('/capturerazorpay').get(isLoggedIn, captureRazorpayPayment);
router.route('/capturestrip').get(isLoggedIn, captureStripePayment);

module.exports = router;