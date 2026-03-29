const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const FuelEntry = sequelize.define('FuelEntry', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'CONSUM'
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
    allowNull: true,
  },
  equipment: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  workDescription: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  invoiceNumber: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  supplier: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  }
}, {
  timestamps: true,
});

module.exports = FuelEntry;
