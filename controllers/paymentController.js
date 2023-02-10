const BigPromise = require('../middlewares/bigPromise');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.sendStripeKey = BigPromise(async (req, res, next) => {
    res.status(200).json({
        stripeKey: process.env.STRIPE_API_KEY
    });
}); 

exports.captureStripePayment = BigPromise(async (req, res, next) => {
    const paymentIntent = await stripe.paymentIntents.create({
        amount: req.body.amount,
        currency: 'inr',
        metadata: {integration_check: 'accept_a_payment'}
    });
    res.status(200).json({
        success: true,
        amount: req.body.amount,
        client_secret: paymentIntent.client_secret,
    });
}); 

exports.sendRazorpayKey = BigPromise(async (req, res, next) => {
    res.status(200).json({
        stripeKey: process.env.RAZORPAY_API_KEY
    });
}); 

exports.captureRazorpayPayment = BigPromise(async (req, res, next) => {
    var instance = new Razorpay({ key_id: process.env.RAZORPAY_API_KEY, key_secret: RAZORPAY_SECRET_KEY });

    var options = {
        amount: req.body.amount,
        currency: 'INR',
        receipt: 'order_rcptid_11'
    };
    const myorder = await instance.orders.create(options);

    res.status(200).json({
        success: true,
        amount: req.body.amount,
        order: myorder
    }); 
}); 