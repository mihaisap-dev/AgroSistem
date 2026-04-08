const { Farm } = require('../models');

// Creeaza o ferma noua
exports.createFarm = async (req, res) => {
  try {
    const { name, cui, locality, county, iban, bank, registerNumber } = req.body;

    // req.user.id vine din middleware-ul de protectie (protect)
    const newFarm = await Farm.create({
      name,
      cui,
      locality,
      county,
      iban,
      bank,
      registerNumber,
      userId: req.user.id
    });

    res.status(201).json(newFarm);
  } catch (error) {
    console.error('Eroare la crearea fermei:', error.message);
    res.status(500).json({ message: 'Eroare de server la crearea fermei.' });
  }
};

// Actualizeaza o ferma existenta
exports.updateFarm = async (req, res) => {
  try {
    const { name, cui, locality, county, iban, bank, registerNumber } = req.body;
    const farm = await Farm.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!farm) return res.status(404).json({ message: 'Ferma negasita.' });
    await farm.update({ name, cui, locality, county, iban, bank, registerNumber });
    res.json(farm);
  } catch (error) {
    console.error('Eroare la actualizarea fermei:', error.message);
    res.status(500).json({ message: 'Eroare de server la actualizarea fermei.' });
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
