const express = require('express');
const router = express.Router();

const {
    testProduct, 
    addProduct, 
    getAllProducts, 
    adminGetAllProducts, 
    getOneProduct,
    adminUpdateOneProduct,
    adminDeleteOneProduct,
    addReview,
    deleteReview,
    getOnlyReviewForOneProduct
} = require('../controllers/productController');

const { isLoggedIn, customRole } = require('../middlewares/user');

//test route
router.route('/testProduct').get(testProduct);

//user route
router.route('/products').get(getAllProducts);
router.route('/products/:id').get(getOneProduct);
router.route('/review')
    .put(isLoggedIn, addReview)
    .delete(isLoggedIn, deleteReview);
router.route('/reviews').get(getOnlyReviewForOneProduct);

//admin route
router.route('/admin/product/add').post(isLoggedIn, customRole('admin'), addProduct);
router.route('/admin/products').get(isLoggedIn, customRole('admin'), adminGetAllProducts);
router.route('/admin/product/:id')
.put(isLoggedIn, customRole('admin'), adminUpdateOneProduct)
.delete(isLoggedIn, customRole('admin'), adminDeleteOneProduct);

module.exports = router;