const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const {
  getShops, getShopBySlug, getShopProducts, getShopServices, getShopReviews, createShop, updateShop
} = require('../controllers/shop.controller');

router.get('/', getShops);
router.get('/slug/:slug', getShopBySlug);
router.get('/slug/:slug/products', getShopProducts);
router.get('/slug/:slug/services', getShopServices);
router.get('/slug/:slug/reviews', getShopReviews);

router.post('/', authenticate, authorize('admin'), createShop);
router.patch('/:id', authenticate, updateShop);

module.exports = router;