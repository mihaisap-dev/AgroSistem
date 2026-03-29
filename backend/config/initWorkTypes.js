const { WorkType } = require('../models');

const initWorkTypes = async () => {
  const count = await WorkType.count();
  if (count > 0) return;

  const types = [
    { name: "Discuit resturi vegetale", category: "Lucrări mecanice" },
    { name: "Arat", category: "Lucrări mecanice" },
    { name: "Fertilizat", category: "Lucrări mecanice" },
    { name: "Discuit", category: "Lucrări mecanice" },
    { name: "Pregătire teren pentru semănat", category: "Lucrări mecanice" },
    { name: "Semănat", category: "Lucrări mecanice" },
    { name: "Erbicidat", category: "Lucrări mecanice" },
    { name: "Fertilizat fazial", category: "Lucrări mecanice" },
    { name: "Recoltat", category: "Lucrări mecanice" },
    { name: "Transport recoltă", category: "Lucrări mecanice" },
    { name: "Transport îngrășăminte", category: "Lucrări mecanice" },
    { name: "Transport sămânță", category: "Lucrări mecanice" },
    { name: "Transport apă erbicidat", category: "Lucrări mecanice" },
    { name: "Prășit", category: "Lucrări mecanice" },
    { name: "Încărcat/descărcat îngrășăminte", category: "Lucrări manuale" },
    { name: "Încărcat/descărcat sămânță", category: "Lucrări manuale" },
    { name: "Deservit mașină fertilizat", category: "Lucrări manuale" },
    { name: "Deservit semănătoare", category: "Lucrări manuale" },
    { name: "Deservit mașină erbicidat", category: "Lucrări manuale" },
    { name: "Sămânță certificată", category: "Input-uri" },
    { name: "Îngrășăminte chimice complexe", category: "Input-uri" },
    { name: "Îngrășăminte azotat de amoniu", category: "Input-uri" },
    { name: "Erbicid", category: "Input-uri" },
    { name: "Apă", category: "Input-uri" },
    { name: "Încheiere poliță asigurare", category: "Altele" },
  ];

  await WorkType.bulkCreate(types);
  console.log('Tipurile de lucrari au fost initializate.');
};

module.exports = initWorkTypes;
