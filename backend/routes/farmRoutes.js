const express = require('express');
const router = express.Router();
const farmController = require('../controllers/farmController');
const { protect } = require('../middleware/authMiddleware');

// Toate rutele de aici sunt protejate (necesita token)
router.use(protect);

// Ruta: POST /api/farms - Creare ferma
router.post('/', farmController.createFarm);

// Ruta: GET /api/farms - Obtinere ferme utilizator
router.get('/', farmController.getFarms);

module.exports = router;
