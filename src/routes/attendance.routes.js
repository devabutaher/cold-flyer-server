const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const { getTodayStatus, getAttendanceHistory, checkin, checkout } = require('../controllers/attendance.controller');

router.use(authenticate);
router.use(authorize('admin'));

router.get('/today', getTodayStatus);
router.get('/history', getAttendanceHistory);
router.post('/checkin', checkin);
router.post('/checkout', checkout);

module.exports = router;
