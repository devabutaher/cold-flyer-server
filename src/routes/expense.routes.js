const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { getExpenses, getExpense, createExpense, updateExpense, deleteExpense } = require('../controllers/expense.controller');

router.use(authenticate);
router.use(authorize('admin'));

router.get('/', getExpenses);
router.get('/:id', getExpense);
router.post('/', createExpense);
router.patch('/:id', updateExpense);
router.delete('/:id', deleteExpense);

module.exports = router;
