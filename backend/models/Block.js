const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Block = sequelize.define('Block', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  blockNumber: {
    type: DataTypes.STRING, // Modificat in STRING conform promptului (ex: "185")
    allowNull: false,
    unique: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  locality: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  county: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  sirutaCode: {
    type: DataTypes.STRING,
    allowNull: true,
  }
}, {
  timestamps: true,
});

module.exports = Block;
