const { Crop } = require('../models');

const initCrops = async () => {
  const count = await Crop.count();
  if (count === 0) {
    const crops = [
      { name: "Grâu comun de toamnă", genus: "Triticum", type: "cereale" },
      { name: "Orz de toamnă", genus: "Hordeum", type: "cereale" },
      { name: "Porumb", genus: "Zea", type: "cereale" },
      { name: "Floarea Soarelui", genus: "Helianthus", type: "oleaginoase" },
      { name: "Mazăre Boabe", genus: "Pisum", type: "leguminoase" },
      { name: "Rapiță", genus: "Brassica", type: "oleaginoase" },
      { name: "Soia", genus: "Glycine", type: "leguminoase" },
      { name: "Sfeclă de zahăr", genus: "Beta", type: "industriale" },
    ];
    await Crop.bulkCreate(crops);
    console.log('Lista de culturi a fost initializata.');
  }
};

module.exports = initCrops;
