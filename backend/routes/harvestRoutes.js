const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/harvestController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', ctrl.createHarvest);
router.get('/farm/:farmId', ctrl.getFarmHarvests);
router.post('/proportional', ctrl.proportionalHarvest);
router.post('/preview-proportional', ctrl.previewProportional);
router.put('/:id', ctrl.updateHarvest);
router.delete('/:id', ctrl.deleteHarvest);

module.exports = router;
