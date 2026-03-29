const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const ParcelSeason = sequelize.define('ParcelSeason', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  season: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  rotationWarning: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  drIntervention: {
    type: DataTypes.STRING,
    defaultValue: '',
  },
}, {
  timestamps: true,
});

module.exports = ParcelSeason;
