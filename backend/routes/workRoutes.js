const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/workController');
const { protect } = require('../middleware/authMiddleware');

router.get('/types', protect, ctrl.getWorkTypes);
router.post('/', protect, ctrl.createWork);
router.get('/farm/:farmId', protect, ctrl.getFarmWorks);
router.get('/tech-sheet/:farmId/:cropId/:year', protect, ctrl.getTechSheet);
router.put('/:id', protect, ctrl.updateWork);
router.delete('/:id', protect, ctrl.deleteWork);

module.exports = router;
