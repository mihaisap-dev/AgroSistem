const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Farm = sequelize.define('Farm', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  cui: {
    type: DataTypes.STRING,
  },
  locality: {
    type: DataTypes.STRING,
  },
  county: {
    type: DataTypes.STRING,
  },
  iban: {
    type: DataTypes.STRING,
  },
  bank: {
    type: DataTypes.STRING,
  },
  registerNumber: {
    type: DataTypes.STRING,
  },
}, {
  timestamps: true,
});

module.exports = Farm;
