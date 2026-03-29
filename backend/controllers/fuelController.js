const { FuelEntry, ParcelSeason, Parcel, Block, Crop } = require('../models');

// Creare inregistrare (Achizitie sau Consum)
exports.createFuelEntry = async (req, res) => {
  try {
    const { farmId, type, date, liters, pricePerLiter, equipment, workDescription, parcelSeasonId, invoiceNumber, supplier, notes } = req.body;
    
    const entry = await FuelEntry.create({
      farmId,
      type, // ACHIZITIE sau CONSUM
      date,
      liters,
      pricePerLiter: type === 'ACHIZITIE' ? pricePerLiter : null,
      equipment: type === 'CONSUM' ? equipment : null,
      workDescription: type === 'CONSUM' ? workDescription : null,
      parcelSeasonId: type === 'CONSUM' ? parcelSeasonId : null,
      invoiceNumber: type === 'ACHIZITIE' ? invoiceNumber : null,
      supplier: type === 'ACHIZITIE' ? supplier : null,
      notes
    });

    res.status(201).json(entry);
  } catch (error) {
    console.error('Eroare la adaugarea inregistrarii de motorina:', error.message);
    res.status(500).json({ message: 'Eroare de server.' });
  }
};

// Obtine toate inregistrarile pentru o ferma
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
      order: [['date', 'DESC'], ['createdAt', 'DESC']]
    });
    res.json(entries);
  } catch (error) {
    console.error('Eroare la obtinerea inregistrarilor de motorina:', error.message);
    res.status(500).json({ message: 'Eroare de server.' });
  }
};

// Stergere inregistrare
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

// Actualizare inregistrare
exports.updateFuelEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, date, liters, pricePerLiter, equipment, workDescription, parcelSeasonId, invoiceNumber, supplier, notes } = req.body;
    const entry = await FuelEntry.findByPk(id);
    if (!entry) return res.status(404).json({ message: 'Inregistrarea nu a fost gasita.' });
    
    await entry.update({
      type, date, liters, pricePerLiter, equipment, workDescription, parcelSeasonId, invoiceNumber, supplier, notes
    });
    
    res.json(entry);
  } catch (error) {
    console.error('Eroare la actualizarea inregistrarii:', error.message);
    res.status(500).json({ message: 'Eroare de server.' });
  }
};
