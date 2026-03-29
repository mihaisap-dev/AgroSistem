const User = require('./User');
const Farm = require('./Farm');
const Block = require('./Block');
const Parcel = require('./Parcel');
const Crop = require('./Crop');
const ParcelSeason = require('./ParcelSeason');
const WorkType = require('./WorkType');
const Work = require('./Work');
const HarvestSession = require('./HarvestSession');
const Harvest = require('./Harvest');
const FuelEntry = require('./FuelEntry');

// Relatii Utilizator -> Ferme
User.hasMany(Farm, { foreignKey: 'userId', as: 'ferme' });
Farm.belongsTo(User, { foreignKey: 'userId' });

// Relatii Ferma -> Blocuri Fizice
Farm.hasMany(Block, { foreignKey: 'farmId', as: 'blocuri' });
Block.belongsTo(Farm, { foreignKey: 'farmId' });

// Relatii Bloc Fizic -> Parcele
Block.hasMany(Parcel, { foreignKey: 'blockId', as: 'parcele', onDelete: 'CASCADE' });
Parcel.belongsTo(Block, { foreignKey: 'blockId', as: 'block' });

// Relatii Parcela -> Sezoane (Istoric)
Parcel.hasMany(ParcelSeason, { foreignKey: 'parcelId', as: 'sezoane', onDelete: 'CASCADE' });
ParcelSeason.belongsTo(Parcel, { foreignKey: 'parcelId', as: 'parcel' });

// Relatii Cultura -> Sezoane
Crop.hasMany(ParcelSeason, { foreignKey: 'cropId', as: 'sezoane' });
ParcelSeason.belongsTo(Crop, { foreignKey: 'cropId', as: 'cultura' });

// Relatii Sezon -> Lucrari
ParcelSeason.hasMany(Work, { foreignKey: 'parcelSeasonId', as: 'lucrari', onDelete: 'CASCADE' });
Work.belongsTo(ParcelSeason, { foreignKey: 'parcelSeasonId', as: 'sezon' });

// Relatii Tip Lucrare -> Lucrari
WorkType.hasMany(Work, { foreignKey: 'workTypeId', as: 'instante' });
Work.belongsTo(WorkType, { foreignKey: 'workTypeId', as: 'tip' });

// Relatii Ferma -> Sesiuni Recoltare
Farm.hasMany(HarvestSession, { foreignKey: 'farmId', as: 'recoltari' });
HarvestSession.belongsTo(Farm, { foreignKey: 'farmId' });

// Relatii ParcelSeason -> Harvest (recoltari individuale)
ParcelSeason.hasMany(Harvest, { foreignKey: 'parcelSeasonId', as: 'harvests', onDelete: 'CASCADE' });
Harvest.belongsTo(ParcelSeason, { foreignKey: 'parcelSeasonId', as: 'sezon' });

// Relatii Ferma -> FuelEntry (motorina)
Farm.hasMany(FuelEntry, { foreignKey: 'farmId', as: 'fuelEntries', onDelete: 'CASCADE' });
FuelEntry.belongsTo(Farm, { foreignKey: 'farmId' });

// Relatii opționale: FuelEntry -> ParcelSeason (pentru a lega consumul de o lucrare)
ParcelSeason.hasMany(FuelEntry, { foreignKey: 'parcelSeasonId', as: 'fuel', onDelete: 'SET NULL' });
FuelEntry.belongsTo(ParcelSeason, { foreignKey: 'parcelSeasonId', as: 'sezon' });

module.exports = {
  User,
  Farm,
  Block,
  Parcel,
  Crop,
  ParcelSeason,
  WorkType,
  Work,
  HarvestSession,
  Harvest,
  FuelEntry
};
