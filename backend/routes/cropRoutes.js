const express = require('express');
const router = express.Router();
const cropController = require('../controllers/cropController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/', cropController.getCrops);

module.exports = router;
