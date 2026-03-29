const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const WorkType = sequelize.define('WorkType', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  category: {
    type: DataTypes.STRING, // Lucrari mecanice, manuale, Input-uri, etc.
    allowNull: false,
  },
}, {
  timestamps: false,
});

module.exports = WorkType;
