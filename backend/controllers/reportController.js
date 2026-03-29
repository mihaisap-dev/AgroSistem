const { ParcelSeason, Parcel, Block, Crop, Farm } = require('../models');

// Raport APIA - Cerere de Plata cu verificare GAEC 7
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
      landCategory: ps.parcel?.landCategory || 'TA',
      cultura: ps.cultura?.name || '',
      cropGenus: ps.cultura?.genus || '',
      year: ps.year,
      season: ps.season,
      drIntervention: ps.drIntervention || '',
      codPachet: 'DR_10_SEMN'
    }));

    const totalSuprafata = rows.reduce((s, r) => s + r.suprafata, 0);
    const nrParcele = rows.length;
    const culturi = [...new Set(rows.map(r => r.cultura))];

    // GAEC 7 - Diversificare culturi (bazat pe gen botanic)
    const cropAreas = {};
    parcelSeasons.forEach(ps => {
      const genus = ps.cultura?.genus || ps.cultura?.name || 'Necunoscut';
      const area = ps.parcel?.areaHa || 0;
      if (!cropAreas[genus]) {
        cropAreas[genus] = { name: ps.cultura?.name || '', genus, area: 0 };
      }
      cropAreas[genus].area += area;
    });
    const sortedCrops = Object.values(cropAreas).sort((a, b) => b.area - a.area);
    const mainCropPct = totalSuprafata > 0 && sortedCrops[0]
      ? Math.round((sortedCrops[0].area / totalSuprafata) * 1000) / 10
      : 0;

    // Parcele fara cultura (avertizari)
    const allParcels = await Parcel.findAll({
      include: [{ model: Block, as: 'block', where: { farmId: Number(farmId) } }]
    });
    const parcelIdsWithCrop = new Set(parcelSeasons.map(ps => ps.parcelId));
    const parcelsWithoutCrop = allParcels
      .filter(p => !parcelIdsWithCrop.has(p.id))
      .map(p => ({ blockNumber: p.block?.blockNumber, parcelNumber: p.parcelNumber, areaHa: p.areaHa }));

    res.json({
      farm: {
        name: farm.name,
        cui: farm.cui,
        county: farm.county,
        locality: farm.locality,
        iban: farm.iban,
        bank: farm.bank
      },
      year: Number(year),
      rows,
      totals: {
        suprafata: Math.round(totalSuprafata * 100) / 100,
        nrParcele,
        nrCulturi: culturi.length
      },
      gaec7: {
        totalArea: Math.round(totalSuprafata * 100) / 100,
        crops: sortedCrops.map(c => ({
          name: c.name,
          genus: c.genus,
          area: Math.round(c.area * 100) / 100,
          percentage: totalSuprafata > 0 ? Math.round((c.area / totalSuprafata) * 1000) / 10 : 0
        })),
        mainCropPct,
        isExempt: totalSuprafata <= 10,
        isCompliant: totalSuprafata <= 10 || mainCropPct <= 75
      },
      warnings: parcelsWithoutCrop
    });
  } catch (error) {
    console.error('Eroare la generarea raportului APIA:', error.message);
    res.status(500).json({ message: 'Eroare de server.' });
  }
};
