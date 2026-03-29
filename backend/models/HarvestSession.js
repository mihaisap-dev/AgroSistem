const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const HarvestSession = sequelize.define('HarvestSession', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  harvestDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  totalQuantityKg: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  totalAreaHa: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  timestamps: true,
});

module.exports = HarvestSession;
