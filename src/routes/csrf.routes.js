const { Router } = require('express');
const { getToken } = require('../controllers/csrf.controller');

const router = Router();

router.get('/', getToken);

module.exports = router;
