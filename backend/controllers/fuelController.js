const { FuelEntry, ParcelSeason, Parcel, Block, Crop } = require('../models');

exports.createFuelEntry = async (req, res) => {
  try {
    const { farmId, parcelSeasonId, date, liters, pricePerLiter, equipment, workDescription, invoiceNumber, supplier, notes } = req.body;
    const entry = await FuelEntry.create({ farmId, parcelSeasonId, date, liters, pricePerLiter, equipment, workDescription, invoiceNumber, supplier, notes });
    res.status(201).json(entry);
  } catch (error) {
    console.error('Eroare la adaugarea motorinei:', error.message);
    res.status(500).json({ message: 'Eroare de server.' });
  }
};

exports.getFarmFuel = async (req, res) => {
  try {
    const { farmId } = req.params;
    const entries = await FuelEntry.findAll({
      where: { farmId },
      include: [{
        model: ParcelSeason, as: 'sezon', required: false,
        include: [
          { model: Crop, as: 'cultura' },
          { model: Parcel, as: 'parcel', include: [{ model: Block, as: 'block' }] }
        ]
      }],
      order: [['date', 'DESC']]
    });
    res.json(entries);
  } catch (error) {
    console.error('Eroare la obtinerea consumului de motorina:', error.message);
    res.status(500).json({ message: 'Eroare de server.' });
  }
};

exports.updateFuelEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, liters, pricePerLiter, equipment, workDescription, invoiceNumber, supplier, notes, parcelSeasonId } = req.body;
    const entry = await FuelEntry.findByPk(id);
    if (!entry) return res.status(404).json({ message: 'Inregistrarea nu a fost gasita.' });
    await entry.update({ date, liters, pricePerLiter, equipment, workDescription, invoiceNumber, supplier, notes, parcelSeasonId });
    res.json(entry);
  } catch (error) {
    console.error('Eroare la actualizarea inregistrarii:', error.message);
    res.status(500).json({ message: 'Eroare de server.' });
  }
};

exports.deleteFuelEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const entry = await FuelEntry.findByPk(id);
    if (!entry) return res.status(404).json({ message: 'Inregistrarea nu a fost gasita.' });
    await entry.destroy();
    res.json({ message: 'Inregistrarea a fost stearsa.' });
  } catch (error) {
    console.error('Eroare la stergerea inregistrarii:', error.message);
    res.status(500).json({ message: 'Eroare de server.' });
  }
};
