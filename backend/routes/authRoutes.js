const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Ruta pentru inregistrare: POST /api/auth/register
router.post('/register', authController.register);

// Ruta pentru login: POST /api/auth/login
router.post('/login', authController.login);

module.exports = router;
