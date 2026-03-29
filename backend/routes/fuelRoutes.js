const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/fuelController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', ctrl.createFuelEntry);
router.get('/farm/:farmId', ctrl.getFarmFuel);
router.put('/:id', ctrl.updateFuelEntry);
router.delete('/:id', ctrl.deleteFuelEntry);

module.exports = router;
