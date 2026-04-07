const { ParcelSeason, Parcel, Block, Crop, Farm, Work, WorkType, Harvest } = require('../models');

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

// Registrul Fermierului - Form 013 APIA
exports.getRegistruFermier = async (req, res) => {
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
        { model: Crop, as: 'cultura' },
        {
          model: Work, as: 'lucrari',
          include: [{ model: WorkType, as: 'tip' }]
        },
        { model: Harvest, as: 'harvests' }
      ],
      order: [[{ model: Parcel, as: 'parcel' }, { model: Block, as: 'block' }, 'blockNumber', 'ASC']]
    });

    const rows = parcelSeasons.map((ps) => {
      const works = ps.lucrari || [];
      const harvests = ps.harvests || [];
      const areaHa = ps.parcel?.areaHa || 0;

      // Find specific work types
      const findWork = (names) => works.filter(w => names.some(n => (w.tip?.name || '').toLowerCase().includes(n)));

      const aratWorks = findWork(['arat']);
      const pregTerenWorks = findWork(['pregătire teren', 'discuit']);
      const fertilizatWorks = findWork(['fertilizat', 'îngrășăm']);
      const tratamentWorks = findWork(['erbicid', 'tratament', 'fungicid', 'insecticid']);
      const semanatWorks = findWork(['semănat', 'sămânță']);
      const intretinereWorks = findWork(['prășit', 'întreținere', 'deservit']);
      const recoltatWorks = findWork(['recoltat']);

      // Total harvest
      const totalHarvestKg = harvests.reduce((s, h) => s + (h.quantityKg || 0), 0);
      const productieKgHa = areaHa > 0 ? Math.round(totalHarvestKg / areaHa) : 0;
      const harvestDate = harvests.length > 0 ? harvests[0].harvestDate : '';

      return {
        parcela: ps.parcel?.parcelNumber || '',
        bf: ps.parcel?.block?.blockNumber || '',
        ha: areaHa,
        cultura: ps.cultura?.name || '',
        suprTeren: areaHa,
        arat: aratWorks.map(w => w.period).join(', '),
        pregTeren: pregTerenWorks.map(w => w.period).join(', '),
        fertilizatData: fertilizatWorks.map(w => w.period).join(', '),
        fertilizatIngrasamant: fertilizatWorks.map(w => w.products).filter(Boolean).join(', '),
        fertilizatCantitate: fertilizatWorks.map(w => w.qtyPerHa ? `${w.qtyPerHa} ${w.unit || 'kg'}/ha` : '').filter(Boolean).join(', '),
        tratamentData: tratamentWorks.map(w => w.period).join(', '),
        tratamentSubstanta: tratamentWorks.map(w => w.products).filter(Boolean).join(', '),
        tratamentDoza: tratamentWorks.map(w => w.qtyPerHa ? `${w.qtyPerHa} ${w.unit || 'l'}/ha` : '').filter(Boolean).join(', '),
        semanatData: semanatWorks.map(w => w.period).join(', '),
        semanatSoiHibrid: semanatWorks.map(w => w.products).filter(Boolean).join(', '),
        semanatCantHa: semanatWorks.map(w => w.qtyPerHa ? `${w.qtyPerHa} ${w.unit || 'kg'}/ha` : '').filter(Boolean).join(', '),
        lucrariIntretinere: intretinereWorks.map(w => `${w.tip?.name || ''} (${w.period || ''})`).filter(Boolean).join('; '),
        recoltat: harvestDate || recoltatWorks.map(w => w.period).join(', '),
        productieKgHa
      };
    });

    res.json({
      farm: {
        name: farm.name,
        cui: farm.cui,
        county: farm.county,
        locality: farm.locality,
        sediu: `${farm.locality || ''}, ${farm.county || ''}`
      },
      year: Number(year),
      rows
    });
  } catch (error) {
    console.error('Eroare la generarea Registrului Fermierului:', error.message);
    res.status(500).json({ message: 'Eroare de server.' });
  }
};

// Registrul Exploatației - Form 001 APIA
exports.getRegistruExploatatie = async (req, res) => {
  try {
    const { farmId, year } = req.params;

    const farm = await Farm.findByPk(farmId);
    if (!farm) return res.status(404).json({ message: 'Ferma nu a fost gasita.' });

    // Get all parcels for this farm
    const allParcels = await Parcel.findAll({
      include: [{ model: Block, as: 'block', where: { farmId: Number(farmId) } }],
      order: [['blockId', 'ASC'], ['parcelNumber', 'ASC']]
    });

    // Get all parcel seasons for this year with works and harvests
    const parcelSeasons = await ParcelSeason.findAll({
      where: { year: Number(year) },
      include: [
        {
          model: Parcel, as: 'parcel', required: true,
          include: [{ model: Block, as: 'block', where: { farmId: Number(farmId) } }]
        },
        { model: Crop, as: 'cultura' },
        {
          model: Work, as: 'lucrari',
          include: [{ model: WorkType, as: 'tip' }]
        },
        { model: Harvest, as: 'harvests' }
      ]
    });

    // Group parcel seasons by parcelId
    const seasonsByParcel = {};
    parcelSeasons.forEach(ps => {
      if (!seasonsByParcel[ps.parcelId]) seasonsByParcel[ps.parcelId] = [];
      seasonsByParcel[ps.parcelId].push(ps);
    });

    // Helper to extract work periods by type
    const getWorkPeriods = (works, nameFilter) => {
      return (works || [])
        .filter(w => nameFilter.some(n => (w.tip?.name || '').toLowerCase().includes(n)))
        .map(w => w.period)
        .filter(Boolean)
        .join(', ');
    };

    const getWorkDescriptions = (works) => {
      return (works || [])
        .map(w => w.tip?.name || '')
        .filter(Boolean)
        .join(', ');
    };

    const getHarvestPeriod = (ps) => {
      const harvests = ps.harvests || [];
      if (harvests.length > 0) return harvests.map(h => h.harvestDate).join(', ');
      const recoltatWorks = (ps.lucrari || []).filter(w => (w.tip?.name || '').toLowerCase().includes('recoltat'));
      return recoltatWorks.map(w => w.period).join(', ');
    };

    const rows = allParcels.map(parcel => {
      const seasons = seasonsByParcel[parcel.id] || [];

      // Classify seasons: Primavara = principal, check for secondary/successive/winter
      // Primary crop is the main season entry (usually first or "Primavara")
      const primarySeason = seasons.find(s => s.season === 'Primavara') || seasons[0] || null;
      // Secondary = a second crop in the same year that's not the primary
      const secondarySeason = seasons.find(s => s !== primarySeason && s.season === 'Primavara') || null;
      // Successive crop
      const successiveSeason = seasons.find(s => s !== primarySeason && s !== secondarySeason) || null;
      // Winter crop = Toamna season
      const winterSeason = seasons.find(s => s.season === 'Toamna') || null;

      // Use winterSeason as primary if no spring crop
      const mainSeason = primarySeason && primarySeason.season !== 'Toamna' ? primarySeason : null;
      const actualWinter = winterSeason || (primarySeason && primarySeason.season === 'Toamna' ? primarySeason : null);

      const buildCropData = (ps) => {
        if (!ps) return { cultura: '', pregTeren: '', lucrari: '', recoltare: '' };
        return {
          cultura: ps.cultura?.name || '',
          pregTeren: getWorkPeriods(ps.lucrari, ['pregătire', 'discuit', 'arat']),
          lucrari: getWorkDescriptions(ps.lucrari),
          recoltare: getHarvestPeriod(ps)
        };
      };

      return {
        parcela: parcel.parcelNumber || '',
        bf: parcel.block?.blockNumber || '',
        suprafataHa: parcel.areaHa || 0,
        principal: buildCropData(mainSeason),
        culturaSecundaraInfiintata: secondarySeason ? secondarySeason.cultura?.name || '' : '',
        secundar: buildCropData(secondarySeason),
        succesiv: buildCropData(successiveSeason),
        toamna: {
          cultura: actualWinter?.cultura?.name || '',
          pregTeren: actualWinter ? getWorkPeriods(actualWinter.lucrari, ['pregătire', 'discuit', 'arat']) : '',
          recoltare: actualWinter ? getHarvestPeriod(actualWinter) : ''
        }
      };
    });

    res.json({
      farm: {
        name: farm.name,
        cui: farm.cui,
        county: farm.county,
        locality: farm.locality,
        sediu: `${farm.locality || ''}, ${farm.county || ''}`
      },
      year: Number(year),
      rows
    });
  } catch (error) {
    console.error('Eroare la generarea Registrului Exploatatiei:', error.message);
    res.status(500).json({ message: 'Eroare de server.' });
  }
};
