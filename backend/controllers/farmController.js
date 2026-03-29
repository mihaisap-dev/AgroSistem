const { Farm } = require('../models');

// Creeaza o ferma noua
exports.createFarm = async (req, res) => {
  try {
    const { name, cui, locality, county, iban, bank } = req.body;
    
    // req.user.id vine din middleware-ul de protectie (protect)
    const newFarm = await Farm.create({
      name,
      cui,
      locality,
      county,
      iban,
      bank,
      userId: req.user.id
    });

    res.status(201).json(newFarm);
  } catch (error) {
    console.error('Eroare la crearea fermei:', error.message);
    res.status(500).json({ message: 'Eroare de server la crearea fermei.' });
  }
};

// Obtine toate fermele utilizatorului logat
exports.getFarms = async (req, res) => {
  try {
    const farms = await Farm.findAll({
      where: { userId: req.user.id }
    });
    res.json(farms);
  } catch (error) {
    console.error('Eroare la obtinerea fermelor:', error.message);
    res.status(500).json({ message: 'Eroare de server la obtinerea fermelor.' });
  }
};
