const { Work, WorkType, ParcelSeason, Parcel, Block, Crop } = require('../models');

exports.getWorkTypes = async (req, res) => {
  try {
    const types = await WorkType.findAll();
    res.json(types);
  } catch (error) {
    console.error('Eroare la obtinerea tipurilor de lucrari:', error.message);
    res.status(500).json({ message: 'Eroare de server.' });
  }
};

exports.createWork = async (req, res) => {
  try {
    const { parcelSeasonId, workTypeId, period, equipment, products, qtyPerHa, unit, notes } = req.body;
    const newWork = await Work.create({
      parcelSeasonId, workTypeId, period, equipment, products, qtyPerHa, unit, notes
    });
    res.status(201).json(newWork);
  } catch (error) {
    console.error('Eroare la adaugarea lucrarii:', error.message);
    res.status(500).json({ message: 'Eroare de server.' });
  }
};

exports.getFarmWorks = async (req, res) => {
  try {
    const { farmId } = req.params;
    const works = await Work.findAll({
      include: [
        { model: WorkType, as: 'tip' },
        {
          model: ParcelSeason, as: 'sezon', required: true,
          include: [
            { model: Crop, as: 'cultura' },
            { model: Parcel, as: 'parcel', include: [{ model: Block, as: 'block', where: { farmId } }] }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(works);
  } catch (error) {
    console.error('Eroare la obtinerea lucrarilor fermei:', error.message);
    res.status(500).json({ message: 'Eroare de server.' });
  }
};

exports.updateWork = async (req, res) => {
  try {
    const { id } = req.params;
    const { workTypeId, period, equipment, products, qtyPerHa, unit, notes } = req.body;
    const work = await Work.findByPk(id);
    if (!work) return res.status(404).json({ message: 'Lucrarea nu a fost gasita.' });
    await work.update({ workTypeId, period, equipment, products, qtyPerHa, unit, notes });
    res.json(work);
  } catch (error) {
    console.error('Eroare la actualizarea lucrarii:', error.message);
    res.status(500).json({ message: 'Eroare de server.' });
  }
};

exports.deleteWork = async (req, res) => {
  try {
    const { id } = req.params;
    const work = await Work.findByPk(id);
    if (!work) return res.status(404).json({ message: 'Lucrarea nu a fost gasita.' });
    await work.destroy();
    res.json({ message: 'Lucrarea a fost stearsa.' });
  } catch (error) {
    console.error('Eroare la stergerea lucrarii:', error.message);
    res.status(500).json({ message: 'Eroare de server.' });
  }
};

// Fisa Tehnologica consolidata pe cultura si an
exports.getTechSheet = async (req, res) => {
  try {
    const { farmId, cropId, year } = req.params;

    // Gasim toate parcelSeasons cu aceasta cultura in acest an
    const parcelSeasons = await ParcelSeason.findAll({
      where: { cropId: Number(cropId), year: Number(year) },
      include: [
        { model: Parcel, as: 'parcel', required: true, include: [{ model: Block, as: 'block', where: { farmId: Number(farmId) } }] },
        { model: Crop, as: 'cultura' },
        { model: Work, as: 'lucrari', include: [{ model: WorkType, as: 'tip' }] }
      ]
    });

    if (parcelSeasons.length === 0) {
      return res.json({ crop: null, totalArea: 0, parcelCount: 0, mechanical: [], manual: [], inputs: [] });
    }

    const crop = parcelSeasons[0].cultura;
    const totalArea = parcelSeasons.reduce((sum, ps) => sum + (ps.parcel?.areaHa || 0), 0);
    const parcelCount = parcelSeasons.length;

    // Colectam toate lucrarile
    const allWorks = parcelSeasons.flatMap(ps =>
      (ps.lucrari || []).map(w => ({
        ...w.toJSON(),
        parcelArea: ps.parcel?.areaHa || 0,
        blockNumber: ps.parcel?.block?.blockNumber,
        parcelNumber: ps.parcel?.parcelNumber
      }))
    );

    // Grupare pe categorii
    const mechanical = [];
    const manual = [];
    const inputs = [];

    // Grupam lucrarile dupa tipul de lucrare
    const grouped = {};
    for (const w of allWorks) {
      const key = w.tip?.name || w.workTypeId;
      if (!grouped[key]) {
        grouped[key] = {
          name: w.tip?.name || 'Necunoscut',
          category: w.tip?.category || 'Altele',
          periods: [],
          equipments: [],
          products: [],
          totalArea: 0,
          totalQty: 0,
          unit: w.unit || 'kg',
          entries: []
        };
      }
      grouped[key].totalArea += w.parcelArea;
      if (w.qtyPerHa) grouped[key].totalQty += w.qtyPerHa * w.parcelArea;
      if (w.period && !grouped[key].periods.includes(w.period)) grouped[key].periods.push(w.period);
      if (w.equipment && !grouped[key].equipments.includes(w.equipment)) grouped[key].equipments.push(w.equipment);
      if (w.products && !grouped[key].products.includes(w.products)) grouped[key].products.push(w.products);
    }

    // Collect all materials consumed (products with qty from ANY category)
    const materialsMap = {};

    for (const [, g] of Object.entries(grouped)) {
      const entry = {
        name: g.name,
        period: g.periods.join(', '),
        totalArea: Math.round(g.totalArea * 100) / 100,
        equipment: g.equipments.join(', '),
        products: g.products.join(', '),
        totalQty: Math.round(g.totalQty * 100) / 100,
        qtyPerHa: g.totalArea > 0 ? Math.round((g.totalQty / g.totalArea) * 100) / 100 : 0,
        unit: g.unit
      };

      if (g.category === 'Lucrări mecanice') mechanical.push(entry);
      else if (g.category === 'Lucrări manuale') manual.push(entry);
      else if (g.category === 'Input-uri') inputs.push(entry);
      else mechanical.push(entry);

      // If this work has products and qty, add to materials consumed
      if (g.products.length > 0 && g.totalQty > 0) {
        for (const prod of g.products) {
          const mKey = `${prod}-${g.unit}`;
          if (!materialsMap[mKey]) {
            materialsMap[mKey] = { product: prod, totalQty: 0, unit: g.unit, totalArea: 0, period: g.periods.join(', '), workName: g.name };
          }
          materialsMap[mKey].totalQty += g.totalQty;
          materialsMap[mKey].totalArea = Math.max(materialsMap[mKey].totalArea, g.totalArea);
          if (g.periods.length > 0 && !materialsMap[mKey].period.includes(g.periods[0])) {
            materialsMap[mKey].period += ', ' + g.periods.join(', ');
          }
        }
      }
    }

    const materials = Object.values(materialsMap).map(m => ({
      product: m.product,
      totalQty: Math.round(m.totalQty * 100) / 100,
      unit: m.unit,
      qtyPerHa: m.totalArea > 0 ? Math.round((m.totalQty / m.totalArea) * 100) / 100 : 0,
      period: m.period,
      workName: m.workName
    }));

    res.json({
      crop: crop ? crop.toJSON() : null,
      year: Number(year),
      totalArea: Math.round(totalArea * 100) / 100,
      parcelCount,
      mechanical,
      manual,
      inputs,
      materials
    });
  } catch (error) {
    console.error('Eroare la generarea fisei tehnologice:', error.message);
    res.status(500).json({ message: 'Eroare de server.' });
  }
};
