const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { initPayment, handleIpn, handleReturn, queryOrder } = require('../controllers/sslcommerz.controller');

router.post('/init', authenticate, initPayment);
router.post('/ipn', handleIpn);
router.post('/return', handleReturn);
router.get('/query/:id', authenticate, queryOrder);

module.exports = router;
