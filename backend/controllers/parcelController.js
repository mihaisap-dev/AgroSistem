const { Parcel, Block } = require('../models');

exports.createParcel = async (req, res) => {
  try {
    const { blockId, parcelNumber, areaHa, landCategory } = req.body;
    const newParcel = await Parcel.create({ blockId, parcelNumber, areaHa, landCategory });
    res.status(201).json(newParcel);
  } catch (error) {
    console.error('Eroare la crearea parcelei:', error.message);
    res.status(500).json({ message: 'Eroare de server la crearea parcelei.' });
  }
};

exports.updateParcel = async (req, res) => {
  try {
    const { id } = req.params;
    const { parcelNumber, areaHa, landCategory, blockId } = req.body;
    const parcel = await Parcel.findByPk(id);
    if (!parcel) return res.status(404).json({ message: 'Parcela nu a fost gasita.' });
    await parcel.update({ parcelNumber, areaHa, landCategory, blockId });
    res.json(parcel);
  } catch (error) {
    console.error('Eroare la actualizarea parcelei:', error.message);
    res.status(500).json({ message: 'Eroare de server.' });
  }
};

exports.deleteParcel = async (req, res) => {
  try {
    const { id } = req.params;
    const parcel = await Parcel.findByPk(id);
    if (!parcel) return res.status(404).json({ message: 'Parcela nu a fost gasita.' });
    await parcel.destroy();
    res.json({ message: 'Parcela a fost stearsa.' });
  } catch (error) {
    console.error('Eroare la stergerea parcelei:', error.message);
    res.status(500).json({ message: 'Eroare de server.' });
  }
};
