const { ParcelSeason, Parcel, Crop, Block } = require('../models');

exports.createParcelSeason = async (req, res) => {
  try {
    const { parcelId, cropId, year, season, rotationWarning } = req.body;

    const existing = await ParcelSeason.findOne({
      where: { parcelId, year, season }
    });

    if (existing) {
      await existing.update({ cropId, rotationWarning });
      return res.json(existing);
    }

    const newSeason = await ParcelSeason.create({
      parcelId, cropId, year, season, rotationWarning
    });

    res.status(201).json(newSeason);
  } catch (error) {
    console.error('Eroare la alocarea culturii:', error.message);
    res.status(500).json({ message: 'Eroare de server la alocarea culturii.' });
  }
};

exports.getFarmHistory = async (req, res) => {
  try {
    const { farmId } = req.params;
    const history = await ParcelSeason.findAll({
      include: [
        {
          model: Parcel, as: 'parcel', required: true,
          include: [{ model: Block, as: 'block', where: { farmId } }]
        },
        { model: Crop, as: 'cultura' }
      ],
      order: [['year', 'DESC']]
    });
    res.json(history);
  } catch (error) {
    console.error('Eroare la obtinerea istoricului:', error.message);
    res.status(500).json({ message: 'Eroare de server.' });
  }
};

exports.updateParcelSeason = async (req, res) => {
  try {
    const { id } = req.params;
    const { cropId, year, season, rotationWarning } = req.body;
    const ps = await ParcelSeason.findByPk(id);
    if (!ps) return res.status(404).json({ message: 'Inregistrarea nu a fost gasita.' });
    await ps.update({ cropId, year, season, rotationWarning });
    res.json(ps);
  } catch (error) {
    console.error('Eroare la actualizarea sezonului:', error.message);
    res.status(500).json({ message: 'Eroare de server.' });
  }
};

exports.deleteParcelSeason = async (req, res) => {
  try {
    const { id } = req.params;
    const ps = await ParcelSeason.findByPk(id);
    if (!ps) return res.status(404).json({ message: 'Inregistrarea nu a fost gasita.' });
    await ps.destroy();
    res.json({ message: 'Alocare cultura stearsa.' });
  } catch (error) {
    console.error('Eroare la stergerea sezonului:', error.message);
    res.status(500).json({ message: 'Eroare de server.' });
  }
};
