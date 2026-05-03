const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { initiatePayment, handleWebhook, getPaymentById } = require('../controllers/payment.controller');

router.post('/initiate', authenticate, initiatePayment);
router.post('/webhook', handleWebhook);
router.get('/:id', authenticate, getPaymentById);

module.exports = router;