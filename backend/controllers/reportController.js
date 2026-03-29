const { ParcelSeason, Parcel, Block, Crop, Farm } = require('../models');

// Raport APIA - Cerere de Plata
exports.getApiaReport = async (req, res) => {
  try {
    const { farmId, year } = req.params;

    const farm = await Farm.findByPk(farmId);
    if (!farm) return res.status(404).json({ message: 'Ferma nu a fost gasita.' });

    const parcelSeasons = await ParcelSeason.findAll({
      where: { year: Number(year) },
      include: [
        {
          model: Parcel, as: 'parcel', required: true,
          include: [{ model: Block, as: 'block', where: { farmId: Number(farmId) } }]
        },
        { model: Crop, as: 'cultura' }
      ],
      order: [[{ model: Parcel, as: 'parcel' }, { model: Block, as: 'block' }, 'blockNumber', 'ASC']]
    });

    const rows = parcelSeasons.map((ps, i) => ({
      nrCrt: i + 1,
      judet: farm.county || '',
      localitate: ps.parcel?.block?.locality || farm.locality || '',
      blocFizic: ps.parcel?.block?.blockNumber || '',
      parcela: ps.parcel?.parcelNumber || '',
      suprafata: ps.parcel?.areaHa || 0,
      cultura: ps.cultura?.name || '',
      codPachet: 'DR_10_SEMN'
    }));

    const totalSuprafata = rows.reduce((s, r) => s + r.suprafata, 0);
    const nrParcele = rows.length;
    const culturi = [...new Set(rows.map(r => r.cultura))];

    // Parcele fara cultura (avertizari)
    const allParcels = await Parcel.findAll({
      include: [{ model: Block, as: 'block', where: { farmId: Number(farmId) } }]
    });
    const parcelIdsWithCrop = new Set(parcelSeasons.map(ps => ps.parcelId));
    const parcelsWithoutCrop = allParcels
      .filter(p => !parcelIdsWithCrop.has(p.id))
      .map(p => ({ blockNumber: p.block?.blockNumber, parcelNumber: p.parcelNumber, areaHa: p.areaHa }));

    res.json({
      farm: { name: farm.name, cui: farm.cui, county: farm.county, locality: farm.locality },
      year: Number(year),
      rows,
      totals: {
        suprafata: Math.round(totalSuprafata * 100) / 100,
        nrParcele,
        nrCulturi: culturi.length
      },
      warnings: parcelsWithoutCrop
    });
  } catch (error) {
    console.error('Eroare la generarea raportului APIA:', error.message);
    res.status(500).json({ message: 'Eroare de server.' });
  }
};
