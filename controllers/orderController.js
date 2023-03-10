const Product = require('../models/product');
const Order = require('../models/order');
const BigPromise = require('../middlewares/bigPromise');
const CustomError = require('../utils/customErrors');

exports.createOrder = BigPromise(async (req, res, next) => {
    const {
        shippingInfo,
        orderItems,
        paymentInfo,
        taxAmount,
        shippingAmount,
        totalAmount,
    } = req.body;

    const order = await Order.create({
        shippingInfo,
        orderItems,
        paymentInfo,
        taxAmount,
        shippingAmount,
        totalAmount,
        user: req.user._id
    });

    res.status(200).json({
        success: true,
        order,
    });
});

exports.getOneOrder = BigPromise(async (req, res, next) => {
    const order = await Order.findById(req.params.id).populate('user','name email role');

    if(!order){
        return next(new  CustomError('order not found!', 401));
    }

    res.status(200).json({
        success: true,
        order,
    });
});

exports.getLoggedInOrder = BigPromise(async (req, res, next) => {
    const order = await Order.find({ user: req.user._id});

    if(!order){
        return next(new  CustomError('order not found!', 401));
    }

    res.status(200).json({
        success: true,
        order,
    });
});

exports.adminGetAllOrders = BigPromise(async (req, res, next) => {
    const orders = await Order.find({});

    res.status(200).json({
        success: true,
        orders,
    });
});

exports.adminUpdateOrder = BigPromise(async (req, res, next) => {
    const order = await Order.findById(req.params.id);

    if(!order){
        return next(new  CustomError('order not found!', 401));
    }

    if(order.orderStatus === "Delivered"){
        return next(new  CustomError('order is marked as delivered! Can\'t modify.', 401));
    }

    order.orderStatus = req.body.orderStatus;

    order.orderItems.forEach(async prod => {
        await updateProductStock(prod.product, prod.quantity);
    });

    await order.save();

    res.status(200).json({
        success: true,
        order,
    });
});

exports.adminDeleteOrder = BigPromise(async (req, res, next) => {
    const order = await Order.findById(req.params.id);

    if(!order){
        return next(new  CustomError('order not found!', 401));
    }

    await order.remove();

    res.status(200).json({
        success: true,
        message: "order deleted successfully."
    });
});

async function updateProductStock(productId, quantity){
    const product = await Product.findById(productId);
    product.stock = product.stock - quantity;

    await product.save({ validateBeforeSave: false });
}