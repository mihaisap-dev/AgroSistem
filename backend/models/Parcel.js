const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Parcel = sequelize.define('Parcel', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  parcelNumber: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  areaHa: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  landCategory: {
    type: DataTypes.STRING,
    defaultValue: 'TA',
  },
}, {
  timestamps: true,
});

module.exports = Parcel;
