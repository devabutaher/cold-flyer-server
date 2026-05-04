const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { createOrder, getOrders, getOrderById, updateOrderStatus, cancelOrder, confirmOrder } = require('../controllers/order.controller');
const { createCheckoutSession, verifyPayment } = require('../controllers/checkout.controller');

router.post('/', authenticate, createOrder);
router.get('/', authenticate, getOrders);
router.get('/:id', authenticate, getOrderById);
router.post('/:id/checkout', authenticate, createCheckoutSession);
router.post('/:id/verify-payment', authenticate, verifyPayment);

router.patch('/:id/status', authenticate, updateOrderStatus);
router.patch('/:id/confirm', authenticate, confirmOrder);
router.patch('/:id/cancel', authenticate, cancelOrder);

module.exports = router;