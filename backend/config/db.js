const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    dialect: 'postgres',
    port: process.env.DB_PORT,
    logging: false, // Oprim afisarea interogarilor SQL in consola pentru claritate
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('Conexiunea la baza de date PostgreSQL a fost stabilita cu succes.');
  } catch (error) {
    console.error('Nu s-a putut conecta la baza de date:', error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
