const express = require('express');
const router = express.Router();

const {
    signup, 
    login, 
    logout, 
    forgotpassword, 
    passwordReset,
    getLoggedInUserDetails,
    changePassword,
    updateUserDetails,
    adminAllUsers,
    managerAllUsers,
    adminGetOneUser,
    adminUpdateOneUserDetail,
    adminDeleteOneUser
} = require('../controllers/userController');
const {isLoggedIn, customRole} = require('../middlewares/user');

router.route('/signup').post(signup);
router.route('/login').post(login);
router.route('/logout').get(logout);
router.route('/forgotpassword').post(forgotpassword);
router.route('/password/reset/:token').post(passwordReset);
router.route('/userDashboard').get(isLoggedIn, getLoggedInUserDetails);
router.route('/password/update').post(isLoggedIn, changePassword);
router.route('/userDashboard/update').post(isLoggedIn, updateUserDetails);
router.route('/admin/users').get(isLoggedIn, customRole('admin'), adminAllUsers);
router.route('/manager/users').get(isLoggedIn, customRole('manager'), managerAllUsers);
router.route('/admin/user/:id')
    .get(isLoggedIn, customRole('admin'), adminGetOneUser)
    .put(isLoggedIn, customRole('admin'), adminUpdateOneUserDetail)
    .delete(isLoggedIn, customRole('admin'), adminDeleteOneUser);
module.exports = router;