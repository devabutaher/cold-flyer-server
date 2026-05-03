const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const {
  getDashboard, getAnalytics, getAllUsers, updateUserRole,
  getAllProducts, getAllOrders, getAllServices, getAllReviews,
  createCoupon, getCoupons, updateCoupon, deleteCoupon,
  getTechnicians
} = require('../controllers/admin.controller');

router.use(authenticate);
router.use(authorize('admin'));

router.get('/dashboard', getDashboard);
router.get('/analytics', getAnalytics);

router.get('/users', getAllUsers);
router.patch('/users/:id', updateUserRole);

router.get('/products', getAllProducts);
router.get('/orders', getAllOrders);
router.get('/services', getAllServices);
router.get('/reviews', getAllReviews);

router.post('/coupons', createCoupon);
router.get('/coupons', getCoupons);
router.patch('/coupons/:id', updateCoupon);
router.delete('/coupons/:id', deleteCoupon);

router.get('/technicians', getTechnicians);

module.exports = router;