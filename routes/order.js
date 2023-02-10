const express = require('express');
const router = express.Router();
const {isLoggedIn, customRole} = require('../middlewares/user');
const { 
    createOrder, 
    getOneOrder, 
    getLoggedInOrder, 
    adminGetAllOrders, 
    adminUpdateOrder,
    adminDeleteOrder 
} = require('../controllers/orderController');

router.route('/order/create').post(isLoggedIn, createOrder);
router.route('/order/myorders').get(isLoggedIn, getLoggedInOrder);
router.route('/order/:id').get(isLoggedIn, getOneOrder);

router.route('/admin/orders').get(isLoggedIn, customRole("admin"), adminGetAllOrders);
router.route('/admin/order/:id')
    .put(isLoggedIn, customRole("admin"), adminUpdateOrder)
    .delete(isLoggedIn, customRole("admin"), adminDeleteOrder);

module.exports = router;