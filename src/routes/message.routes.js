const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { getMessages, logMessage } = require('../controllers/message.controller');

router.use(authenticate);
router.use(authorize('admin'));

router.get('/', getMessages);
router.post('/', logMessage);

module.exports = router;
