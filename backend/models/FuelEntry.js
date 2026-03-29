const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const FuelEntry = sequelize.define('FuelEntry', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  liters: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  pricePerLiter: {
    type: DataTypes.FLOAT,
  },
  equipment: {
    type: DataTypes.STRING,
  },
  workDescription: {
    type: DataTypes.STRING,
  },
  invoiceNumber: {
    type: DataTypes.STRING,
  },
  supplier: {
    type: DataTypes.STRING,
  },
  notes: {
    type: DataTypes.TEXT,
  },
}, {
  timestamps: true,
});

module.exports = FuelEntry;
