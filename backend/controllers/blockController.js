const { Block, Parcel } = require('../models');

exports.createBlock = async (req, res) => {
  try {
    const { farmId, blockNumber, name, sirutaCode, locality, county } = req.body;
    const newBlock = await Block.create({ farmId, blockNumber, name, sirutaCode, locality, county });
    res.status(201).json(newBlock);
  } catch (error) {
    console.error('Eroare la crearea blocului:', error.message);
    res.status(500).json({ message: 'Eroare de server la crearea blocului.' });
  }
};

exports.getBlocksByFarm = async (req, res) => {
  try {
    const { farmId } = req.params;
    const blocks = await Block.findAll({
      where: { farmId },
      include: [{ model: Parcel, as: 'parcele' }],
      order: [['blockNumber', 'ASC']]
    });
    res.json(blocks);
  } catch (error) {
    console.error('Eroare la obtinerea blocurilor:', error.message);
    res.status(500).json({ message: 'Eroare de server la obtinerea blocurilor.' });
  }
};

exports.updateBlock = async (req, res) => {
  try {
    const { id } = req.params;
    const { blockNumber, name, sirutaCode, locality, county } = req.body;
    const block = await Block.findByPk(id);
    if (!block) return res.status(404).json({ message: 'Blocul nu a fost gasit.' });
    await block.update({ blockNumber, name, sirutaCode, locality, county });
    res.json(block);
  } catch (error) {
    console.error('Eroare la actualizarea blocului:', error.message);
    res.status(500).json({ message: 'Eroare de server.' });
  }
};

exports.deleteBlock = async (req, res) => {
  try {
    const { id } = req.params;
    const block = await Block.findByPk(id);
    if (!block) return res.status(404).json({ message: 'Blocul nu a fost gasit.' });
    await block.destroy();
    res.json({ message: 'Blocul si toate parcelele sale au fost sterse.' });
  } catch (error) {
    console.error('Eroare la stergerea blocului:', error.message);
    res.status(500).json({ message: 'Eroare de server.' });
  }
};
