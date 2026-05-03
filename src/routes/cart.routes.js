const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { getCart, addItem, updateItem, removeItem, clearCart, applyCoupon, removeCoupon } = require('../controllers/cart.controller');

router.get('/', authenticate, getCart);
router.post('/items', authenticate, addItem);
router.patch('/items/:id', authenticate, updateItem);
router.delete('/items/:id', authenticate, removeItem);
router.delete('/', authenticate, clearCart);
router.patch('/apply-coupon', authenticate, applyCoupon);
router.delete('/remove-coupon', authenticate, removeCoupon);

module.exports = router;