const { Crop } = require('../models');

// Obtine toate culturile predefinite
exports.getCrops = async (req, res) => {
  try {
    const crops = await Crop.findAll();
    res.json(crops);
  } catch (error) {
    console.error('Eroare la obtinerea culturilor:', error.message);
    res.status(500).json({ message: 'Eroare de server.' });
  }
};
