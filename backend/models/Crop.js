const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Crop = sequelize.define('Crop', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  genus: {
    type: DataTypes.STRING,
  },
  type: {
    type: DataTypes.STRING,
  },
}, {
  timestamps: false,
});

module.exports = Crop;
