const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { getActivityLogs } = require('../controllers/activity.controller');

router.use(authenticate);
router.use(authorize('admin'));

router.get('/', getActivityLogs);

module.exports = router;
