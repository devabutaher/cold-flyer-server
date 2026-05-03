const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { createOrder, getOrders, getOrderById, updateOrderStatus, cancelOrder, confirmOrder } = require('../controllers/order.controller');

router.post('/', authenticate, createOrder);
router.get('/', authenticate, getOrders);
router.get('/:id', authenticate, getOrderById);

router.patch('/:id/status', authenticate, authorize('manager', 'admin'), updateOrderStatus);
router.patch('/:id/confirm', authenticate, authorize('manager', 'admin'), confirmOrder);
router.patch('/:id/cancel', authenticate, cancelOrder);

module.exports = router;