const { Harvest, ParcelSeason, Parcel, Block, Crop } = require('../models');

// Adauga o recoltare individuala
exports.createHarvest = async (req, res) => {
  try {
    const { parcelSeasonId, harvestDate, quantityKg, humidity, avizNumber, destination } = req.body;
    const harvest = await Harvest.create({ parcelSeasonId, harvestDate, quantityKg, humidity, avizNumber, destination });
    res.status(201).json(harvest);
  } catch (error) {
    console.error('Eroare la crearea recoltarii:', error.message);
    res.status(500).json({ message: 'Eroare de server.' });
  }
};

// Obtine toate recoltarile pentru o ferma
exports.getFarmHarvests = async (req, res) => {
  try {
    const { farmId } = req.params;
    const harvests = await Harvest.findAll({
      include: [{
        model: ParcelSeason, as: 'sezon', required: true,
        include: [
          { model: Crop, as: 'cultura' },
          { model: Parcel, as: 'parcel', include: [{ model: Block, as: 'block', where: { farmId } }] }
        ]
      }],
      order: [['harvestDate', 'DESC']]
    });
    res.json(harvests);
  } catch (error) {
    console.error('Eroare la obtinerea recoltarilor:', error.message);
    res.status(500).json({ message: 'Eroare de server.' });
  }
};

// Calcul proportional - distribuie cantitatea totala pe parcele
exports.proportionalHarvest = async (req, res) => {
  try {
    const { farmId, cropId, year, totalQuantityKg, harvestDate, humidity, avizNumber, destination } = req.body;

    // Gasim toate parcelSeasons cu aceasta cultura in acest an pe aceasta ferma
    const parcelSeasons = await ParcelSeason.findAll({
      where: { cropId: Number(cropId), year: Number(year) },
      include: [{
        model: Parcel, as: 'parcel', required: true,
        include: [{ model: Block, as: 'block', where: { farmId: Number(farmId) } }]
      }]
    });

    if (parcelSeasons.length === 0) {
      return res.status(400).json({ message: 'Nu exista parcele cu aceasta cultura in anul selectat.' });
    }

    const totalArea = parcelSeasons.reduce((sum, ps) => sum + (ps.parcel?.areaHa || 0), 0);

    if (totalArea === 0) {
      return res.status(400).json({ message: 'Suprafata totala este 0.' });
    }

    const results = [];
    for (const ps of parcelSeasons) {
      const parcelArea = ps.parcel?.areaHa || 0;
      const qty = Math.round((totalQuantityKg / totalArea) * parcelArea);
      const harvest = await Harvest.create({
        parcelSeasonId: ps.id,
        harvestDate,
        quantityKg: qty,
        humidity,
        avizNumber,
        destination
      });
      results.push({
        ...harvest.toJSON(),
        blockNumber: ps.parcel?.block?.blockNumber,
        parcelNumber: ps.parcel?.parcelNumber,
        areaHa: parcelArea,
        percentOfTotal: Math.round((parcelArea / totalArea) * 10000) / 100
      });
    }

    res.status(201).json({
      totalQuantityKg,
      totalArea: Math.round(totalArea * 100) / 100,
      distributions: results
    });
  } catch (error) {
    console.error('Eroare la calculul proportional:', error.message);
    res.status(500).json({ message: 'Eroare de server.' });
  }
};

// Preview calcul proportional (fara salvare)
exports.previewProportional = async (req, res) => {
  try {
    const { farmId, cropId, year, totalQuantityKg } = req.body;

    const parcelSeasons = await ParcelSeason.findAll({
      where: { cropId: Number(cropId), year: Number(year) },
      include: [{
        model: Parcel, as: 'parcel', required: true,
        include: [{ model: Block, as: 'block', where: { farmId: Number(farmId) } }]
      }, { model: Crop, as: 'cultura' }]
    });

    if (parcelSeasons.length === 0) {
      return res.json({ totalArea: 0, distributions: [] });
    }

    const totalArea = parcelSeasons.reduce((sum, ps) => sum + (ps.parcel?.areaHa || 0), 0);

    const distributions = parcelSeasons.map(ps => {
      const parcelArea = ps.parcel?.areaHa || 0;
      const qty = Math.round((totalQuantityKg / totalArea) * parcelArea);
      return {
        parcelSeasonId: ps.id,
        blockNumber: ps.parcel?.block?.blockNumber,
        parcelNumber: ps.parcel?.parcelNumber,
        areaHa: parcelArea,
        quantityKg: qty,
        percentOfTotal: Math.round((parcelArea / totalArea) * 10000) / 100
      };
    });

    res.json({ totalArea: Math.round(totalArea * 100) / 100, distributions });
  } catch (error) {
    console.error('Eroare la preview proportional:', error.message);
    res.status(500).json({ message: 'Eroare de server.' });
  }
};

exports.updateHarvest = async (req, res) => {
  try {
    const { id } = req.params;
    const { harvestDate, quantityKg, humidity, avizNumber, destination } = req.body;
    const harvest = await Harvest.findByPk(id);
    if (!harvest) return res.status(404).json({ message: 'Recoltarea nu a fost gasita.' });
    await harvest.update({ harvestDate, quantityKg, humidity, avizNumber, destination });
    res.json(harvest);
  } catch (error) {
    console.error('Eroare la actualizarea recoltarii:', error.message);
    res.status(500).json({ message: 'Eroare de server.' });
  }
};

exports.deleteHarvest = async (req, res) => {
  try {
    const { id } = req.params;
    const harvest = await Harvest.findByPk(id);
    if (!harvest) return res.status(404).json({ message: 'Recoltarea nu a fost gasita.' });
    await harvest.destroy();
    res.json({ message: 'Recoltarea a fost stearsa.' });
  } catch (error) {
    console.error('Eroare la stergerea recoltarii:', error.message);
    res.status(500).json({ message: 'Eroare de server.' });
  }
};
