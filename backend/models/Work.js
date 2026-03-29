const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Work = sequelize.define('Work', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  period: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  equipment: {
    type: DataTypes.STRING,
  },
  products: {
    type: DataTypes.STRING,
  },
  qtyPerHa: {
    type: DataTypes.FLOAT,
  },
  unit: {
    type: DataTypes.STRING,
    defaultValue: 'kg',
  },
  notes: {
    type: DataTypes.TEXT,
  },
}, {
  timestamps: true,
});

module.exports = Work;
