const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { validate } = require('../middleware/validate.middleware');
const { productSchema, productQuerySchema } = require('../validators/product.validator');
const {
  getProducts, getProductBySlug, getProductById, getFeaturedProducts, getBestSellers,
  getNewArrivals, getOnSale, getCategories,
  createProduct, updateProduct, deleteProduct, updateStock,
  getProductReviews, addReview
} = require('../controllers/product.controller');

router.get('/featured', getFeaturedProducts);
router.get('/best-sellers', getBestSellers);
router.get('/new-arrivals', getNewArrivals);
router.get('/on-sale', getOnSale);
router.get('/categories', getCategories);
router.get('/slug/:slug', getProductBySlug);
router.get('/', validate(productQuerySchema), getProducts);
router.get('/:id', getProductById);

router.get('/:id/reviews', getProductReviews);
router.post('/:id/reviews', authenticate, addReview);

router.post('/', authenticate, authorize('admin'), validate(productSchema), createProduct);
router.patch('/:id', authenticate, authorize('admin'), updateProduct);
router.delete('/:id', authenticate, authorize('admin'), deleteProduct);
router.patch('/:id/stock', authenticate, authorize('admin'), updateStock);

module.exports = router;