require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/smart-waste';

const Bin = require('./models/Bin');
const seedAdmin = require('./utils/seedAdmin');
const startSimulator = require('./utils/simulator');

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log(`Connected to MongoDB: ${MONGO_URI}`);
    
    try {
      const count = await Bin.countDocuments();
      if (count === 0) {
        console.log('[MONITORING] Database empty. Seeding random Punjab bins...');
        const baseLocations = [
          { name: 'Ludhiana', coord: [30.900965, 75.857275] },
          { name: 'Amritsar', coord: [31.633980, 74.872261] },
          { name: 'Jalandhar', coord: [31.326015, 75.576182] },
          { name: 'Patiala', coord: [30.339780, 76.386879] }
        ];
        
        const generateBins = [];
        for (let i = 0; i < 15; i++) {
          const base = baseLocations[Math.floor(Math.random() * baseLocations.length)];
          const fill = Math.floor(Math.random() * 80);
          let stat = 'Normal';
          if (fill >= 50) stat = 'Warning';
          if (fill >= 80) stat = 'Critical';

          generateBins.push({
            location: `${base.name} Zone ${i + 1}`,
            fillLevel: fill,
            status: stat,
            coords: [
              base.coord[0] + (Math.random() - 0.5) * 0.08,
              base.coord[1] + (Math.random() - 0.5) * 0.08
            ]
          });
        }
        await Bin.insertMany(generateBins);
        console.log('[MONITORING] Punjab conditional seeding complete.');
      } else {
        console.log(`[MONITORING] Bins structure populated (${count} bins). Preserving existing data.`);
      }
      
      await seedAdmin();
      startSimulator();
    } catch (err) {
      console.error('Error during seeding:', err);
    }

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  });
