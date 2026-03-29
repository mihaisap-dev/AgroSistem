const express = require('express');
const router = express.Router();
const parcelController = require('../controllers/parcelController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/', parcelController.createParcel);
router.put('/:id', parcelController.updateParcel);
router.delete('/:id', parcelController.deleteParcel);

module.exports = router;
