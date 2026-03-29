const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/apia/:farmId/:year', ctrl.getApiaReport);

module.exports = router;
