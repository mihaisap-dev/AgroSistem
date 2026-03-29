const express = require('express');
const router = express.Router();
const blockController = require('../controllers/blockController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', blockController.createBlock);
router.get('/farm/:farmId', blockController.getBlocksByFarm);
router.put('/:id', blockController.updateBlock);
router.delete('/:id', blockController.deleteBlock);

module.exports = router;
