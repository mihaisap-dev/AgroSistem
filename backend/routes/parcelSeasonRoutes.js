const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/parcelSeasonController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', ctrl.createParcelSeason);
router.get('/farm/:farmId', ctrl.getFarmHistory);
router.put('/:id', ctrl.updateParcelSeason);
router.delete('/:id', ctrl.deleteParcelSeason);

module.exports = router;
