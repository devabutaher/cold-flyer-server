const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { uploadSingle } = require('../middleware/upload.middleware');
const {
  getProducts, getProductBySlug, getFeaturedProducts, getBestSellers,
  getNewArrivals, getOnSale, getCategories,
  createProduct, updateProduct, deleteProduct, updateStock,
  getProductReviews, addReview
} = require('../controllers/product.controller');

router.get('/', getProducts);
router.get('/slug/:slug', getProductBySlug);
router.get('/featured', getFeaturedProducts);
router.get('/best-sellers', getBestSellers);
router.get('/new-arrivals', getNewArrivals);
router.get('/on-sale', getOnSale);
router.get('/categories', getCategories);

router.get('/:id/reviews', getProductReviews);
router.post('/:id/reviews', authenticate, addReview);

router.post('/', authenticate, authorize('manager', 'admin'), createProduct);
router.patch('/:id', authenticate, authorize('manager', 'admin'), updateProduct);
router.delete('/:id', authenticate, authorize('manager', 'admin'), deleteProduct);
router.patch('/:id/stock', authenticate, authorize('manager', 'admin'), updateStock);

module.exports = router;