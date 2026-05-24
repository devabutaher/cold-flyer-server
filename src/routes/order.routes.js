const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { validate } = require('../middleware/validate.middleware');
const { createOrderSchema, orderQuerySchema } = require('../validators/order.validator');
const { createOrder, getOrders, getOrderById, updateOrder, updateOrderStatus, cancelOrder, confirmOrder } = require('../controllers/order.controller');
const { updateOrderCoupon } = require('../controllers/order-coupon.controller');
const { createCheckoutSession, verifyPayment } = require('../controllers/checkout.controller');

// All order routes require authentication
router.post('/', authenticate, validate(createOrderSchema), createOrder);
router.get('/', authenticate, validate(orderQuerySchema), getOrders);
router.get('/:id', authenticate, getOrderById);
router.post('/:id/checkout', authenticate, createCheckoutSession);
router.post('/:id/verify-payment', authenticate, verifyPayment);
router.patch('/:id', authenticate, updateOrder);

router.patch('/:id/status', authenticate, authorize('admin'), updateOrderStatus);
router.patch('/:id/confirm', authenticate, confirmOrder);
router.patch('/:id/cancel', authenticate, cancelOrder);
router.patch('/:id/coupon', authenticate, updateOrderCoupon);

module.exports = router;