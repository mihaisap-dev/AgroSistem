const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Harvest = sequelize.define('Harvest', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  harvestDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  quantityKg: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  humidity: {
    type: DataTypes.FLOAT,
  },
  avizNumber: {
    type: DataTypes.STRING,
  },
  destination: {
    type: DataTypes.STRING,
  },
}, {
  timestamps: true,
});

module.exports = Harvest;
