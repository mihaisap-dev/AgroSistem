const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDB, sequelize } = require('./config/db');
const models = require('./models');
const initCrops = require('./config/initCrops');
const initWorkTypes = require('./config/initWorkTypes');

dotenv.config();

const startServer = async () => {
  try {
    await connectDB();
    await sequelize.sync({ alter: true });
    console.log('Tabelele au fost sincronizate cu succes.');

    await initCrops();
    await initWorkTypes();

    const app = express();
    const PORT = process.env.PORT || 5001;

    app.use((req, res, next) => {
      console.log(`${req.method} ${req.url}`);
      next();
    });

    app.use(cors({
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));

    app.use(express.json());

    // Rute
    app.use('/api/auth', require('./routes/authRoutes'));
    app.use('/api/farms', require('./routes/farmRoutes'));
    app.use('/api/blocks', require('./routes/blockRoutes'));
    app.use('/api/parcels', require('./routes/parcelRoutes'));
    app.use('/api/crops', require('./routes/cropRoutes'));
    app.use('/api/seasons', require('./routes/parcelSeasonRoutes'));
    app.use('/api/works', require('./routes/workRoutes'));
    app.use('/api/harvests', require('./routes/harvestRoutes'));
    app.use('/api/fuel', require('./routes/fuelRoutes'));
    app.use('/api/reports', require('./routes/reportRoutes'));

    app.get('/', (req, res) => {
      res.send('API AgroSistem ruleaza corect!');
    });

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Serverul ruleaza pe portul: ${PORT}`);
    });
  } catch (error) {
    console.error('Eroare la pornirea serverului:', error.message);
  }
};

startServer();
